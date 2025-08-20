'use client'

import { useState } from 'react'
import { 
  ArrowLeft, 
  Phone, 
  User, 
  Clock, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FileText,
  MapPin,
  Edit,
  Save,
  X,
  Trash2
} from 'lucide-react'
import { useCall, useUpdateCall, useDeleteCall } from '@/hooks/useCalls'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { CallStatus } from '@/types'
import { format } from 'date-fns'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface CallDetailsProps {
  callId: string
}

export function CallDetails({ callId }: CallDetailsProps) {
  const [isEditingSummary, setIsEditingSummary] = useState(false)
  const [summaryText, setSummaryText] = useState('')
  
  const { data: call, isLoading, error } = useCall(callId)
  const updateCallMutation = useUpdateCall()
  const deleteCallMutation = useDeleteCall()
  const router = useRouter()

  const statusConfig = {
    PENDING: { 
      color: 'text-blue-600 bg-blue-100', 
      icon: Clock,
      text: 'Pending'
    },
    IN_PROGRESS: { 
      color: 'text-yellow-600 bg-yellow-100', 
      icon: Phone,
      text: 'In Progress'
    },
    COMPLETED: { 
      color: 'text-green-600 bg-green-100', 
      icon: CheckCircle,
      text: 'Completed'
    },
    FAILED: { 
      color: 'text-red-600 bg-red-100', 
      icon: XCircle,
      text: 'Failed'
    },
    CANCELLED: { 
      color: 'text-gray-600 bg-gray-100', 
      icon: X,
      text: 'Cancelled'
    }
  } as const

  const handleStatusUpdate = async (status: CallStatus) => {
    try {
      await updateCallMutation.mutateAsync({
        id: callId,
        data: { status }
      })
    } catch (error) {
      console.error('Failed to update call status:', error)
    }
  }

  const handleSaveSummary = async () => {
    try {
      await updateCallMutation.mutateAsync({
        id: callId,
        data: { summary: summaryText }
      })
      setIsEditingSummary(false)
    } catch (error) {
      console.error('Failed to update summary:', error)
    }
  }

  const startEditingSummary = () => {
    setSummaryText(call?.summary || '')
    setIsEditingSummary(true)
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center space-x-4">
          <Link href="/calls" className="btn-secondary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Calls
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Call Details</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-gray-500">Loading call details...</span>
        </div>
      </div>
    )
  }

  if (error || !call) {
    return (
      <div className="space-y-8">
        <div className="flex items-center space-x-4">
          <Link href="/calls" className="btn-secondary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Calls
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Call Details</h1>
        </div>
        <div className="card p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Call not found</h3>
          <p className="text-gray-600">The call you're looking for doesn't exist or couldn't be loaded.</p>
        </div>
      </div>
    )
  }

  const config = statusConfig[call.status] || statusConfig.PENDING
  const Icon = config.icon
  const patientName = call.patient?.name || 'Unknown Patient'
  const duration = call.completedAt
    ? (() => {
        const createdTs = new Date(call.createdAt as string).getTime()
        const completedTs = new Date(call.completedAt as string).getTime()
        const seconds = Math.max(0, Math.floor((completedTs - createdTs) / 1000))
        const mm = Math.floor(seconds / 60)
        const ss = seconds % 60
        return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
      })()
    : null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/calls" className="btn-secondary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Calls
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Call Details</h1>
            <p className="text-gray-600 mt-1">Call ID: {call.id}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {call.status === 'PENDING' && (
            <button
              onClick={() => handleStatusUpdate('CANCELLED')}
              disabled={updateCallMutation.isPending}
              className="btn-outline"
            >
              {updateCallMutation.isPending ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <X className="h-4 w-4 mr-2" />
              )}
              Cancel Call
            </button>
          )}
          
          {/* Removed Mark Complete fast-forward for mock */}

          <button
            onClick={async () => {
              if (window.confirm('Delete this call? This action cannot be undone.')) {
                try {
                  await deleteCallMutation.mutateAsync(callId)
                  router.push('/calls')
                } catch (e) {
                  console.error('Delete call failed', e)
                  alert('Failed to delete call. Please try again.')
                }
              }
            }}
            disabled={deleteCallMutation.isPending}
            className="btn-outline"
          >
            {deleteCallMutation.isPending ? <LoadingSpinner size="sm" className="mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
            Delete
          </button>
        </div>
      </div>

      {/* Call Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Information */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Patient Information
          </h2>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <p className="mt-1 text-sm text-gray-900">{patientName}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <p className="mt-1 text-sm text-gray-900">{call.patient?.phone || 'N/A'}</p>
            </div>
            
            {call.patient && (call.patient as any).address && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <p className="mt-1 text-sm text-gray-900 flex items-start">
                  <MapPin className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                  {(call.patient as any).address}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Call Status */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Phone className="h-5 w-5 mr-2" />
            Call Status
          </h2>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Status</label>
              <div className={`mt-1 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
                <Icon className="h-4 w-4 mr-2" />
                {config.text}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Started</label>
              <p className="mt-1 text-sm text-gray-900 flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {call.createdAt ? format(new Date(call.createdAt as string), 'MMMM d, yyyy h:mm a') : '—'}
              </p>
            </div>
            
            {call.completedAt ? (
              <div>
                <label className="block text-sm font-medium text-gray-700">Completed</label>
                <p className="mt-1 text-sm text-gray-900 flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {format(new Date(call.completedAt as string), 'MMMM d, yyyy h:mm a')}
                </p>
              </div>
            ) : null}
            
            {duration !== null && duration !== undefined && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Duration</label>
                <p className="mt-1 text-sm text-gray-900 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {duration}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Technical Details */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Technical Details
          </h2>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Call SID</label>
              <p className="mt-1 text-sm text-gray-900 font-mono">
                {call.callSid || 'Not assigned'}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Patient ID</label>
              <p className="mt-1 text-sm text-gray-900 font-mono">
                {call.patientId}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Call ID</label>
              <p className="mt-1 text-sm text-gray-900 font-mono">
                {call.id}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Call Summary */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Call Summary
          </h2>
          
          {!isEditingSummary && (
            <button
              onClick={startEditingSummary}
              className="btn-sm btn-secondary"
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </button>
          )}
        </div>
        
        {isEditingSummary ? (
          <div className="space-y-4">
            <textarea
              value={summaryText}
              onChange={(e) => setSummaryText(e.target.value)}
              className="input min-h-[120px]"
              placeholder="Enter call summary..."
            />
            <div className="flex items-center space-x-3">
              <button
                onClick={handleSaveSummary}
                disabled={updateCallMutation.isPending}
                className="btn-primary"
              >
                {updateCallMutation.isPending ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Summary
              </button>
              <button
                onClick={() => setIsEditingSummary(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="prose max-w-none">
            {call.summary ? (
              <p className="text-gray-900 whitespace-pre-wrap">{call.summary}</p>
            ) : (
              <p className="text-gray-500 italic">No summary available for this call.</p>
            )}
          </div>
        )}
      </div>

      {/* Transcript logs removed per requirements */}
    </div>
  )
}
