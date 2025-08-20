import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { CallStatus } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { initiateOutboundCall } from '../services/vapi';

function getMockOutcome(patient: { name: string; address?: string | null }) {
  const lower = (patient.name || '').toLowerCase();

  if (lower.includes('chloe')) {
    return {
      summary:
        'Patient available Wednesday 1–3 PM. No medication changes. No shipment issues reported.',
      structuredData: {
        availability: { day: 'Wednesday', window: '1–3 PM' },
        medicationChanges: 'None',
        shipmentIssues: 'None',
        identityVerified: true,
        success: true,
      },
      transcripts: [
        { speaker: 'agent', text: 'Hello, this is the pharmacy calling to coordinate your delivery. May I verify your name and address?' },
        { speaker: 'patient', text: 'Yes, this is correct. I can do Wednesday between 1 and 3 PM.' },
        { speaker: 'agent', text: 'Great, I have you down for Wednesday 1–3 PM. No changes to medications, correct?' },
        { speaker: 'patient', text: 'Correct. Everything is the same.' },
      ],
    };
  }

  if (lower.includes('ben')) {
    return {
      summary:
        'Patient available Thursday 3–5 PM. Medication dose adjusted to 1000mg nightly starting next refill. No shipment issues reported.',
      structuredData: {
        availability: { day: 'Thursday', window: '3–5 PM' },
        medicationChanges: 'Increase Metformin to 1000mg nightly next refill',
        shipmentIssues: 'None',
        identityVerified: true,
        success: true,
      },
      transcripts: [
        { speaker: 'agent', text: 'Hi, calling from the specialty pharmacy. Let us verify your name and address for security.' },
        { speaker: 'patient', text: 'Details verified. I am available Thursday from 3 to 5 PM.' },
        { speaker: 'agent', text: 'Any changes to your medications since last month?' },
        { speaker: 'patient', text: 'My doctor increased Metformin to 1000mg nightly.' },
      ],
    };
  }

  // Default to Alice-style outcome
  return {
    summary:
      'Patient available Friday 2–4 PM. No medication changes. Reported last delivery arrived 1 day late; medication intact.',
    structuredData: {
      availability: { day: 'Friday', window: '2–4 PM' },
      medicationChanges: 'None',
      shipmentIssues: 'Late by 1 day, contents OK',
      identityVerified: true,
      success: true,
    },
    transcripts: [
      { speaker: 'agent', text: 'Hello, this is the pharmacy. May I confirm your name and delivery address?' },
      { speaker: 'patient', text: 'Confirmed. I can do Friday between 2 and 4 PM.' },
      { speaker: 'agent', text: 'Thanks. Any issues with your last delivery or changes to meds?' },
      { speaker: 'patient', text: 'Last box came a day late, but everything was fine. No changes.' },
    ],
  };
}

// @desc    Get all calls
// @route   GET /api/calls
// @access  Public
export const getCalls = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, status, patientId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status) where.status = status;
    if (patientId) where.patientId = String(patientId);

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

      const outcome = getMockOutcome(patient);

      setTimeout(async () => {
        try {
          // Append transcript logs
          for (const line of outcome.transcripts) {
            await prisma.callLog.create({
              data: { callId: call.id, eventType: 'TRANSCRIPT', data: line },
            });
          }

          // Complete the call
          await prisma.call.update({
            where: { id: call.id },
            data: {
              status: CallStatus.COMPLETED,
              summary: outcome.summary,
              structuredData: outcome.structuredData as any,
              completedAt: new Date(),
            },
          });

          await prisma.callLog.create({
            data: {
              callId: call.id,
              eventType: 'CALL_ENDED',
              data: { reason: 'completed (mock)' },
            },
          });
        } catch (mockErr) {
          // Best-effort logging if something goes wrong during timeout
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
      await prisma.callLog.create({
        data: {
          callId: call.id,
          eventType: 'VAPI_ERROR',
          data: { message: vapiError?.message ?? 'Unknown Vapi error' },
        },
      });
    }

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

    const call = await prisma.call.findUnique({ where: { id } });
    if (!call) {
      res.status(404).json({ success: false, error: 'Call not found' });
      return;
    }

    const updateData: any = { status };
    if (summary) updateData.summary = summary;
    if (structuredData) updateData.structuredData = structuredData;
    if (callSid) updateData.callSid = callSid;
    if (status === CallStatus.COMPLETED || status === CallStatus.FAILED || status === CallStatus.CANCELLED) {
      updateData.completedAt = new Date();
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
        data: { oldStatus: call.status, newStatus: status, summary, structuredData },
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
