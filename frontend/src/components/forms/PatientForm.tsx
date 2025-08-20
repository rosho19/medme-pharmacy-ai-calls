'use client'

import { useForm } from 'react-hook-form'
import { useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect } from 'react'
import { useCreatePatient, useUpdatePatient } from '@/hooks/usePatients'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Patient, CreatePatientData } from '@/types'

const patientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  address: z.string().min(1, 'Address is required'),
  medications: z
    .array(
      z.object({
        drug: z.string().min(1, 'Drug name is required'),
        dosage: z.string().min(1, 'Dosage is required'),
      })
    )
    .min(1, 'At least one medication is required'),
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
    control,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      medications: [{ drug: '', dosage: '' }],
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'medications',
  })
 
  // Populate form when editing
  useEffect(() => {
    if (patient) {
      setValue('name', patient.name)
      setValue('phone', patient.phone)
      setValue('address', patient.address || '')
      const meds = Array.isArray(patient.medicationInfo)
        ? (patient.medicationInfo as any[])
        : []
      setValue('medications',
        meds.length
          ? meds.map((m) => ({ drug: String((m as any).drug || ''), dosage: String((m as any).dosage || '') }))
          : [{ drug: '', dosage: '' }]
      )
    }
  }, [patient, setValue])

  const onSubmit = async (values: FormValues) => {
    try {
      const payload: any = {
        name: values.name,
        phone: values.phone,
        address: values.address,
        medicationInfo: (values.medications || [])
          .filter((m) => m.drug.trim() || m.dosage.trim())
          .map((m) => ({ drug: m.drug.trim(), dosage: m.dosage.trim() })),
      }

      if (isEditing && patient) {
        await updatePatientMutation.mutateAsync({ id: patient.id, data: payload })
      } else {
        await createPatientMutation.mutateAsync(payload as CreatePatientData)
      }
      
      reset()
      onSuccess?.()
    } catch (error) {
      console.error('Failed to save patient:', error)
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
          Address *
        </label>
        <input
          {...register('address')}
          className="input"
          placeholder="123 Main St, Springfield"
          disabled={isPending}
        />
        {errors.address && (
          <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Medications *
        </label>
        <div className="space-y-3">
          {(fields as any[]).length === 0 && (
            <div className="text-sm text-gray-600 bg-brand-100/40 border border-brand-200 rounded px-3 py-2">
              No medications added. Add entries like “Lisinopril” and “10mg daily”.
            </div>
          )}
          {(fields as any[]).map((field: any, index: number) => (
            <div key={field.id || index} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
              <input
                {...register(`medications.${index}.drug` as const)}
                className="input md:col-span-2"
                placeholder="Drug name (e.g., Lisinopril)"
                disabled={isPending}
              />
              <input
                {...register(`medications.${index}.dosage` as const)}
                className="input md:col-span-2"
                placeholder="Dosage (e.g., 10mg daily)"
                disabled={isPending}
              />
              <button
                type="button"
                onClick={() => remove(index)}
                className="btn-outline"
                disabled={isPending}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => append({ drug: '', dosage: '' } as any)}
            className="btn-primary"
            disabled={isPending}
          >
            + Add Medication
          </button>
        </div>
        { (errors as any).medications?.message || (errors as any).medications?._errors?.[0] ? (
          <p className="mt-1 text-sm text-red-600">
            { (errors as any).medications?.message || (errors as any).medications?._errors?.[0] }
          </p>
        ) : null }
      </div>

      {/** Error Messages **/}
      {createPatientMutation.error ? (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">
            {String((createPatientMutation.error as any)?.message || 'Failed to create patient')}
          </p>
        </div>
      ) : null}

      {updatePatientMutation.error ? (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">
            {String((updatePatientMutation.error as any)?.message || 'Failed to update patient')}
          </p>
        </div>
      ) : null}

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
