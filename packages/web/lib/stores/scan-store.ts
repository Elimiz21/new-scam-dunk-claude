import { create } from 'zustand'

export interface ScanResult {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  chatFile: {
    name: string
    size: number
    type: string
    uploadedAt: string
  }
  analysis: {
    summary: string
    redFlags: string[]
    recommendations: string[]
    suspiciousPatterns: {
      pattern: string
      severity: 'low' | 'medium' | 'high'
      description: string
    }[]
    sentiment: {
      overall: 'positive' | 'neutral' | 'negative'
      confidence: number
    }
    entities: {
      type: 'person' | 'organization' | 'phone' | 'email' | 'url' | 'money'
      value: string
      confidence: number
    }[]
  }
  createdAt: string
  updatedAt: string
  userId: string
}

interface ScanState {
  currentScan: ScanResult | null
  scans: ScanResult[]
  loading: boolean
  uploadProgress: number
  
  // Actions
  startScan: (file: File) => Promise<string>
  getScanResults: (scanId: string) => Promise<ScanResult>
  getScansHistory: () => Promise<ScanResult[]>
  deleteScan: (scanId: string) => Promise<void>
  setCurrentScan: (scan: ScanResult | null) => void
  updateScanProgress: (progress: number) => void
  reset: () => void
}

export const useScanStore = create<ScanState>()((set, get) => ({
  currentScan: null,
  scans: [],
  loading: false,
  uploadProgress: 0,

  startScan: async (file: File) => {
    set({ loading: true, uploadProgress: 0 })
    
    try {
      const formData = new FormData()
      formData.append('chatFile', file)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/scans`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Scan upload failed')
      }

      const result = await response.json()
      
      set({
        currentScan: result,
        loading: false,
        uploadProgress: 100,
      })

      return result.id
    } catch (error) {
      set({ loading: false, uploadProgress: 0 })
      throw error
    }
  },

  getScanResults: async (scanId: string) => {
    set({ loading: true })
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/scans/${scanId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to get scan results')
      }

      const scan = await response.json()
      
      set({
        currentScan: scan,
        loading: false,
      })

      return scan
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  getScansHistory: async () => {
    set({ loading: true })
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/scans`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to get scans history')
      }

      const scans = await response.json()
      
      set({
        scans,
        loading: false,
      })

      return scans
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  deleteScan: async (scanId: string) => {
    set({ loading: true })
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/scans/${scanId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete scan')
      }

      const { scans } = get()
      set({
        scans: scans.filter(scan => scan.id !== scanId),
        currentScan: get().currentScan?.id === scanId ? null : get().currentScan,
        loading: false,
      })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  setCurrentScan: (scan: ScanResult | null) => {
    set({ currentScan: scan })
  },

  updateScanProgress: (progress: number) => {
    set({ uploadProgress: progress })
  },

  reset: () => {
    set({
      currentScan: null,
      loading: false,
      uploadProgress: 0,
    })
  },
}))