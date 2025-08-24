import { CallStatus } from '@prisma/client'
import { prisma } from '../utils/prisma'
import { initiateOutboundCall } from './vapi'

export interface InitiateOptions {
  scheduledCallId?: string
}

export async function createAndDispatchCall(patientId: string, options: InitiateOptions = {}) {
  const patient = await prisma.patient.findUnique({ where: { id: patientId } })
  if (!patient) throw new Error('Patient not found')

  const call = await prisma.call.create({
    data: { patientId, status: CallStatus.PENDING, scheduledCallId: options.scheduledCallId },
    include: { patient: { select: { id: true, name: true, phone: true } } },
  })

  await prisma.callLog.create({
    data: {
      callId: call.id,
      eventType: 'CALL_INITIATED',
      data: { patientName: patient.name, patientPhone: patient.phone, scheduledCallId: options.scheduledCallId },
    },
  })

  if (process.env.MOCK_VAPI === 'true') {
    const updated = await prisma.call.update({
      where: { id: call.id },
      data: { status: CallStatus.IN_PROGRESS, callSid: `mock-${call.id}` },
      include: { patient: { select: { id: true, name: true, phone: true } } },
    })

    await prisma.callLog.create({
      data: { callId: call.id, eventType: 'MOCK_STARTED', data: { note: 'Mock Vapi call started' } },
    })

    return updated
  }

  try {
    const vapiResult = await initiateOutboundCall({
      toPhoneNumber: patient.phone,
      patientId,
      patientName: patient.name,
    })

    if ((vapiResult as any)?.id) {
      await prisma.call.update({ where: { id: call.id }, data: { callSid: String((vapiResult as any).id) } })
      await prisma.callLog.create({
        data: {
          callId: call.id,
          eventType: 'VAPI_DISPATCHED',
          data: { vapiCallId: (vapiResult as any).id, status: (vapiResult as any)?.status },
        },
      })
    }
  } catch (vapiError: any) {
    await prisma.callLog.create({
      data: { callId: call.id, eventType: 'VAPI_ERROR', data: { message: vapiError?.message ?? 'Unknown Vapi error' } },
    })

    const failedCall = await prisma.call.update({
      where: { id: call.id },
      data: { status: CallStatus.FAILED, completedAt: new Date(), structuredData: { error: vapiError?.message ?? 'Unknown Vapi error' } as any },
      include: { patient: { select: { id: true, name: true, phone: true } } },
    })

    await prisma.callLog.create({ data: { callId: call.id, eventType: 'CALL_ENDED', data: { reason: 'failed' } } })

    return failedCall
  }

  return call
}


