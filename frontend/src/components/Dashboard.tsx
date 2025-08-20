'use client'

import Link from 'next/link'
import { Phone, Users, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useDashboardStats, useCalls } from '@/hooks/useCalls'
import { format } from 'date-fns'

export function Dashboard() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats()
  const { data: recentCallsData, isLoading: callsLoading } = useCalls(undefined, undefined, 1, 5)

  const recentCalls = recentCallsData?.data || []

  if (statsError) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Monitor your AI voice calling system performance and manage patient communications.
          </p>
        </div>
        <div className="card p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to load dashboard</h3>
          <p className="text-gray-600">Please check your connection and try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Monitor your AI voice calling system performance and manage patient communications.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Patients</p>
              {statsLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-gray-400">Loading...</span>
                </div>
              ) : (
                <p className="text-3xl font-bold text-gray-900">{stats?.totalPatients || 0}</p>
              )}
            </div>
            <div className="p-3 bg-brand-100 rounded-full">
              <Users className="h-6 w-6 text-brand-700" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Calls Today</p>
              {statsLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-gray-400">Loading...</span>
                </div>
              ) : (
                <p className="text-3xl font-bold text-gray-900">{stats?.callsToday || 0}</p>
              )}
            </div>
            <div className="p-3 bg-brand-100 rounded-full">
              <Phone className="h-6 w-6 text-brand-700" />
            </div>
          </div>
        </div>

        {/* Pending calls card removed */}

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              {statsLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-gray-400">Loading...</span>
                </div>
              ) : (
                <p className="text-3xl font-bold text-gray-900">{stats?.successRate || 0}%</p>
              )}
            </div>
            <div className="p-3 bg-brand-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-brand-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link className="btn-primary text-center" href="/patients">
            <Phone className="h-4 w-4 mr-2 inline" />
            Start New Call
          </Link>
          <Link className="btn-primary text-center" href="/patients">
            <Users className="h-4 w-4 mr-2 inline" />
            Add Patient
          </Link>
          <Link className="btn-primary text-center" href="/calls">
            View All Calls
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
          <Link href="/calls" className="text-sm text-blue-600 hover:text-blue-800">
            View all calls →
          </Link>
        </div>
        
        {callsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Loading recent activity...</span>
          </div>
        ) : recentCalls.length === 0 ? (
          <div className="text-center py-8">
            <Phone className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No recent calls found</p>
            <p className="text-sm text-gray-400 mt-1">Start by adding patients and making calls</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentCalls.map((call: any) => {
              const statusConfig = {
                COMPLETED: { color: 'bg-green-500', badge: 'badge-success', text: 'Completed' },
                IN_PROGRESS: { color: 'bg-yellow-500', badge: 'badge-warning', text: 'In Progress' },
                FAILED: { color: 'bg-red-500', badge: 'badge-error', text: 'Failed' },
              }
              const statusKey = call.status === 'CANCELLED' ? 'FAILED' : call.status
              const config = statusConfig[statusKey as keyof typeof statusConfig] || statusConfig.FAILED
              const patientName = call.patient?.name || 'Unknown Patient'
              const timeAgo = format(new Date(call.createdAt), 'MMM d, h:mm a')
              
              return (
                <div key={call.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 ${config.color} rounded-full`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Call {config.text.toLowerCase()} for {patientName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {call.summary || 'AI voice call'} - {timeAgo}
                      </p>
                    </div>
                  </div>
                  <span className={config.badge}>{config.text}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
