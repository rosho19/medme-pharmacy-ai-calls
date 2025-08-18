'use client'

import { useState } from 'react'
import { api } from '@/utils/api'

export function CallActions({ patientId }: { patientId: string }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const triggerCall = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const res = await api.post('/calls', { patientId })
      setMessage(res.data?.message || 'Call initiated')
    } catch (e: any) {
      setMessage(e?.response?.data?.error || 'Failed to initiate call')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button className="btn-primary" onClick={triggerCall} disabled={loading}>
        {loading ? 'Starting…' : 'Start Call'}
      </button>
      {message && <span className="text-sm text-gray-600">{message}</span>}
    </div>
  )
} 