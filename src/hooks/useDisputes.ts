import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface Dispute {
  id: string
  user_id: string
  transaction_id: string
  dispute_type: 'unauthorized_charge' | 'service_not_received' | 'quality_issue' | 'refund_request' | 'other'
  title: string
  description: string
  amount_disputed: number
  status: 'open' | 'under_review' | 'resolved' | 'closed' | 'escalated'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  resolution?: string
  created_at: string
  updated_at: string
  resolved_at?: string
}

export interface DisputeMessage {
  id: string
  dispute_id: string
  user_id: string
  message: string
  is_admin: boolean
  created_at: string
}

export interface WalletTransaction {
  id: string
  type: string
  amount: number
  description: string
  created_at: string
}

export interface DisputeStats {
  total_disputes: number
  open_disputes: number
  resolved_disputes: number
}

export const useDisputes = (userId: string) => {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [disputeMessages, setDisputeMessages] = useState<DisputeMessage[]>([])
  const [stats, setStats] = useState<DisputeStats>({
    total_disputes: 0,
    open_disputes: 0,
    resolved_disputes: 0
  })
  const [loading, setLoading] = useState(false)

  const fetchDisputes = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('disputes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setDisputes(data || [])

      // Calculate stats
      const total = data?.length || 0
      const open = data?.filter(d => d.status === 'open' || d.status === 'under_review' || d.status === 'escalated').length || 0
      const resolved = data?.filter(d => d.status === 'resolved' || d.status === 'closed').length || 0

      setStats({
        total_disputes: total,
        open_disputes: open,
        resolved_disputes: resolved
      })
    } catch (error) {
      console.error('Error fetching disputes:', error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  const fetchDisputeMessages = useCallback(async (disputeId: string) => {
    try {
      const { data, error } = await supabase
        .from('dispute_messages')
        .select('*')
        .eq('dispute_id', disputeId)
        .order('created_at', { ascending: true })

      if (error) throw error

      setDisputeMessages(data || [])
    } catch (error) {
      console.error('Error fetching dispute messages:', error)
    }
  }, [])

  const createDispute = useCallback(async (
    transactionId: string,
    disputeType: Dispute['dispute_type'],
    title: string,
    description: string,
    amount: number
  ) => {
    try {
      const { data, error } = await supabase
        .from('disputes')
        .insert([
          {
            user_id: userId,
            transaction_id: transactionId,
            dispute_type: disputeType,
            title,
            description,
            amount_disputed: amount,
            status: 'open',
            priority: 'medium'
          }
        ])
        .select()

      if (error) throw error

      await fetchDisputes() // Refresh the disputes list

      return { success: true, data }
    } catch (error) {
      console.error('Error creating dispute:', error)
      return { success: false, error: error.message }
    }
  }, [userId, fetchDisputes])

  const getDisputableTransactions = useCallback(async (): Promise<WalletTransaction[]> => {
    // For now, return demo data. In a real app, this would fetch from the database
    return [
      {
        id: 'demo-1',
        type: 'purchase',
        amount: -49.99,
        description: 'Beat purchase: Summer Vibes',
        created_at: new Date(Date.now() - 86400000).toISOString() // 1 day ago
      },
      {
        id: 'demo-2',
        type: 'purchase',
        amount: -29.99,
        description: 'Sample pack: Urban Drums',
        created_at: new Date(Date.now() - 172800000).toISOString() // 2 days ago
      },
      {
        id: 'demo-3',
        type: 'purchase',
        amount: -19.99,
        description: 'Plugin: Vocal Effects',
        created_at: new Date(Date.now() - 259200000).toISOString() // 3 days ago
      }
    ]
  }, [])

  const addDisputeMessage = useCallback(async (
    disputeId: string,
    message: string,
    isAdmin: boolean = false
  ) => {
    try {
      const { data, error } = await supabase
        .from('dispute_messages')
        .insert([
          {
            dispute_id: disputeId,
            user_id: userId,
            message,
            is_admin: isAdmin
          }
        ])
        .select()

      if (error) throw error

      await fetchDisputeMessages(disputeId) // Refresh messages

      return { success: true, data }
    } catch (error) {
      console.error('Error adding dispute message:', error)
      return { success: false, error: error.message }
    }
  }, [userId, fetchDisputeMessages])

  const updateDisputeStatus = useCallback(async (
    disputeId: string,
    status: Dispute['status'],
    resolution?: string
  ) => {
    try {
      const updateData: any = { status }
      if (resolution) {
        updateData.resolution = resolution
        updateData.resolved_at = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('disputes')
        .update(updateData)
        .eq('id', disputeId)
        .select()

      if (error) throw error

      await fetchDisputes() // Refresh disputes

      return { success: true, data }
    } catch (error) {
      console.error('Error updating dispute status:', error)
      return { success: false, error: error.message }
    }
  }, [fetchDisputes])

  return {
    disputes,
    disputeMessages,
    stats,
    loading,
    fetchDisputes,
    fetchDisputeMessages,
    createDispute,
    getDisputableTransactions,
    addDisputeMessage,
    updateDisputeStatus
  }
}