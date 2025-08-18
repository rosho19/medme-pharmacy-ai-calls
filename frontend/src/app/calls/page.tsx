'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/utils/api'
import { CallItem } from '@/types'

export default function CallsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['calls'],
    queryFn: async () => {
      const res = await api.get('/calls')
      return res.data?.data as CallItem[]
    },
    refetchInterval: 5000,
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Calls</h1>
      <div className="card p-6">
        {isLoading ? (
          <p>Loading…</p>
        ) : (
          <div className="divide-y">
            {data?.map((c) => (
              <div key={c.id} className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{c.patient?.name ?? c.patientId}</p>
                    <p className="text-sm text-gray-600">{c.patient?.phone}</p>
                  </div>
                  <span className="badge-secondary">{c.status}</span>
                </div>
                {c.summary && (
                  <p className="mt-2 text-sm text-gray-700">Summary: {c.summary}</p>
                )}
              </div>
            ))}
            {(!data || data.length === 0) && <p className="text-sm text-gray-600">No calls yet.</p>}
          </div>
        )}
      </div>
    </div>
  )
} 