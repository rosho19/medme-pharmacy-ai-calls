'use client'

import { useState } from 'react'
import { 
  Phone, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  User,
  Calendar,
  Eye,
  Play,
  Pause,
  Square,
  Trash2
} from 'lucide-react'
import { useCalls, useUpdateCall, useDeleteCall } from '@/hooks/useCalls'
import { usePatients } from '@/hooks/usePatients'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { CallItem, CallStatus } from '@/types'
import { format } from 'date-fns'
import Link from 'next/link'

export function CallManagement() {
  const [statusFilter, setStatusFilter] = useState<CallStatus | 'ALL'>('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCall, setSelectedCall] = useState<CallItem | null>(null)

  const { data: callsData, isLoading, error } = useCalls(
    statusFilter === 'ALL' ? undefined : statusFilter,
    undefined,
    currentPage,
    10
  )
  const { data: patientsData } = usePatients('', 1, 100) // Get patients for dropdown
  const updateCallMutation = useUpdateCall()
  const deleteCallMutation = useDeleteCall()

  const calls = callsData?.data || []
  const pagination = callsData?.pagination
  const patients = patientsData?.data || []

  const statusConfig = {
    PENDING: { 
      color: 'text-blue-600 bg-blue-100', 
      icon: Clock,
      text: 'Pending'
    },
    IN_PROGRESS: { 
      color: 'text-yellow-600 bg-yellow-100', 
      icon: Play,
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
      icon: Square,
      text: 'Cancelled'
    }
  }

  const handleStatusUpdate = async (callId: string, status: CallStatus) => {
    try {
      await updateCallMutation.mutateAsync({
        id: callId,
        data: { status }
      })
    } catch (error) {
      console.error('Failed to update call status:', error)
    }
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Call Management</h1>
          <p className="text-gray-600 mt-2">Monitor and manage AI voice calls.</p>
        </div>
        <div className="card p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to load calls</h3>
          <p className="text-gray-600">Please check your connection and try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Call Management</h1>
          <p className="text-gray-600 mt-2">Monitor and manage AI voice calls.</p>
        </div>
        <div className="flex space-x-3">
          <Link href="/patients" className="btn-secondary">
            <User className="h-4 w-4 mr-2" />
            Manage Patients
          </Link>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search calls by patient name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as CallStatus | 'ALL')}
              className="input min-w-[140px]"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          
          <div className="text-sm text-gray-500 flex items-center">
            {pagination && `${pagination.total} total calls`}
          </div>
        </div>
      </div>

      {/* Call Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {Object.entries(statusConfig).map(([status, config]) => {
          const count = calls.filter((call: CallItem) => call.status === status).length
          const Icon = config.icon
          
          return (
            <div key={status} className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{config.text}</p>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                </div>
                <div className={`p-2 rounded-full ${config.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Calls List */}
      <div className="card">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-gray-500">Loading calls...</span>
          </div>
        ) : calls.length === 0 ? (
          <div className="text-center py-12">
            <Phone className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No calls found</h3>
            <p className="text-gray-500 mb-4">
              {statusFilter !== 'ALL' || searchTerm 
                ? 'Try adjusting your filters or search terms' 
                : 'Start by triggering calls from the patient management page'}
            </p>
            <Link href="/patients" className="btn-primary">
              <User className="h-4 w-4 mr-2" />
              Go to Patients
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Started
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Summary
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {calls.map((call: CallItem) => {
                  const config = statusConfig[call.status] || statusConfig.PENDING
                  const Icon = config.icon
                  const patientName = call.patient?.name || 'Unknown Patient'
                  const duration = call.completedAt 
                    ? (() => {
                        const seconds = Math.max(0, Math.floor((new Date(call.completedAt).getTime() - new Date(call.createdAt).getTime()) / 1000))
                        const mm = Math.floor(seconds / 60)
                        const ss = seconds % 60
                        return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
                      })()
                    : null

                  return (
                    <tr key={call.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="h-4 w-4 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{patientName}</div>
                            <div className="text-sm text-gray-500">{call.patient?.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                          <Icon className="h-3 w-3 mr-1" />
                          {config.text}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {format(new Date(call.createdAt), 'MMM d, h:mm a')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {duration ?? '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {call.summary || 'No summary available'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            href={`/calls/${call.id}`}
                            className="btn-sm btn-secondary"
                            title="View Details"
                          >
                            <Eye className="h-3 w-3" />
                          </Link>
                          
                          {call.status === 'PENDING' && (
                            <button
                              onClick={() => handleStatusUpdate(call.id, 'CANCELLED')}
                              disabled={updateCallMutation.isPending}
                              className="btn-sm btn-outline"
                              title="Cancel Call"
                            >
                              {updateCallMutation.isPending ? (
                                <LoadingSpinner size="sm" />
                              ) : (
                                <Square className="h-3 w-3" />
                              )}
                            </button>
                          )}
                          
                          {call.status === 'IN_PROGRESS' && (
                            <></>
                          )}
                          
                          <button
                            onClick={async () => {
                              if (window.confirm('Delete this call? This action cannot be undone.')) {
                                try {
                                  await deleteCallMutation.mutateAsync(call.id)
                                } catch (e) {
                                  console.error('Failed to delete call', e)
                                  alert('Failed to delete call. Please try again.')
                                }
                              }
                            }}
                            disabled={deleteCallMutation.isPending}
                            className="btn-sm btn-danger"
                            title="Delete Call"
                          >
                            {deleteCallMutation.isPending ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, pagination.total)} of {pagination.total} calls
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="btn-sm btn-outline disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === pagination.pages}
                  className="btn-sm btn-outline disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
