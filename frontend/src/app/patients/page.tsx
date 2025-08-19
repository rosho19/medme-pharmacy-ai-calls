import { Navbar } from '@/components/layout/Navbar'
import { PatientManagement } from '@/components/PatientManagement'

export default function PatientsPage() {
  return (
    <main>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <PatientManagement />
      </div>
    </main>
  )
}
