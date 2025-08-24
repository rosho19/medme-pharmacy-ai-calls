'use client'

import { Navbar } from '@/components/layout/Navbar'
import { useEffect, useState } from 'react'
import { usePatients } from '@/hooks/usePatients'
import { api } from '@/utils/api'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function SchedulePage() {
  const { data: patientsData, isLoading } = usePatients('', 1, 100)
  const patients = patientsData?.data || []

  const [patientId, setPatientId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('09:00')
  const [retryHours, setRetryHours] = useState<number>(1)
  const [retryMins, setRetryMins] = useState<number>(0) // 0,15,30,45
  const [maxAttempts, setMaxAttempts] = useState(3)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!patientId && patients.length > 0) setPatientId(patients[0].id)
  }, [patients, patientId])

  async function submitSchedule() {
    setMessage(null)
    if (!patientId || !date || !time) {
      setMessage('Please select patient, date, and time')
      return
    }
    setSubmitting(true)
    try {
      const startAt = new Date(`${date}T${time}:00`)
      const retryIntervalMinutes = (retryHours * 60) + retryMins
      const res = await api.post('/schedules', {
        patientId,
        startAt: startAt.toISOString(),
        retryIntervalMinutes,
        maxAttempts,
      })
      setMessage('Scheduled successfully')
    } catch (e: any) {
      setMessage(e?.response?.data?.error || 'Failed to schedule')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main>
      <Navbar />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold">Schedule Calls</h1>

        <div className="card p-6 space-y-4">
          {isLoading ? (
            <div className="flex items-center"><LoadingSpinner size="sm" /><span className="ml-2">Loading patients…</span></div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Patient</label>
                  <select className="input" value={patientId} onChange={(e) => setPatientId(e.target.value)}>
                    {patients.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Time</label>
                  <input type="time" step={900} className="input" value={time} onChange={(e) => setTime(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Retry Interval</label>
                  <div className="flex items-center space-x-3">
                    <select className="input" value={retryHours} onChange={(e) => setRetryHours(Number(e.target.value))}>
                      {Array.from({ length: 13 }).map((_, i) => (
                        <option key={i} value={i}>{i} hr{i === 1 ? '' : 's'}</option>
                      ))}
                    </select>
                    <select className="input" value={retryMins} onChange={(e) => setRetryMins(Number(e.target.value))}>
                      {[0,15,30,45].map((m) => (
                        <option key={m} value={m}>{m} min</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Attempts</label>
                  <input type="number" min={1} max={10} className="input" value={maxAttempts} onChange={(e) => setMaxAttempts(Number(e.target.value))} />
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button onClick={submitSchedule} disabled={submitting} className="btn-primary">
                  {submitting ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                  Schedule
                </button>
                {message && <span className="text-sm text-gray-600">{message}</span>}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}


