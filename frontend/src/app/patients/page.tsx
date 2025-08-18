'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/utils/api'
import { Patient } from '@/types'
import { PatientForm } from '@/components/forms/PatientForm'
import { CallActions } from '@/components/ui/CallActions'
import { useState } from 'react'

export default function PatientsPage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const { data, isLoading } = useQuery({
    queryKey: ['patients', refreshKey],
    queryFn: async () => {
      const res = await api.get('/patients')
      return res.data?.data as Patient[]
    },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Patients</h1>

      <div className="card p-6">
        <h2 className="text-lg font-medium mb-3">Add Patient</h2>
        <PatientForm onCreated={() => setRefreshKey((n) => n + 1)} />
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-medium mb-4">Patient List</h2>
        {isLoading ? (
          <p>Loading…</p>
        ) : (
          <div className="divide-y">
            {data?.map((p) => (
              <div key={p.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-gray-600">{p.phone}</p>
                </div>
                <CallActions patientId={p.id} />
              </div>
            ))}
            {(!data || data.length === 0) && <p className="text-sm text-gray-600">No patients yet.</p>}
          </div>
        )}
      </div>
    </div>
  )
} 