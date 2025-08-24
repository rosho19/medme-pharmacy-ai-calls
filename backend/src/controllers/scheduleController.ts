import { Request, Response, NextFunction } from 'express'
import { prisma } from '../utils/prisma'
import { body, validationResult } from 'express-validator'
import { ScheduleStatus } from '@prisma/client'

export const scheduleValidation = [
  body('patientId').notEmpty().withMessage('patientId is required'),
  body('startAt').isISO8601().withMessage('startAt must be ISO date'),
  body('retryIntervalMinutes').optional().isInt({ min: 5, max: 24 * 60 }),
  body('maxAttempts').optional().isInt({ min: 1, max: 10 }),
  body('voicemailTemplate').optional().isString(),
]

export const createSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() })
      return
    }

    const { patientId, startAt, retryIntervalMinutes = 60, maxAttempts = 3, voicemailTemplate } = req.body

    const patient = await prisma.patient.findUnique({ where: { id: patientId } })
    if (!patient) {
      res.status(404).json({ success: false, error: 'Patient not found' })
      return
    }

    const start = new Date(startAt)
    const nextAttemptAt = start

    const scheduled = await prisma.scheduledCall.create({
      data: {
        patientId,
        startAt: start,
        retryIntervalMinutes: Number(retryIntervalMinutes),
        maxAttempts: Number(maxAttempts),
        attemptsMade: 0,
        nextAttemptAt,
        status: ScheduleStatus.SCHEDULED,
        voicemailTemplate: voicemailTemplate || null,
      },
      include: { patient: { select: { id: true, name: true, phone: true } } },
    })

    res.status(201).json({ success: true, data: scheduled })
  } catch (e) {
    next(e)
  }
}

export const listSchedules = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await prisma.scheduledCall.findMany({ orderBy: { createdAt: 'desc' }, include: { patient: true } })
    res.status(200).json({ success: true, data: items })
  } catch (e) {
    next(e)
  }
}

export const getSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await prisma.scheduledCall.findUnique({ where: { id: req.params.id }, include: { attempts: true, patient: true } })
    if (!item) {
      res.status(404).json({ success: false, error: 'Schedule not found' })
      return
    }
    res.status(200).json({ success: true, data: item })
  } catch (e) {
    next(e)
  }
}

export const cancelSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await prisma.scheduledCall.update({ where: { id: req.params.id }, data: { status: ScheduleStatus.CANCELLED } })
    res.status(200).json({ success: true, data: updated })
  } catch (e) {
    next(e)
  }
}


