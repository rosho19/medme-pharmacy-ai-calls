import { prisma } from '../utils/prisma'
import { AttemptOutcome, CallStatus, ScheduleStatus } from '@prisma/client'
import { createAndDispatchCall } from './callInitiator'

export class CallSchedulerService {
  private timer: NodeJS.Timeout | null = null
  private readonly intervalMs: number
  private isTicking = false

  constructor(intervalMs = 30_000) {
    this.intervalMs = intervalMs
  }

  public start(): void {
    if (this.timer) return
    this.timer = setInterval(() => {
      this.tick().catch((e) => console.error('Scheduler tick error', e))
    }, this.intervalMs)
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  private async tick(): Promise<void> {
    if (this.isTicking) return
    this.isTicking = true
    const now = new Date()

    // Find due scheduled calls
    const due = await prisma.scheduledCall.findMany({
      where: {
        status: { in: [ScheduleStatus.SCHEDULED, ScheduleStatus.RUNNING] },
        nextAttemptAt: { lte: now },
      },
      take: 10,
      orderBy: { nextAttemptAt: 'asc' },
    })

    for (const s of due) {
      await this.dispatchAttempt(s.id).catch((e) => console.error('Dispatch attempt error', e))
    }
    this.isTicking = false
  }

  public async dispatchAttempt(scheduledCallId: string): Promise<void> {
    const scheduled = await prisma.scheduledCall.findUnique({ where: { id: scheduledCallId }, include: { patient: true } })
    if (!scheduled) return

    // If max attempts reached, finalize as FAILED
    if (scheduled.attemptsMade >= scheduled.maxAttempts) {
      await prisma.scheduledCall.update({
        where: { id: scheduled.id },
        data: { status: ScheduleStatus.FAILED },
      })
      return
    }

    // Respect basic allowed hours from patient preferences if provided
    const prefs = (scheduled as any).patient?.callPreferences as any
    if (prefs?.allowedHours) {
      const now = new Date()
      const hour = now.getHours()
      const { start = 9, end = 18 } = prefs.allowedHours
      if (hour < start || hour >= end) {
        const nextWin = new Date(now)
        nextWin.setHours(start, 0, 0, 0)
        if (nextWin <= now) nextWin.setDate(nextWin.getDate() + 1)
        await prisma.scheduledCall.update({ where: { id: scheduled.id }, data: { nextAttemptAt: nextWin } })
        return
      }
    }

    // Create a Call row in PENDING to integrate with existing flow
    const call = await createAndDispatchCall(scheduled.patientId, { scheduledCallId: scheduled.id })

    // Create CallAttempt in-progress
    const attemptNumber = scheduled.attemptsMade + 1
    await prisma.callAttempt.create({
      data: {
        scheduledCallId: scheduled.id,
        attemptNumber,
        callId: call.id,
        outcome: AttemptOutcome.IN_PROGRESS,
      },
    })

    // Move scheduler to RUNNING, increment attemptsMade, set next attempt time
    const base = new Date(Math.max(Date.now(), scheduled.startAt.getTime()))
    const next = new Date(base)
    next.setMinutes(next.getMinutes() + scheduled.retryIntervalMinutes)
    await prisma.scheduledCall.update({
      where: { id: scheduled.id },
      data: {
        status: ScheduleStatus.RUNNING,
        attemptsMade: attemptNumber,
        nextAttemptAt: next,
      },
    })
  }
}

export const scheduler = new CallSchedulerService()


