import axios from 'axios'

const baseURL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:3001/api'

export const API_BASE_URL = baseURL

if (typeof window !== 'undefined') {
  // Log once for debugging (visible in browser console)
  // eslint-disable-next-line no-console
  console.log('[API] Base URL:', baseURL)
}

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
}) 