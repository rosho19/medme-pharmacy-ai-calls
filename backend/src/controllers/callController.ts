import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { CallStatus } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { initiateOutboundCall } from '../services/vapi';

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

    // Create as IN_PROGRESS (no more PENDING)
    const call = await prisma.call.create({
      data: { patientId, status: CallStatus.IN_PROGRESS },
      include: { patient: { select: { id: true, name: true, phone: true } } },
    });

    await prisma.callLog.create({
      data: {
        callId: call.id,
        eventType: 'CALL_INITIATED',
        data: { patientName: patient.name, patientPhone: patient.phone },
      },
    });

    if (process.env.MOCK_VAPI === 'true') {
      // Simulate transcript and completion after 10s
      const t0 = new Date();
      const agent = (text: string) => ({ eventType: 'TRANSCRIPT', data: { speaker: 'agent', text } });
      const user = (text: string) => ({ eventType: 'TRANSCRIPT', data: { speaker: 'patient', text } });

      const transcript = [
        agent('Hello, this is Riley from Specialty Pharmacies. May I confirm your full name, phone, and address?'),
        user(`${patient.name}, ${patient.phone}, ${patient.address ?? 'address confirmed'}`),
        agent('Thanks. When will you be available at home for your upcoming delivery?'),
        user('Friday between 2 and 4 PM works for me.'),
        agent('Any changes in your medication needs? Skipped doses or delayed refills?'),
        user('No changes this month.'),
        agent('Any feedback about your last shipment?'),
        user('Everything arrived on time and in good condition.'),
      ]

      for (const l of transcript) {
        await prisma.callLog.create({ data: { callId: call.id, ...l, timestamp: new Date() } })
      }

      setTimeout(async () => {
        const summary = [
          `Identity verified for ${patient.name} (${patient.phone}, ${patient.address ?? 'address on file'}).`,
          'Availability: Friday 2–4 PM.',
          'Medication changes: None.',
          'Shipment feedback: On time, no issues.',
        ].join(' ')

        await prisma.call.update({
          where: { id: call.id },
          data: { status: CallStatus.COMPLETED, summary, completedAt: new Date(t0.getTime() + 10000) },
        })

        await prisma.callLog.create({
          data: {
            callId: call.id,
            eventType: 'CALL_ENDED',
            data: { reason: 'completed(mock)', durationSeconds: 10 },
          },
        })
      }, 10000)
    } else {
      // Real integration
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
