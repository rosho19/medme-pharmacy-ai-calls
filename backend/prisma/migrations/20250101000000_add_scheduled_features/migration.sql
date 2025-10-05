-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('SCHEDULED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AttemptOutcome" AS ENUM ('IN_PROGRESS', 'ANSWERED', 'NO_ANSWER', 'BUSY', 'VOICEMAIL_LEFT', 'FAILED', 'CANCELLED');

-- AlterTable
ALTER TABLE "patients" ADD COLUMN "call_preferences" JSONB;

-- CreateTable
CREATE TABLE "scheduled_calls" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "start_at" TIMESTAMP(3) NOT NULL,
    "retry_interval_minutes" INTEGER NOT NULL DEFAULT 60,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "attempts_made" INTEGER NOT NULL DEFAULT 0,
    "next_attempt_at" TIMESTAMP(3) NOT NULL,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'SCHEDULED',
    "voicemail_template" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_attempts" (
    "id" TEXT NOT NULL,
    "scheduled_call_id" TEXT NOT NULL,
    "attempt_number" INTEGER NOT NULL,
    "call_id" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "outcome" "AttemptOutcome" NOT NULL DEFAULT 'IN_PROGRESS',
    "notes" TEXT,

    CONSTRAINT "call_attempts_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "calls" ADD COLUMN "scheduled_call_id" TEXT;

-- AddForeignKey
ALTER TABLE "scheduled_calls" ADD CONSTRAINT "scheduled_calls_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_attempts" ADD CONSTRAINT "call_attempts_scheduled_call_id_fkey" FOREIGN KEY ("scheduled_call_id") REFERENCES "scheduled_calls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_attempts" ADD CONSTRAINT "call_attempts_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "calls"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calls" ADD CONSTRAINT "calls_scheduled_call_id_fkey" FOREIGN KEY ("scheduled_call_id") REFERENCES "scheduled_calls"("id") ON DELETE SET NULL ON UPDATE CASCADE;
