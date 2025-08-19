import { Navbar } from '@/components/layout/Navbar'
import { CallManagement } from '@/components/CallManagement'

export default function CallsPage() {
  return (
    <main>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <CallManagement />
      </div>
    </main>
  )
}
