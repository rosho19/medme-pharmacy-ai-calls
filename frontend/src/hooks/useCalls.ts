import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/utils/api'
import { CallItem, CallWithLogs, CreateCallData, UpdateCallData } from '@/types'

// Fetch all calls
export function useCalls(status?: string, patientId?: string, page = 1, limit = 10, search?: string) {
  return useQuery({
    queryKey: ['calls', { status, patientId, page, limit, search }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (status) params.append('status', status)
      if (patientId) params.append('patientId', patientId)
      params.append('page', page.toString())
      params.append('limit', limit.toString())
      if (search) params.append('search', search)
      
      const response = await api.get(`/calls?${params}`)
      return response.data
    },
    staleTime: 60 * 1000,
    refetchInterval: 5 * 1000,
    refetchOnWindowFocus: true,
  })
}

// Fetch single call with logs
export function useCall(id: string) {
  return useQuery({
    queryKey: ['call', id],
    queryFn: async () => {
      const response = await api.get(`/calls/${id}`)
      return response.data.data as CallWithLogs
    },
    enabled: !!id,
    staleTime: 10 * 1000,
    refetchInterval: 5 * 1000,
    refetchOnWindowFocus: true,
  })
}

// Create call (trigger AI call)
export function useCreateCall() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CreateCallData) => {
      const response = await api.post('/calls', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calls'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

// Update call status
export function useUpdateCall() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCallData }) => {
      const response = await api.patch(`/calls/${id}/status`, data)
      return response.data
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['calls'] })
      queryClient.invalidateQueries({ queryKey: ['call', id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

// Delete call
export function useDeleteCall() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/calls/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calls'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

// Get dashboard statistics
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // Since we don't have a dedicated stats endpoint, we'll fetch the data we need
      const [patientsRes, callsRes] = await Promise.all([
        api.get('/patients?limit=1'), // Just to get total count
        api.get('/calls?limit=100'), // Get recent calls for stats
      ])
      
      const totalPatients = patientsRes.data.pagination?.total || 0
      const calls = callsRes.data.data || []
      
      // Calculate stats from calls data
      const today = new Date().toISOString().split('T')[0]
      const callsToday = calls.filter((call: CallItem) => 
        call.createdAt.startsWith(today)
      ).length
      
      const completedCalls = calls.filter((call: CallItem) => 
        call.status === 'COMPLETED'
      ).length
      
      const successRate = calls.length > 0 
        ? Math.round((completedCalls / calls.length) * 100)
        : 0
      
      return {
        totalPatients,
        callsToday,
        successRate,
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for real-time stats
  })
}
