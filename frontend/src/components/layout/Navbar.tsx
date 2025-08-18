'use client'

import Link from 'next/link'
import { Phone, Users, BarChart3, Settings } from 'lucide-react'

export function Navbar() {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <Phone className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">
                Pharmacy AI Calls
              </span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-6">
              <Link
                href="/"
                className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              
              <Link
                href="/patients"
                className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
              >
                <Users className="h-4 w-4" />
                <span>Patients</span>
              </Link>
              
              <Link
                href="/calls"
                className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
              >
                <Phone className="h-4 w-4" />
                <span>Calls</span>
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Settings className="h-5 w-5" />
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">P</span>
              </div>
              <span className="text-sm font-medium text-gray-700">Pharmacist</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
