'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { Project } from '@/lib/types'
import { toast } from 'sonner'
import { Button } from '@/components/@/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/@/ui/card'
import { 
  FileSignature, 
  Plus, 
  Eye,
  Download,
  FileText,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react'
import { formatDateRelative } from '@/lib/utils'

interface Contract {
  id: string
  project_id: string
  title: string
  description: string | null
  status: 'draft' | 'sent' | 'signed' | 'expired' | 'cancelled'
  contract_url: string | null
  created_at: string
  updated_at: string
  signed_at: string | null
}

interface MinimalContractsProps {
  project: Project | null
  onContractAttached?: () => void
  onContractRemoved?: () => void
}

export function MinimalContracts({ 
  project, 
  onContractAttached, 
  onContractRemoved 
}: MinimalContractsProps) {
  const { user } = useAuth()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (project) {
      fetchProjectContracts()
    } else {
      setContracts([])
    }
  }, [project])

  const fetchProjectContracts = async () => {
    if (!user || !project) return

    try {
      setIsLoading(true)
      // First check if there are contracts directly attached to the project
      const { data: projectContracts, error: projectError } = await supabase
        .from('project_contracts')
        .select(`
          *,
          contracts(*)
        `)
        .eq('project_id', project.id)

      if (projectError) throw projectError

      // Also check if the project itself has a contract_url
      const contractsData: Contract[] = []

      // Add contracts from project_contracts table
      if (projectContracts && projectContracts.length > 0) {
        projectContracts.forEach(pc => {
          if (pc.contracts) {
            contractsData.push(pc.contracts)
          }
        })
      }

      // Add direct contract URL from project if exists
      if (project.contract_url) {
        contractsData.push({
          id: 'project-direct',
          project_id: project.id,
          title: 'Project Contract',
          description: 'Main project contract',
          status: 'signed',
          contract_url: project.contract_url,
          created_at: project.created_at,
          updated_at: project.updated_at,
          signed_at: project.updated_at
        })
      }

      setContracts(contractsData)
    } catch (error) {
      console.error('Error fetching project contracts:', error)
      toast.error('Failed to load project contracts')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: 'secondary' as const, icon: FileText, text: 'Draft', color: 'text-muted-foreground' },
      sent: { variant: 'outline' as const, icon: Clock, text: 'Sent', color: 'text-blue-600' },
      signed: { variant: 'default' as const, icon: CheckCircle, text: 'Signed', color: 'text-green-600' },
      expired: { variant: 'destructive' as const, icon: XCircle, text: 'Expired', color: 'text-red-600' },
      cancelled: { variant: 'destructive' as const, icon: XCircle, text: 'Cancelled', color: 'text-red-600' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    const IconComponent = config.icon

    return (
      <span className={`flex items-center gap-1 text-xs ${config.color}`}>
        <IconComponent className="h-3 w-3" />
        {config.text}
      </span>
    )
  }

  const handleViewContract = (contractUrl: string | null) => {
    if (!contractUrl) {
      toast.error('No contract URL available')
      return
    }
    window.open(contractUrl, '_blank')
  }

  const handleDownloadContract = async (contractUrl: string | null) => {
    if (!contractUrl) {
      toast.error('No contract URL available')
      return
    }
    
    try {
      // For external URLs, we can try to download directly
      const response = await fetch(contractUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'contract.pdf'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading contract:', error)
      // Fallback to opening in new tab
      window.open(contractUrl, '_blank')
    }
  }

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center text-muted-foreground">
          <FileSignature className="h-6 w-6 mx-auto mb-2 opacity-50" />
          <p className="text-xs">Select a project to view contracts</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm">Contracts</h3>
            <p className="text-xs text-muted-foreground truncate">
              {project.title}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
            <p className="text-xs text-muted-foreground mt-1">Loading...</p>
          </div>
        ) : contracts.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <FileSignature className="h-6 w-6 mx-auto mb-1 opacity-50" />
            <p className="text-xs">No contracts attached</p>
          </div>
        ) : (
          contracts.map((contract) => (
            <Card key={contract.id} className="animate-fade-in">
              <CardHeader className="pb-2 px-3 pt-3">
                <CardTitle className="text-xs">{contract.title}</CardTitle>
                <div className="flex items-center justify-between">
                  {getStatusBadge(contract.status)}
                  <p className="text-[10px] text-muted-foreground">
                    {formatDateRelative(contract.created_at)}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                {contract.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {contract.description}
                  </p>
                )}
                
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewContract(contract.contract_url)}
                    disabled={!contract.contract_url}
                    className="h-6 text-xs flex-1"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadContract(contract.contract_url)}
                    disabled={!contract.contract_url}
                    className="h-6 text-xs flex-1"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
