'use client'

import { Phone, Users, Clock, CheckCircle } from 'lucide-react'

export function Dashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Monitor your AI voice calling system performance and manage patient communications.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Patients</p>
              <p className="text-3xl font-bold text-gray-900">248</p>
            </div>
            <div className="p-3 bg-primary-100 rounded-full">
              <Users className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Calls Today</p>
              <p className="text-3xl font-bold text-gray-900">12</p>
            </div>
            <div className="p-3 bg-success-100 rounded-full">
              <Phone className="h-6 w-6 text-success-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Calls</p>
              <p className="text-3xl font-bold text-gray-900">5</p>
            </div>
            <div className="p-3 bg-warning-100 rounded-full">
              <Clock className="h-6 w-6 text-warning-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-3xl font-bold text-gray-900">94%</p>
            </div>
            <div className="p-3 bg-success-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-success-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="btn-primary">
            <Phone className="h-4 w-4 mr-2" />
            Start New Call
          </button>
          <button className="btn-secondary">
            <Users className="h-4 w-4 mr-2" />
            Add Patient
          </button>
          <button className="btn-outline">
            View All Calls
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-success-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Call completed for John Doe</p>
                <p className="text-xs text-gray-500">Delivery confirmed - 2 minutes ago</p>
              </div>
            </div>
            <span className="badge-success">Completed</span>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-warning-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Call in progress for Sarah Smith</p>
                <p className="text-xs text-gray-500">Medication update - 5 minutes ago</p>
              </div>
            </div>
            <span className="badge-warning">In Progress</span>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">New patient added: Mike Johnson</p>
                <p className="text-xs text-gray-500">Ready for first call - 10 minutes ago</p>
              </div>
            </div>
            <span className="badge-secondary">New</span>
          </div>
        </div>
      </div>
    </div>
  )
}
