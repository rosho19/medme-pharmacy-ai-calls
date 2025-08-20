import { Navbar } from '@/components/layout/Navbar'
import { PatientManagement } from '@/components/PatientManagement'
import { headers } from 'next/headers'

export default function PatientsPage() {
  const params = new URLSearchParams(headers().get('x-invoke-path') || '')
  // Fallback: use searchParams from request URL when available
  let openNew = false
  try {
    const url = new URL(headers().get('x-url') || '')
    openNew = url.searchParams.get('new') === '1'
  } catch {}

  return (
    <main>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <PatientManagement openNew={openNew} />
      </div>
    </main>
  )
}
