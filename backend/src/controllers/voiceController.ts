import { Request, Response, NextFunction } from 'express';
import { CallStatus } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { AttemptOutcome, ScheduleStatus } from '@prisma/client';

// @desc    Handle Vapi webhook events
// @route   POST /api/voice/webhook
// @access  Public (but should be secured with webhook secret)
export const handleVapiWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { event, data } = req.body as any;

    // TODO: Verify webhook signature with VAPI_WEBHOOK_SECRET
    // const signature = req.headers['x-vapi-signature'] as string | undefined
    // if (!verifyWebhookSignature(signature, req.body)) return res.status(401).json({ error: 'Invalid signature' })

    console.log('Received Vapi webhook:', { event, data });

    switch (event) {
      case 'call-started':
        await handleCallStarted(data);
        break;
      case 'call-ended':
        await handleCallEnded(data);
        break;
      case 'transcript':
        await handleTranscript(data);
        break;
      case 'function-call':
        await handleFunctionCall(data);
        break;
      default:
        console.log('Unhandled webhook event:', event);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    next(error);
  }
};

// Handle call started event
const handleCallStarted = async (data: any) => {
  const { callId, phoneNumber } = data;

  try {
    const patient = await prisma.patient.findUnique({ where: { phone: phoneNumber } });

    if (patient) {
      const call = await prisma.call.findFirst({
        where: { patientId: patient.id, status: CallStatus.PENDING },
        orderBy: { createdAt: 'desc' },
      });

      if (call) {
        await prisma.call.update({
          where: { id: call.id },
          data: { status: CallStatus.IN_PROGRESS, callSid: callId },
        });

        await prisma.callLog.create({
          data: {
            callId: call.id,
            eventType: 'CALL_STARTED',
            data: { vapiCallId: callId, phoneNumber },
          },
        });

        // Mark corresponding attempt (if scheduled) as in-progress
        if (call.scheduledCallId) {
          const attempt = await prisma.callAttempt.findFirst({ where: { callId: call.id } })
          if (attempt) {
            await prisma.callAttempt.update({ where: { id: attempt.id }, data: { outcome: AttemptOutcome.IN_PROGRESS } })
          }
          await prisma.scheduledCall.update({ where: { id: call.scheduledCallId }, data: { status: ScheduleStatus.RUNNING } })
        }
      }
    }
  } catch (error) {
    console.error('Error handling call started:', error);
  }
};

// Handle call ended event
const handleCallEnded = async (data: any) => {
  const { callId, summary, transcript, duration, status, success, reason, error: errorInfo } = data;

  try {
    const call = await prisma.call.findFirst({ where: { callSid: callId } });

    if (call) {
      const statusText = String(status || reason || '').toLowerCase();
      const isFailed = success === false
        || statusText.includes('fail')
        || statusText.includes('cancel')
        || Boolean(errorInfo);

      if (isFailed) {
        await prisma.call.update({
          where: { id: call.id },
          data: {
            status: CallStatus.FAILED,
            summary: summary || 'Call failed',
            structuredData: { transcript, duration, reason, error: errorInfo, completedAt: new Date().toISOString() },
            completedAt: new Date(),
          },
        });

        await prisma.callLog.create({
          data: {
            callId: call.id,
            eventType: 'CALL_ENDED',
            data: { vapiCallId: callId, summary, transcript, duration, reason, error: errorInfo, result: 'failed' },
          },
        });

        // Update attempt and schedule
        if (call.scheduledCallId) {
          const attempt = await prisma.callAttempt.findFirst({ where: { callId: call.id } })
          if (attempt) {
            await prisma.callAttempt.update({ where: { id: attempt.id }, data: { outcome: AttemptOutcome.FAILED, endedAt: new Date() } })
          }
          const sched = await prisma.scheduledCall.findUnique({ where: { id: call.scheduledCallId } })
          if (sched) {
            if (sched.attemptsMade >= sched.maxAttempts) {
              await prisma.scheduledCall.update({ where: { id: sched.id }, data: { status: ScheduleStatus.FAILED } })
            } else {
              // keep RUNNING; nextAttemptAt already set by scheduler when attempt created
              await prisma.scheduledCall.update({ where: { id: sched.id }, data: { status: ScheduleStatus.RUNNING } })
            }
          }
        }
      } else {
        await prisma.call.update({
          where: { id: call.id },
          data: {
            status: CallStatus.COMPLETED,
            summary: summary || 'Call completed',
            structuredData: { transcript, duration, completedAt: new Date().toISOString() },
            completedAt: new Date(),
          },
        });

        await prisma.callLog.create({
          data: {
            callId: call.id,
            eventType: 'CALL_ENDED',
            data: { vapiCallId: callId, summary, transcript, duration, result: 'completed' },
          },
        });

        // Update attempt and schedule
        if (call.scheduledCallId) {
          const attempt = await prisma.callAttempt.findFirst({ where: { callId: call.id } })
          if (attempt) {
            await prisma.callAttempt.update({ where: { id: attempt.id }, data: { outcome: AttemptOutcome.ANSWERED, endedAt: new Date() } })
          }
          await prisma.scheduledCall.update({ where: { id: call.scheduledCallId }, data: { status: ScheduleStatus.COMPLETED } })
        }
      }
    }
  } catch (error) {
    console.error('Error handling call ended:', error);
  }
};

// Handle transcript updates
const handleTranscript = async (data: any) => {
  const { callId, transcript, speaker } = data;

  try {
    const call = await prisma.call.findFirst({ where: { callSid: callId } });

    if (call) {
      await prisma.callLog.create({
        data: {
          callId: call.id,
          eventType: 'TRANSCRIPT',
          data: { vapiCallId: callId, transcript, speaker, timestamp: new Date().toISOString() },
        },
      });
    }
  } catch (error) {
    console.error('Error handling transcript:', error);
  }
};

// Handle function calls from Vapi
const handleFunctionCall = async (data: any) => {
  const { callId, functionName, parameters } = data;

  try {
    const call = await prisma.call.findFirst({ where: { callSid: callId } });

    if (call) {
      await prisma.callLog.create({
        data: {
          callId: call.id,
          eventType: 'FUNCTION_CALL',
          data: { vapiCallId: callId, functionName, parameters },
        },
      });

      switch (functionName) {
        case 'confirmDelivery':
          await handleDeliveryConfirmation(call.id, parameters);
          break;
        case 'updateMedication':
          await handleMedicationUpdate(call.id, parameters);
          break;
        default:
          console.log('Unhandled function call:', functionName);
      }
    }
  } catch (error) {
    console.error('Error handling function call:', error);
  }
};

const handleDeliveryConfirmation = async (callId: string, parameters: any) => {
  const { confirmed, deliveryTime, notes } = parameters;
  await prisma.callLog.create({
    data: { callId, eventType: 'DELIVERY_CONFIRMATION', data: { confirmed, deliveryTime, notes } },
  });
};

const handleMedicationUpdate = async (callId: string, parameters: any) => {
  const { medicationChanges, patientResponse } = parameters;
  await prisma.callLog.create({
    data: { callId, eventType: 'MEDICATION_UPDATE', data: { medicationChanges, patientResponse } },
  });
};
