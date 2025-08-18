import { Navbar } from '@/components/layout/Navbar'
import { Dashboard } from '@/components/Dashboard'

export default function Home() {
  return (
    <main>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Dashboard />
      </div>
    </main>
  )
}
