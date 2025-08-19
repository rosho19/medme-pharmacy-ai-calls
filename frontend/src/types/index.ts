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

// Patient form data types
export interface CreatePatientData {
  name: string
  phone: string
  address?: string
  medicationInfo?: Record<string, unknown>
}

export interface UpdatePatientData {
  name?: string
  phone?: string
  address?: string
  medicationInfo?: Record<string, unknown>
}

// Call form data types
export interface CreateCallData {
  patientId: string
}

export interface UpdateCallData {
  status?: CallStatus
  summary?: string
  structuredData?: Record<string, unknown>
  callSid?: string
}

// Dashboard stats
export interface DashboardStats {
  totalPatients: number
  callsToday: number
  pendingCalls: number
  successRate: number
}

// Call log entry
export interface CallLog {
  id: string
  callId: string
  eventType: string
  data?: Record<string, unknown>
  timestamp: string
}

// Extended call with logs
export interface CallWithLogs extends CallItem {
  callLogs: CallLog[]
}

// API response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
