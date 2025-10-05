import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { CallStatus } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { initiateOutboundCall } from '../services/vapi';
import { createAndDispatchCall } from '../services/callInitiator';


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

		const call = await createAndDispatchCall(patientId)


		res.status(201).json({ success: true, data: call, message: 'Call initiated' });
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
