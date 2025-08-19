'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect } from 'react'
import { useCreatePatient, useUpdatePatient } from '@/hooks/usePatients'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Patient, CreatePatientData } from '@/types'

const patientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  address: z.string().optional(),
  medicationInfo: z.record(z.unknown()).optional(),
})

type FormValues = z.infer<typeof patientSchema>

interface PatientFormProps {
  patient?: Patient | null
  onSuccess?: () => void
  onCancel?: () => void
}

export function PatientForm({ patient, onSuccess, onCancel }: PatientFormProps) {
  const isEditing = !!patient
  
  const createPatientMutation = useCreatePatient()
  const updatePatientMutation = useUpdatePatient()
  
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      medicationInfo: {},
    }
  })

  // Populate form when editing
  useEffect(() => {
    if (patient) {
      setValue('name', patient.name)
      setValue('phone', patient.phone)
      setValue('address', patient.address || '')
      setValue('medicationInfo', patient.medicationInfo as Record<string, unknown> || {})
    }
  }, [patient, setValue])

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEditing && patient) {
        await updatePatientMutation.mutateAsync({
          id: patient.id,
          data: values
        })
      } else {
        await createPatientMutation.mutateAsync(values as CreatePatientData)
      }
      
      reset()
      onSuccess?.()
    } catch (error) {
      console.error('Failed to save patient:', error)
    }
  }

  const medicationInfoValue = watch('medicationInfo')
  const medicationInfoString = medicationInfoValue 
    ? JSON.stringify(medicationInfoValue, null, 2)
    : ''

  const handleMedicationInfoChange = (value: string) => {
    try {
      const parsed = value ? JSON.parse(value) : {}
      setValue('medicationInfo', parsed)
    } catch (error) {
      // Invalid JSON, don't update the value
    }
  }

  const isPending = createPatientMutation.isPending || updatePatientMutation.isPending

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name *
        </label>
        <input
          {...register('name')}
          className="input"
          placeholder="John Doe"
          disabled={isPending}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number *
        </label>
        <input
          {...register('phone')}
          className="input"
          placeholder="+1 (555) 123-4567"
          disabled={isPending}
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address
        </label>
        <input
          {...register('address')}
          className="input"
          placeholder="123 Main St, City, State 12345"
          disabled={isPending}
        />
        {errors.address && (
          <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Medication Information
        </label>
        <textarea
          value={medicationInfoString}
          onChange={(e) => handleMedicationInfoChange(e.target.value)}
          className="input min-h-[100px] font-mono text-sm"
          placeholder='{"medication": "Lisinopril", "dosage": "10mg", "frequency": "daily"}'
          disabled={isPending}
        />
        <p className="mt-1 text-xs text-gray-500">
          Enter medication information as JSON format (optional)
        </p>
        {errors.medicationInfo && (
          <p className="mt-1 text-sm text-red-600">{errors.medicationInfo.message}</p>
        )}
      </div>

      {/* Error Messages */}
      {createPatientMutation.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">
            {(createPatientMutation.error as any)?.message || 'Failed to create patient'}
          </p>
        </div>
      )}

      {updatePatientMutation.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">
            {(updatePatientMutation.error as any)?.message || 'Failed to update patient'}
          </p>
        </div>
      )}

      {/* Success Messages */}
      {createPatientMutation.isSuccess && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-600">Patient created successfully!</p>
        </div>
      )}

      {updatePatientMutation.isSuccess && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-600">Patient updated successfully!</p>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
            disabled={isPending}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="btn-primary"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              {isEditing ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            isEditing ? 'Update Patient' : 'Create Patient'
          )}
        </button>
      </div>
    </form>
  )
}
