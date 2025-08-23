import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { CallStatus } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { initiateOutboundCall } from '../services/vapi';

function getMockOutcome(patient: { name: string; address?: string | null; medicationInfo?: any }) {
  const lower = (patient.name || '').toLowerCase();
  const primaryDrug = Array.isArray(patient.medicationInfo) && patient.medicationInfo.length > 0
    ? String(patient.medicationInfo[0]?.drug || 'medication')
    : 'medication';

  if (lower.includes('chloe')) {
    return {
      summary:
        'Patient available Wednesday 1–3 PM. No medication changes. No shipment issues reported.',
      structuredData: {
        availability: { day: 'Wednesday', window: '1–3 PM' },
        medicationChanges: 'None',
        shipmentIssues: 'None',
        success: true,
      },
      transcripts: [
        { speaker: 'agent', text: 'Calling to coordinate your delivery today.' },
        { speaker: 'agent', text: 'Any changes to your medications?' },
        { speaker: 'patient', text: 'No changes.' },
        { speaker: 'agent', text: 'Any issues with your last shipment?' },
        { speaker: 'patient', text: 'No issues.' },
        { speaker: 'agent', text: 'What delivery window works this week?' },
        { speaker: 'patient', text: 'Wednesday between 1 and 3 PM.' },
      ],
    };
  }

  if (lower.includes('ben')) {
    return {
      summary:
        'Patient available Thursday 3–5 PM. Medication dose adjusted to 1000mg nightly starting next refill. No shipment issues reported.',
      structuredData: {
        availability: { day: 'Thursday', window: '3–5 PM' },
        medicationChanges: `Increase ${primaryDrug} to 1000mg nightly next refill`,
        shipmentIssues: 'None',
        success: true,
      },
      transcripts: [
        { speaker: 'agent', text: 'Calling to confirm details for your upcoming delivery.' },
        { speaker: 'agent', text: 'Any changes to your medications since last month?' },
        { speaker: 'patient', text: `Yes, ${primaryDrug} increased to 1000mg nightly.` },
        { speaker: 'agent', text: 'Noted. Any shipment issues previously?' },
        { speaker: 'patient', text: 'No issues.' },
        { speaker: 'agent', text: 'Preferred delivery window?' },
        { speaker: 'patient', text: 'Thursday 3 to 5 PM.' },
      ],
    };
  }

  // Default (Alice-style) outcome
  return {
    summary:
      'Patient available Friday 2–4 PM. No medication changes. Reported last delivery arrived 1 day late; medication intact.',
    structuredData: {
      availability: { day: 'Friday', window: '2–4 PM' },
      medicationChanges: 'None',
      shipmentIssues: 'Late by 1 day, contents OK',
      success: true,
    },
    transcripts: [
      { speaker: 'agent', text: 'Calling to coordinate your medication delivery.' },
      { speaker: 'agent', text: 'Any changes to your medications?' },
      { speaker: 'patient', text: 'No changes.' },
      { speaker: 'agent', text: 'Any issues with your last shipment?' },
      { speaker: 'patient', text: 'It arrived a day late, but medication was fine.' },
      { speaker: 'agent', text: 'What delivery window works this week?' },
      { speaker: 'patient', text: 'Friday between 2 and 4 PM.' },
    ],
  };
}

// @desc    Get all calls
// @route   GET /api/calls
// @access  Public
export const getCalls = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, status, patientId, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status) where.status = status;
    if (patientId) where.patientId = String(patientId);
    if (search) {
      const q = String(search);
      where.OR = [
        { summary: { contains: q, mode: 'insensitive' } },
        { patient: { name: { contains: q, mode: 'insensitive' } } },
        { patient: { phone: { contains: q } } },
      ];
    }

    const [calls, total] = await Promise.all([
      prisma.call.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { select: { id: true, name: true, phone: true } },
          callLogs: { orderBy: { timestamp: 'desc' }, take: 5 },
        },
      }),
      prisma.call.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: calls,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single call
// @route   GET /api/calls/:id
// @access  Public
export const getCall = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const call = await prisma.call.findUnique({
      where: { id },
      include: {
        patient: true,
        callLogs: { orderBy: { timestamp: 'desc' } },
      },
    });

    if (!call) {
      res.status(404).json({ success: false, error: 'Call not found' });
      return;
    }

    res.status(200).json({ success: true, data: call });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new call (trigger AI call)
// @route   POST /api/calls
// @access  Public
export const createCall = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
      return;
    }

    const { patientId } = req.body;

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      res.status(404).json({ success: false, error: 'Patient not found' });
      return;
    }

    const call = await prisma.call.create({
      data: { patientId, status: CallStatus.PENDING },
      include: { patient: { select: { id: true, name: true, phone: true } } },
    });

    await prisma.callLog.create({
      data: {
        callId: call.id,
        eventType: 'CALL_INITIATED',
        data: { patientName: patient.name, patientPhone: patient.phone },
      },
    });

    // MOCK mode: bypass Vapi and simulate a successful call after 10 seconds
    if (process.env.MOCK_VAPI === 'true') {
      const updated = await prisma.call.update({
        where: { id: call.id },
        data: { status: CallStatus.IN_PROGRESS, callSid: `mock-${call.id}` },
        include: { patient: { select: { id: true, name: true, phone: true } } },
      });

      await prisma.callLog.create({
        data: {
          callId: call.id,
          eventType: 'MOCK_STARTED',
          data: { note: 'Mock Vapi call started' },
        },
      });

      const outcome = getMockOutcome(patient as any);

      setTimeout(async () => {
        try {
          // Skip if already completed with summary (e.g., manual fast-forward)
          const latest = await prisma.call.findUnique({ where: { id: call.id } });
          if (latest && latest.status === CallStatus.COMPLETED && latest.summary) {
            return;
          }

          // Prepend a standard verification step
          const verification = [
            { speaker: 'agent', text: 'For security, may I verify your details on file?' },
            { speaker: 'patient', text: 'Confirmed.' },
          ];
          for (const line of verification.concat(outcome.transcripts)) {
            await prisma.callLog.create({
              data: { callId: call.id, eventType: 'TRANSCRIPT', data: line },
            });
          }

          // Complete the call
          const created = latest?.createdAt || new Date();
          const durationSec = 60 + Math.floor(Math.random() * 61); // 60-120s successes
          await prisma.call.update({
            where: { id: call.id },
            data: {
              status: CallStatus.COMPLETED,
              summary: outcome.summary,
              structuredData: outcome.structuredData as any,
              completedAt: new Date(created.getTime() + durationSec * 1000),
            },
          });

          await prisma.callLog.create({
            data: {
              callId: call.id,
              eventType: 'CALL_ENDED',
              data: { reason: 'completed' },
            },
          });
        } catch (mockErr) {
          await prisma.callLog.create({
            data: {
              callId: call.id,
              eventType: 'MOCK_ERROR',
              data: { message: (mockErr as any)?.message || 'Unknown mock error' },
            },
          });
        }
      }, 10000);

      res.status(201).json({ success: true, data: updated, message: 'Mock call started' });
      return;
    }

    // Integrate with Vapi to trigger actual call
    try {
      const vapiResult = await initiateOutboundCall({
        toPhoneNumber: patient.phone,
        patientId,
        patientName: patient.name,
      });

      if ((vapiResult as any)?.id) {
        await prisma.call.update({
          where: { id: call.id },
          data: { callSid: String((vapiResult as any).id) },
        });

        await prisma.callLog.create({
          data: {
            callId: call.id,
            eventType: 'VAPI_DISPATCHED',
            data: { vapiCallId: (vapiResult as any).id, status: (vapiResult as any)?.status },
          },
        });
      }
    } catch (vapiError: any) {
      // If Vapi dispatch fails, automatically mark the call as FAILED and end the lifecycle
      await prisma.callLog.create({
        data: {
          callId: call.id,
          eventType: 'VAPI_ERROR',
          data: { message: vapiError?.message ?? 'Unknown Vapi error' },
        },
      });

      const failedCall = await prisma.call.update({
        where: { id: call.id },
        data: {
          status: CallStatus.FAILED,
          completedAt: new Date(),
          structuredData: { error: vapiError?.message ?? 'Unknown Vapi error' } as any,
        },
        include: { patient: { select: { id: true, name: true, phone: true } } },
      });

      await prisma.callLog.create({
        data: {
          callId: call.id,
          eventType: 'CALL_ENDED',
          data: { reason: 'failed' },
        },
      });

      res.status(201).json({ success: true, data: failedCall, message: 'Call failed to initiate' });
      return;
    }

    // If dispatch succeeded (or no error thrown), return the created call
    res.status(201).json({ success: true, data: call, message: 'Call initiated successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update call status
// @route   PATCH /api/calls/:id/status
// @access  Public
export const updateCallStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, summary, structuredData, callSid } = req.body;

    if (!Object.values(CallStatus).includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid call status' });
      return;
    }

    const call = await prisma.call.findUnique({ where: { id }, include: { patient: true } });
    if (!call) {
      res.status(404).json({ success: false, error: 'Call not found' });
      return;
    }

    const updateData: any = { status };

    // In MOCK mode, if manually completing without provided summary, generate predetermined outcome instantly
    if (process.env.MOCK_VAPI === 'true' && status === CallStatus.COMPLETED && !summary && !structuredData) {
      const outcome = getMockOutcome(call.patient as any);
      // Append transcript logs before completion
      for (const line of outcome.transcripts) {
        await prisma.callLog.create({
          data: { callId: id, eventType: 'TRANSCRIPT', data: line },
        });
      }
      updateData.summary = outcome.summary;
      updateData.structuredData = outcome.structuredData as any;
      updateData.completedAt = new Date();
    } else {
      if (summary) updateData.summary = summary;
      if (structuredData) updateData.structuredData = structuredData;
      if (callSid) updateData.callSid = callSid;
      if (
        status === CallStatus.COMPLETED ||
        status === CallStatus.FAILED ||
        status === CallStatus.CANCELLED
      ) {
        updateData.completedAt = new Date();
      }
    }

    const updatedCall = await prisma.call.update({
      where: { id },
      data: updateData,
      include: { patient: { select: { id: true, name: true, phone: true } } },
    });

    await prisma.callLog.create({
      data: {
        callId: id,
        eventType: 'STATUS_UPDATED',
        data: { oldStatus: call.status, newStatus: status, summary: updateData.summary, structuredData: updateData.structuredData },
      },
    });

    res.status(200).json({ success: true, data: updatedCall });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete call
// @route   DELETE /api/calls/:id
// @access  Public
export const deleteCall = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const call = await prisma.call.findUnique({ where: { id } });
    if (!call) {
      res.status(404).json({ success: false, error: 'Call not found' });
      return;
    }

    await prisma.call.delete({ where: { id } });

    res.status(200).json({ success: true, message: 'Call deleted successfully' });
  } catch (error) {
    next(error);
  }
};
