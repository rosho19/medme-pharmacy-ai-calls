export interface Patient {
  id: string
  name: string
  phone: string
  address?: string | null
  medicationInfo?: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export type CallStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED'

export interface CallItem {
  id: string
  patientId: string
  status: CallStatus
  callSid?: string | null
  summary?: string | null
  structuredData?: Record<string, unknown> | null
  createdAt: string
  completedAt?: string | null
  patient?: { id: string; name: string; phone: string }
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T
  pagination?: { page: number; limit: number; total: number; pages: number }
} 