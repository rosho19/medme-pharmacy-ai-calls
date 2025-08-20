'use client'

import { useState } from 'react'
import { 
  Search, 
  Plus, 
  Phone, 
  Edit, 
  Trash2, 
  User, 
  MapPin, 
  Calendar,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { usePatients, useDeletePatient } from '@/hooks/usePatients'
import { useCreateCall } from '@/hooks/useCalls'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { PatientForm } from '@/components/forms/PatientForm'
import { Patient } from '@/types'
import { format } from 'date-fns'

export function PatientManagement({ openNew = false }: { openNew?: boolean }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showAddForm, setShowAddForm] = useState(openNew)
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  const { data: patientsData, isLoading, error } = usePatients(searchTerm, currentPage, 10)
  const deletePatientMutation = useDeletePatient()
  const createCallMutation = useCreateCall()

  const patients = patientsData?.data || []
  const pagination = patientsData?.pagination

  const handleDeletePatient = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      try {
        await deletePatientMutation.mutateAsync(id)
      } catch (error) {
        console.error('Failed to delete patient:', error)
      }
    }
  }

  const handleTriggerCall = async (patientId: string) => {
    try {
      await createCallMutation.mutateAsync({ patientId })
      alert('Call initiated successfully!')
    } catch (error) {
      console.error('Failed to trigger call:', error)
      alert('Failed to initiate call. Please try again.')
    }
  }

  const handleFormSuccess = () => {
    setShowAddForm(false)
    setEditingPatient(null)
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patient Management</h1>
          <p className="text-gray-600 mt-2">Manage patient information and communications.</p>
        </div>
        <div className="card p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to load patients</h3>
          <p className="text-gray-600">Please check your connection and try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patient Management</h1>
          <p className="text-gray-600 mt-2">Manage patient information and communications.</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Patient
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search patients by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="text-sm text-gray-500">
            {pagination && `${pagination.total} total patients`}
          </div>
        </div>
      </div>

      {/* Patient List */}
      <div className="card">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-gray-500">Loading patients...</span>
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-12">
            <div className="h-12 w-12 rounded-full bg-brand-100 mx-auto mb-4 flex items-center justify-center">
              <User className="h-6 w-6 text-brand-700" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No patients found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? 'No matches. Try a different name or phone.' : 'Get started by adding your first patient.'}
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Patient
            </button>
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Medication
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Added
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {patients.map((patient: Patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-brand-700" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                          <div className="text-sm text-gray-500">ID: {patient.id.slice(-8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{patient.phone}</div>
                      {patient.address && (
                        <div className="text-sm text-gray-500 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {patient.address}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {patient.medicationInfo ? (
                        <div className="text-sm text-gray-900">
                          {typeof patient.medicationInfo === 'object' && patient.medicationInfo !== null
                            ? Object.keys(patient.medicationInfo).length > 0
                              ? 'Medication on file'
                              : 'No medication info'
                            : 'No medication info'}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">No medication info</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {format(new Date(patient.createdAt), 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleTriggerCall(patient.id)}
                          disabled={createCallMutation.isPending}
                          className="btn-sm btn-primary"
                          title="Start AI Call"
                        >
                          {createCallMutation.isPending ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <Phone className="h-3 w-3" />
                          )}
                        </button>
                        <button
                          onClick={() => setSelectedPatient(patient)}
                          className="btn-sm btn-secondary"
                          title="View Details"
                        >
                          <User className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => setEditingPatient(patient)}
                          className="btn-sm btn-outline"
                          title="Edit Patient"
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDeletePatient(patient.id)}
                          disabled={deletePatientMutation.isPending}
                          className="btn-sm btn-danger"
                          title="Delete Patient"
                        >
                          {deletePatientMutation.isPending ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, pagination.total)} of {pagination.total} patients
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="btn-sm btn-outline disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === pagination.pages}
                  className="btn-sm btn-outline disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Patient Modal */}
      {(showAddForm || editingPatient) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {editingPatient ? 'Edit Patient' : 'Add New Patient'}
              </h2>
              <PatientForm
                patient={editingPatient}
                onSuccess={handleFormSuccess}
                onCancel={() => {
                  setShowAddForm(false)
                  setEditingPatient(null)
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Patient Details Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Patient Details</h2>
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPatient.name}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPatient.phone}</p>
                </div>
                
                {selectedPatient.address && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPatient.address}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Medication Information</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {selectedPatient.medicationInfo ? (
                      <pre className="whitespace-pre-wrap bg-gray-50 p-3 rounded">
                        {JSON.stringify(selectedPatient.medicationInfo, null, 2)}
                      </pre>
                    ) : (
                      <p className="text-gray-500">No medication information on file</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Added</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {format(new Date(selectedPatient.createdAt), 'MMMM d, yyyy h:mm a')}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {format(new Date(selectedPatient.updatedAt), 'MMMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => handleTriggerCall(selectedPatient.id)}
                  disabled={createCallMutation.isPending}
                  className="btn-primary flex-1"
                >
                  {createCallMutation.isPending ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Starting Call...
                    </>
                  ) : (
                    <>
                      <Phone className="h-4 w-4 mr-2" />
                      Start AI Call
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setEditingPatient(selectedPatient)
                    setSelectedPatient(null)
                  }}
                  className="btn-secondary"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
