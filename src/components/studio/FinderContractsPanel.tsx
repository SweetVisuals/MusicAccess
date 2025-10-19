'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FileSignature,
  Plus,
  Download,
  Eye,
  Trash2,
  Calendar,
  Clock,
  User,
  FileText,
  X
} from 'lucide-react'
import { type Project, type Contract } from '@/lib/types'
import { formatDateRelative } from '@/lib/utils'

interface FinderContractsPanelProps {
  project: Project
  onContractAttached?: () => void
  onContractRemoved?: () => void
}

export function FinderContractsPanel({ project, onContractAttached, onContractRemoved }: FinderContractsPanelProps) {
  const { user } = useAuth()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [availableContracts, setAvailableContracts] = useState<Contract[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAttachDialog, setShowAttachDialog] = useState(false)

  useEffect(() => {
    if (project?.id) {
      fetchProjectContracts()
      fetchAvailableContracts()
    }
  }, [project?.id])

  const fetchProjectContracts = async () => {
    if (!user || !project?.id) return

    try {
      setIsLoading(true)
      
      // Fetch contracts associated with this project
      const { data, error } = await supabase
        .from('project_contracts')
        .select(`
          contracts (
            id,
            title,
            type,
            status,
            created_at,
            expires_at,
            royalty_split,
            revenue_split,
            split_notes,
            terms_conditions,
            distribution_platforms,
            distribution_territories,
            distribution_notes,
            publisher_name,
            pro_affiliation,
            publishing_notes
          )
        `)
        .eq('project_id', project.id)

      if (error) throw error

      const projectContracts = data?.map(item => item.contracts).filter(Boolean) as Contract[] || []
      setContracts(projectContracts)
    } catch (error) {
      console.error('Error fetching project contracts:', error)
      toast.error('Failed to load contracts')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAvailableContracts = async () => {
    if (!user) return

    try {
      // Fetch user's available contracts (not attached to this project)
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) throw error
      setAvailableContracts(data || [])
    } catch (error) {
      console.error('Error fetching available contracts:', error)
    }
  }

  const handleAttachContract = async (contractId: string) => {
    if (!user || !project?.id) return

    try {
      const { error } = await supabase
        .from('project_contracts')
        .insert({
          project_id: project.id,
          contract_id: contractId,
          user_id: user.id
        })

      if (error) throw error

      toast.success('Contract attached successfully')
      fetchProjectContracts()
      setShowAttachDialog(false)
      onContractAttached?.()
    } catch (error) {
      console.error('Error attaching contract:', error)
      toast.error('Failed to attach contract')
    }
  }

  const handleRemoveContract = async (contractId: string) => {
    if (!user || !project?.id) return

    try {
      const { error } = await supabase
        .from('project_contracts')
        .delete()
        .eq('project_id', project.id)
        .eq('contract_id', contractId)
        .eq('user_id', user.id)

      if (error) throw error

      toast.success('Contract removed successfully')
      fetchProjectContracts()
      onContractRemoved?.()
    } catch (error) {
      console.error('Error removing contract:', error)
      toast.error('Failed to remove contract')
    }
  }

  const handleDownloadContract = async (contract: Contract) => {
    try {
      // Generate a simple contract document
      const contractContent = `
        CONTRACT AGREEMENT
        =================
        
        Title: ${contract.title}
        Type: ${contract.type}
        Status: ${contract.status}
        Created: ${new Date(contract.created_at).toLocaleDateString()}
        ${contract.expires_at ? `Expires: ${new Date(contract.expires_at).toLocaleDateString()}` : ''}
        
        ${contract.royalty_split ? `Royalty Split: ${contract.royalty_split}%` : ''}
        ${contract.revenue_split ? `Revenue Split: ${contract.revenue_split}%` : ''}
        ${contract.split_notes ? `Split Notes: ${contract.split_notes}` : ''}
        
        ${contract.terms_conditions ? `Terms & Conditions: ${contract.terms_conditions}` : ''}
        
        Distribution:
        ${contract.distribution_platforms ? `Platforms: ${contract.distribution_platforms}` : ''}
        ${contract.distribution_territories ? `Territories: ${contract.distribution_territories}` : ''}
        ${contract.distribution_notes ? `Notes: ${contract.distribution_notes}` : ''}
        
        Publishing:
        ${contract.publisher_name ? `Publisher: ${contract.publisher_name}` : ''}
        ${contract.pro_affiliation ? `PRO Affiliation: ${contract.pro_affiliation}` : ''}
        ${contract.publishing_notes ? `Notes: ${contract.publishing_notes}` : ''}
        
        Project: ${project.title}
        Date: ${new Date().toLocaleDateString()}
      `.trim()

      const blob = new Blob([contractContent], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${project.title.replace(/[^a-z0-9]/gi, '_')}_${contract.title.replace(/[^a-z0-9]/gi, '_')}_contract.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('Contract downloaded')
    } catch (error) {
      console.error('Error downloading contract:', error)
      toast.error('Failed to download contract')
    }
  }

  const getContractStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'expired': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getContractTypeIcon = (type: string) => {
    switch (type) {
      case 'service': return <FileText className="h-4 w-4" />
      case 'audio': return <FileSignature className="h-4 w-4" />
      default: return <FileSignature className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Contracts</h3>
            <Badge variant="secondary">{contracts.length}</Badge>
          </div>
          <Button
            size="sm"
            onClick={() => setShowAttachDialog(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Attach Contract
          </Button>
        </div>
      </div>

      {/* Contracts List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {contracts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileSignature className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No contracts attached</p>
            <p className="text-xs mt-1">Attach a contract to manage agreements</p>
          </div>
        ) : (
          contracts.map((contract) => (
            <Card key={contract.id} className="group hover:shadow-sm transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {getContractTypeIcon(contract.type)}
                      <CardTitle className="text-sm font-semibold line-clamp-1">
                        {contract.title}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={getContractStatusColor(contract.status)}>
                        {contract.status}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDateRelative(contract.created_at)}</span>
                      </div>
                      {contract.expires_at && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Expires {formatDateRelative(contract.expires_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownloadContract(contract)}
                      className="h-6 w-6"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveContract(contract.id)}
                      className="h-6 w-6 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-xs text-muted-foreground">
                  {contract.royalty_split && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Royalty:</span>
                      <span>{contract.royalty_split}%</span>
                    </div>
                  )}
                  {contract.revenue_split && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Revenue:</span>
                      <span>{contract.revenue_split}%</span>
                    </div>
                  )}
                  {contract.distribution_platforms && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Platforms:</span>
                      <span className="line-clamp-1">{contract.distribution_platforms}</span>
                    </div>
                  )}
                  {contract.publisher_name && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Publisher:</span>
                      <span>{contract.publisher_name}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Attach Contract Dialog */}
      {showAttachDialog && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Attach Contract</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAttachDialog(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select a contract to attach to this project
              </p>
              
              {availableContracts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileSignature className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No available contracts</p>
                  <p className="text-xs mt-1">Create contracts in the contracts section first</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availableContracts.map((contract) => (
                    <div
                      key={contract.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                      onClick={() => handleAttachContract(contract.id)}
                    >
                      <div className="flex items-center gap-3">
                        {getContractTypeIcon(contract.type)}
                        <div>
                          <p className="text-sm font-medium">{contract.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {contract.type} • {formatDateRelative(contract.created_at)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className={getContractStatusColor(contract.status)}>
                        {contract.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAttachDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
