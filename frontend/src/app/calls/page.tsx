'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/utils/api'
import { CallItem } from '@/types'

export default function CallsPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['calls'],
    queryFn: async () => {
      const res = await api.get('/calls')
      return (res.data?.data || []) as CallItem[]
    },
    refetchInterval: 5000,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Calls</h1>
        <button className="btn-ghost" onClick={() => refetch()}>Refresh</button>
      </div>
      <div className="card p-6">
        {isLoading && <p>Loading…</p>}
        {isError && <p className="text-red-600 text-sm">Failed to load calls: {(error as any)?.message}</p>}
        {!isLoading && !isError && (
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