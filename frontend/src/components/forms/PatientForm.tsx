'use client'

import { useForm } from 'react-hook-form'
import { api } from '@/utils/api'
import { useState } from 'react'

interface FormValues {
  name: string
  phone: string
  address?: string
}

export function PatientForm({ onCreated }: { onCreated?: () => void }) {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormValues>()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (values: FormValues) => {
    setMessage(null)
    setError(null)
    try {
      await api.post('/patients', values)
      setMessage('Patient added')
      reset()
      onCreated?.()
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to add patient')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label className="label">Name</label>
        <input className="input" placeholder="John Doe" {...register('name', { required: true })} />
      </div>
      <div>
        <label className="label">Phone</label>
        <input className="input" placeholder="+15555550123" {...register('phone', { required: true })} />
      </div>
      <div>
        <label className="label">Address</label>
        <input className="input" placeholder="123 Main St" {...register('address')} />
      </div>
      <div className="flex items-center gap-3">
        <button className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Add Patient'}
        </button>
        {message && <span className="text-sm text-green-700">{message}</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </form>
  )
} 