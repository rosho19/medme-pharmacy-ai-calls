import { Navbar } from '@/components/layout/Navbar'
import { CallDetails } from '@/components/CallDetails'

interface CallDetailsPageProps {
  params: {
    id: string
  }
}

export default function CallDetailsPage({ params }: CallDetailsPageProps) {
  return (
    <main>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <CallDetails callId={params.id} />
      </div>
    </main>
  )
}
