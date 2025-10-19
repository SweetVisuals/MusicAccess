'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Button } from '@/components/@/ui/button'
import { Input } from '@/components/@/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/@/ui/card'
import { Badge } from '@/components/@/ui/badge'
import { 
  FileSignature, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Search,
  Filter,
  Pin,
  Clock,
  User,
  Download,
  FileText,
  CheckCircle,
  AlertCircle,
  Calendar
} from 'lucide-react'
import { formatDateRelative } from '@/lib/utils'

interface Contract {
  id: string
  project_id: string
  title: string
  description: string | null
  status: 'draft' | 'sent' | 'signed' | 'expired' | 'cancelled'
  terms: string | null
  price: number | null
  deadline: string | null
  created_at: string
  updated_at: string
  signed_at: string | null
  profiles?: {
    full_name: string
    avatar_url: string
    username: string
  }
}

interface ContractsBrowserProps {
  project: any | null
  onContractCreated?: () => void
  onContractUpdated?: () => void
  onContractDeleted?: () => void
}

export function ContractsBrowser({ 
  project, 
  onContractCreated, 
  onContractUpdated, 
  onContractDeleted 
}: ContractsBrowserProps) {
  const { user } = useAuth()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newContractTitle, setNewContractTitle] = useState('')
  const [newContractDescription, setNewContractDescription] = useState('')
  const [newContractPrice, setNewContractPrice] = useState('')
  const [editingContractId, setEditingContractId] = useState<string | null>(null)
  const [editingContractTitle, setEditingContractTitle] = useState('')
  const [editingContractDescription, setEditingContractDescription] = useState('')
  const [editingContractPrice, setEditingContractPrice] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

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
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          profiles:user_id(full_name, avatar_url, username)
        `)
        .eq('project_id', project.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setContracts(data || [])
    } catch (error) {
      console.error('Error fetching project contracts:', error)
      toast.error('Failed to load project contracts')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: 'secondary' as const, icon: FileText, text: 'Draft' },
      sent: { variant: 'outline' as const, icon: Clock, text: 'Sent' },
      signed: { variant: 'default' as const, icon: CheckCircle, text: 'Signed' },
      expired: { variant: 'destructive' as const, icon: AlertCircle, text: 'Expired' },
      cancelled: { variant: 'destructive' as const, icon: X, text: 'Cancelled' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    const IconComponent = config.icon

    return (
      <Badge variant={config.variant} className="text-xs">
        <IconComponent className="h-3 w-3 mr-1" />
        {config.text}
      </Badge>
    )
  }

  const filteredContracts = contracts.filter(contract => 
    contract.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contract.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contract.status.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!project) {
    return (
      <div className="flex-1 bg-background border-l flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <FileSignature className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Select a project to view contracts</p>
            <p className="text-sm">Choose a project from the sidebar to manage contracts</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-background border-l flex flex-col">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Project Contracts</h2>
            <p className="text-muted-foreground">{project.title}</p>
          </div>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            New Contract
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contracts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Loading contracts...</p>
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileSignature className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No contracts found</p>
            {searchQuery && (
              <p className="text-xs mt-1">Try a different search term</p>
            )}
            {!searchQuery && (
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="mt-4 gap-2"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                Create First Contract
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredContracts.map((contract) => (
              <Card key={contract.id} className="hover:shadow-md transition-all duration-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-sm line-clamp-1 text-foreground">
                          {contract.title}
                        </h3>
                        {getStatusBadge(contract.status)}
                      </div>
                      
                      {contract.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {contract.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {contract.price && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">${contract.price}</span>
                          </div>
                        )}
                        {contract.deadline && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Due {formatDateRelative(contract.deadline)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Created {formatDateRelative(contract.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border/20">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {contract.profiles?.avatar_url ? (
                        <img 
                          src={contract.profiles.avatar_url} 
                          alt={contract.profiles.full_name}
                          className="h-4 w-4 rounded-full border"
                        />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                      <span className="font-medium">{contract.profiles?.full_name || 'Unknown'}</span>
                    </div>
                    
                    {contract.signed_at && (
                      <div className="text-xs text-muted-foreground">
                        Signed {formatDateRelative(contract.signed_at)}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Contract Form (Placeholder) */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Create New Contract</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="Contract title..."
                  value={newContractTitle}
                  onChange={(e) => setNewContractTitle(e.target.value)}
                />
                <textarea
                  placeholder="Contract description..."
                  value={newContractDescription}
                  onChange={(e) => setNewContractDescription(e.target.value)}
                  className="w-full min-h-[80px] p-3 border rounded-md resize-none text-sm"
                />
                <Input
                  type="number"
                  placeholder="Price (optional)"
                  value={newContractPrice}
                  onChange={(e) => setNewContractPrice(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    // Placeholder for contract creation
                    toast.info('Contract creation functionality coming soon')
                    setShowCreateForm(false)
                  }}
                  className="flex-1"
                >
                  Create Contract
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
