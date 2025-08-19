import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/utils/api'
import { Patient, CreatePatientData, UpdatePatientData } from '@/types'

// Fetch all patients
export function usePatients(search?: string, page = 1, limit = 10) {
  return useQuery({
    queryKey: ['patients', { search, page, limit }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      params.append('page', page.toString())
      params.append('limit', limit.toString())
      
      const response = await api.get(`/patients?${params}`)
      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Fetch single patient
export function usePatient(id: string) {
  return useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      const response = await api.get(`/patients/${id}`)
      return response.data.data as Patient
    },
    enabled: !!id,
  })
}

// Create patient mutation
export function useCreatePatient() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CreatePatientData) => {
      const response = await api.post('/patients', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] })
    },
  })
}

// Update patient mutation
export function useUpdatePatient() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePatientData }) => {
      const response = await api.put(`/patients/${id}`, data)
      return response.data
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      queryClient.invalidateQueries({ queryKey: ['patient', id] })
    },
  })
}

// Delete patient mutation
export function useDeletePatient() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/patients/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] })
    },
  })
}
