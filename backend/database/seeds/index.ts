import { PrismaClient, CallStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Clear existing data (order matters due to FKs)
  await prisma.callLog.deleteMany()
  await prisma.call.deleteMany()
  await prisma.patient.deleteMany()

  // Helper to create a call with logs
  const createCall = async (patientId: string, data: {
    status: CallStatus
    summary?: string | null
    structuredData?: any
    completed?: boolean
    createdAt?: Date
    logs?: Array<{ eventType: string; data?: any; at?: Date }>
  }) => {
    const createdAt = data.createdAt || new Date()
    const randomDurationSec = 60 + Math.floor(Math.random() * 61) // 60-120 seconds
    const call = await prisma.call.create({
      data: {
        patientId,
        status: data.status,
        summary: data.summary || null,
        structuredData: data.structuredData || undefined,
        createdAt,
        completedAt: data.completed ? new Date(createdAt.getTime() + randomDurationSec * 1000) : null,
      },
    })

    if (data.logs?.length) {
      for (const l of data.logs) {
        await prisma.callLog.create({
          data: {
            callId: call.id,
            eventType: l.eventType,
            data: l.data || undefined,
            timestamp: l.at || new Date(),
          },
        })
      }
    }

    return call
  }

  // Patients
  const alice = await prisma.patient.create({
    data: {
      name: 'Alice Patel',
      phone: '+15551230001',
      address: '101 Lakeside Ave, Springfield',
      medicationInfo: { drug: 'Atorvastatin 20mg' },
    },
  })

  const ben = await prisma.patient.create({
    data: {
      name: 'Ben Nguyen',
      phone: '+15551230002',
      address: '22 Finch Rd, Riverton',
      medicationInfo: { drug: 'Metformin 500mg' },
    },
  })

  const chloe = await prisma.patient.create({
    data: {
      name: 'Chloe Garcia',
      phone: '+15551230003',
      address: '7 Orchard Blvd, Brookfield',
      medicationInfo: { drug: 'Lisinopril 10mg' },
    },
  })

  // Alice – successful call with availability, med change, late delivery issue
  await createCall(alice.id, {
    status: CallStatus.COMPLETED,
    completed: true,
    summary:
      'Patient will be home Friday 2–4 PM. Medication change: increased dose to 40mg starting next refill. Reported last delivery arrived 2 days late; no damage to medication.',
    structuredData: {
      availability: { day: 'Friday', window: '2–4 PM' },
      medicationChanges: 'Increase dose to 40mg next refill',
      shipmentIssues: 'Late by 2 days, contents OK',
      success: true,
    },
    logs: [
      { eventType: 'CALL_INITIATED', data: { patientName: alice.name, patientPhone: alice.phone } },
      { eventType: 'TRANSCRIPT', data: { speaker: 'agent', text: 'For security, can I verify your name and address on file?' } },
      { eventType: 'TRANSCRIPT', data: { speaker: 'patient', text: 'Yes, confirmed.' } },
      { eventType: 'TRANSCRIPT', data: { speaker: 'agent', text: 'Hello, this is Riley…' } },
      { eventType: 'TRANSCRIPT', data: { speaker: 'patient', text: 'Friday afternoon works 2 to 4.' } },
      { eventType: 'TRANSCRIPT', data: { speaker: 'patient', text: 'Doctor increased to 40mg.' } },
      { eventType: 'TRANSCRIPT', data: { speaker: 'patient', text: 'Last delivery was late by two days.' } },
      { eventType: 'CALL_ENDED', data: { reason: 'completed' } },
    ],
  })

  // Alice – simple successful follow‑up, no changes
  await createCall(alice.id, {
    status: CallStatus.COMPLETED,
    completed: true,
    summary:
      'Patient available Tuesday 10–12. No changes to medications. No issues with prior shipment.',
    structuredData: {
      availability: { day: 'Tuesday', window: '10–12' },
      medicationChanges: 'None',
      shipmentIssues: 'None',
      success: true,
    },
    logs: [
      { eventType: 'CALL_INITIATED' },
      { eventType: 'TRANSCRIPT', data: { speaker: 'agent', text: 'For security, may I verify your details on file?' } },
      { eventType: 'TRANSCRIPT', data: { speaker: 'patient', text: 'Confirmed.' } },
      { eventType: 'TRANSCRIPT', data: { speaker: 'patient', text: 'I will be home Tuesday morning.' } },
      { eventType: 'CALL_ENDED', data: { reason: 'completed' } },
    ],
  })

  // Ben – disconnected: repeated identity mismatch → FAILED
  await createCall(ben.id, {
    status: CallStatus.FAILED,
    completed: true,
    summary: 'Call disconnected after multiple failed identity confirmations. No details collected.',
    structuredData: {
      identityVerified: false,
      success: false,
      failureReason: 'identity-mismatch',
    },
    logs: [
      { eventType: 'CALL_INITIATED' },
      { eventType: 'TRANSCRIPT', data: { speaker: 'agent', text: 'For security, can you verify your details on file?' } },
      { eventType: 'TRANSCRIPT', data: { speaker: 'agent', text: 'Please confirm your full name and DOB.' } },
      { eventType: 'TRANSCRIPT', data: { speaker: 'patient', text: '…provides mismatched info (x3).' } },
      { eventType: 'CALL_ENDED', data: { reason: 'disconnected_after_mismatch' } },
    ],
  })

  // Ben – successful with minor shipment feedback
  await createCall(ben.id, {
    status: CallStatus.COMPLETED,
    completed: true,
    summary: 'Patient available Thursday 3–5 PM. No medication changes. Reported crushed outer box; pills intact.',
    structuredData: {
      availability: { day: 'Thursday', window: '3–5 PM' },
      medicationChanges: 'None',
      shipmentIssues: 'Outer box crushed; product intact',
      success: true,
    },
    logs: [
      { eventType: 'CALL_INITIATED' },
      { eventType: 'TRANSCRIPT', data: { speaker: 'agent', text: 'For security, please confirm your details on file.' } },
      { eventType: 'TRANSCRIPT', data: { speaker: 'patient', text: 'Confirmed.' } },
      { eventType: 'CALL_ENDED', data: { reason: 'completed' } },
    ],
  })

  // Chloe – unsuccessful due to missing required details (not provided)
  await createCall(chloe.id, {
    status: CallStatus.CANCELLED,
    completed: true,
    summary:
      'Call ended without collecting required verification. Patient declined to provide address/phone; no delivery window or updates captured.',
    structuredData: {
      identityVerified: false,
      success: false,
      failureReason: 'patient-declined-details',
    },
    logs: [
      { eventType: 'CALL_INITIATED' },
      { eventType: 'TRANSCRIPT', data: { speaker: 'agent', text: 'For security, may I verify your details on file?' } },
      { eventType: 'TRANSCRIPT', data: { speaker: 'patient', text: 'I prefer not to share details over the phone.' } },
      { eventType: 'TRANSCRIPT', data: { speaker: 'patient', text: 'I prefer not to share details over the phone.' } },
      { eventType: 'CALL_ENDED', data: { reason: 'patient_declined' } },
    ],
  })

  console.log('Seed complete: 3 patients with multiple mock calls created.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 