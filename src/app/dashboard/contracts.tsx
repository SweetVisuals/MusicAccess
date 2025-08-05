import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/@/ui/card"
import { Button } from "@/components/@/ui/button"
import { Input } from "@/components/@/ui/input"
import { Label } from "@/components/@/ui/label"
import { Badge } from "@/components/@/ui/badge"
import { FileText, Upload, Download, Clock, CheckCircle, XCircle, Search, Filter, Plus, Trash2 } from 'lucide-react'
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/@/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/@/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/@/ui/tabs"
import { Checkbox } from "@/components/@/ui/checkbox"
import { ContractDetailsDialog } from "@/components/dashboard/contracts/ContractDetailsDialog"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

interface Contract {
  id: string
  title: string
  type: 'service' | 'audio'
  status: 'draft' | 'pending' | 'active' | 'expired'
  created_at: string // Changed to match Supabase column name
  expires_at?: string // Changed to match Supabase column name
  royalty_split?: number
  revenue_split?: number
  split_notes?: string
  terms_conditions?: string
  distribution_platforms?: string
  distribution_territories?: string
  distribution_notes?: string
  publisher_name?: string
  pro_affiliation?: string
  publishing_notes?: string
}

export default function ContractsPage() {
  const { user } = useAuth()
  const [isCreateOrEditDialogOpen, setIsCreateOrEditDialogOpen] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [contracts, setContracts] = useState<Contract[]>([])
  const [allPlatformsChecked, setAllPlatformsChecked] = useState(false)
  const [allTerritoriesChecked, setAllTerritoriesChecked] = useState(false)
  const [isEditing, setIsEditing] = useState(false) // New state to track if we are editing
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null)

  useEffect(() => {
    const fetchContracts = async () => {
      if (!user) return

      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('user_id', user.id)

      if (error) {
        console.error("Error fetching contracts:", error)
      } else {
        // Map created_at and expires_at from Supabase response to camelCase for the frontend interface
        const mappedContracts = data.map(contract => ({
          ...contract,
          created_at: contract.created_at,
          expires_at: contract.expires_at,
        }))
        setContracts(mappedContracts as Contract[])
      }
    }

    fetchContracts()
  }, [user])

  const initialNewContractState: Partial<Contract> = {
    title: '',
    type: 'service',
    royalty_split: undefined,
    revenue_split: undefined,
    split_notes: '',
    terms_conditions: '',
    distribution_platforms: '',
    distribution_territories: '',
    distribution_notes: '',
    publisher_name: '',
    pro_affiliation: '',
    publishing_notes: '',
  }

  const [newContract, setNewContract] = useState<Partial<Contract>>(initialNewContractState)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setNewContract(prev => ({ ...prev, [id]: value }))
  }

  const handleCheckboxChange = (id: string, checked: boolean) => {
    if (id === 'allPlatforms') {
      setAllPlatformsChecked(checked)
      setNewContract(prev => ({ ...prev, distribution_platforms: checked ? 'All' : '' }))
    } else if (id === 'allTerritories') {
      setAllTerritoriesChecked(checked)
      setNewContract(prev => ({ ...prev, distribution_territories: checked ? 'All' : '' }))
    }
  }

  const handleCreateNewContractClick = () => {
    setIsEditing(false)
    setNewContract(initialNewContractState) // Reset form for new contract
    setAllPlatformsChecked(false)
    setAllTerritoriesChecked(false)
    setIsCreateOrEditDialogOpen(true)
  }

  const handleEditContract = (contract: Contract) => {
    setIsEditing(true)
    setNewContract(contract) // Pre-fill form with existing contract data
    setAllPlatformsChecked(contract.distribution_platforms === 'All')
    setAllTerritoriesChecked(contract.distribution_territories === 'All')
    setIsDetailsDialogOpen(false) // Close details dialog
    setIsCreateOrEditDialogOpen(true) // Open create/edit dialog
  }

  const handleDeleteContract = async () => {
    if (!contractToDelete) return

    const { error } = await supabase
      .from('contracts')
      .delete()
      .eq('id', contractToDelete.id)

    if (error) {
      console.error("Error deleting contract:", error)
    } else {
      console.log("Contract deleted successfully:", contractToDelete.id)
      setContracts(prev => prev.filter(c => c.id !== contractToDelete.id))
      setIsDeleteDialogOpen(false)
      setContractToDelete(null)
    }
  }

  const handleSubmit = async () => {
    if (!user) {
      console.error("User not authenticated.")
      return
    }

    const contractData = {
      user_id: user.id,
      title: newContract.title,
      type: newContract.type,
      status: newContract.status || 'draft', // Keep existing status if editing, otherwise default to draft
      royalty_split: newContract.royalty_split,
      revenue_split: newContract.revenue_split,
      split_notes: newContract.split_notes,
      terms_conditions: newContract.terms_conditions,
      distribution_notes: newContract.distribution_notes,
      publisher_name: newContract.publisher_name,
      pro_affiliation: newContract.pro_affiliation,
      publishing_notes: newContract.publishing_notes,
      distribution_platforms: allPlatformsChecked ? 'All' : newContract.distribution_platforms,
      distribution_territories: allTerritoriesChecked ? 'All' : newContract.distribution_territories,
    }

    if (isEditing && newContract.id) {
      // Update existing contract
      const { data, error } = await supabase
        .from('contracts')
        .update(contractData)
        .eq('id', newContract.id)
        .select()

      if (error) {
        console.error("Error updating contract:", error)
      } else {
        console.log("Contract updated successfully:", data)
        if (data && data.length > 0) {
          setContracts(prev => prev.map(c => c.id === data[0].id ? {
            ...data[0],
            created_at: data[0].created_at,
            expires_at: data[0].expires_at,
          } as Contract : c))
        }
        setIsCreateOrEditDialogOpen(false)
        setNewContract(initialNewContractState) // Reset form
        setAllPlatformsChecked(false)
        setAllTerritoriesChecked(false)
        setIsEditing(false)
      }
    } else {
      // Create new contract
      const { data, error } = await supabase
        .from('contracts')
        .insert([contractData])
        .select()

      if (error) {
        console.error("Error creating contract:", error)
      } else {
        console.log("Contract created successfully:", data)
        if (data && data.length > 0) {
          setContracts(prev => [...prev, {
            ...data[0],
            created_at: data[0].created_at,
            expires_at: data[0].expires_at,
          } as Contract])
        }
        setIsCreateOrEditDialogOpen(false)
        setNewContract(initialNewContractState) // Reset form
        setAllPlatformsChecked(false)
        setAllTerritoriesChecked(false)
      }
    }
  }

  const handleStatusChange = async (id: string, newStatus: Contract['status']) => {
    const { data, error } = await supabase
      .from('contracts')
      .update({ status: newStatus })
      .eq('id', id)
      .select()

    if (error) {
      console.error("Error updating contract status:", error)
    } else {
      console.log("Contract status updated successfully:", data)
      if (data && data.length > 0) {
        setContracts(prev => prev.map(c => c.id === data[0].id ? { ...data[0], created_at: c.created_at } as Contract : c))
        setSelectedContract(prev => prev && prev.id === data[0].id ? { ...prev, status: data[0].status } : prev)
      }
    }
  }

  const getStatusColor = (status: Contract['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500'
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500'
      case 'expired':
        return 'bg-red-500/10 text-red-500'
      default:
        return 'bg-gray-500/10 text-gray-500'
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-6 animate-fade-in p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Contracts</h1>
            <p className="text-muted-foreground">Manage your service and audio contracts</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search contracts..." />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Button onClick={handleCreateNewContractClick}>
              <Plus className="h-4 w-4 mr-2" />
              New Contract
            </Button>
          </div>
        </div>

        {/* Contract Types */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Contracts</TabsTrigger>
            <TabsTrigger value="service">Service Contracts</TabsTrigger>
            <TabsTrigger value="audio">Audio Contracts</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid gap-4">
              {contracts.map((contract) => (
                <Card key={contract.id}>
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium truncate">{contract.title}</h3>
                        <Badge variant="outline">{contract.type}</Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <Badge className={`${getStatusColor(contract.status)} cursor-pointer`}>
                              {contract.status}
                            </Badge>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleStatusChange(contract.id, 'draft')}>Draft</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(contract.id, 'pending')}>Pending</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(contract.id, 'active')}>Active</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(contract.id, 'expired')}>Expired</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>Created {new Date(contract.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="secondary">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button size="sm" onClick={() => {
                        setSelectedContract(contract)
                        setIsDetailsDialogOpen(true)
                      }}>
                        View Details
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <div
                            className="p-2 rounded-md cursor-pointer text-red-500 hover:text-red-600 transition-colors duration-150 ease-in-out"
                            onClick={() => {
                              setContractToDelete(contract)
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </div>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your contract
                              and remove its data from our servers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteContract}>Continue</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="service" className="mt-6">
            <div className="grid gap-4">
              {contracts
                .filter(contract => contract.type === 'service')
                .map((contract) => (
                  <Card key={contract.id}>
                    <CardContent className="flex items-center gap-4 p-6">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium truncate">{contract.title}</h3>
                          <Badge variant="outline">{contract.type}</Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <Badge className={`${getStatusColor(contract.status)} cursor-pointer`}>
                                {contract.status}
                              </Badge>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleStatusChange(contract.id, 'draft')}>Draft</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(contract.id, 'pending')}>Pending</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(contract.id, 'active')}>Active</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(contract.id, 'expired')}>Expired</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>Created {new Date(contract.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="secondary">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        <Button size="sm" onClick={() => {
                          setSelectedContract(contract)
                          setIsDetailsDialogOpen(true)
                        }}>
                          View Details
                        </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <div
                            className="p-2 rounded-md cursor-pointer text-red-500 hover:text-red-600 transition-colors duration-150 ease-in-out"
                            onClick={() => {
                              setContractToDelete(contract)
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </div>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your contract
                              and remove its data from our servers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteContract}>Continue</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="audio" className="mt-6">
            <div className="grid gap-4">
              {contracts
                .filter(contract => contract.type === 'audio')
                .map((contract) => (
                  <Card key={contract.id}>
                    <CardContent className="flex items-center gap-4 p-6">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium truncate">{contract.title}</h3>
                          <Badge variant="outline">{contract.type}</Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <Badge className={`${getStatusColor(contract.status)} cursor-pointer`}>
                                {contract.status}
                              </Badge>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleStatusChange(contract.id, 'draft')}>Draft</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(contract.id, 'pending')}>Pending</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(contract.id, 'active')}>Active</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(contract.id, 'expired')}>Expired</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>Created {new Date(contract.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="secondary">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        <Button size="sm" onClick={() => {
                          setSelectedContract(contract)
                          setIsDetailsDialogOpen(true)
                        }}>
                          View Details
                        </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <div
                            className="p-2 rounded-md cursor-pointer text-red-500 hover:text-red-600 transition-colors duration-150 ease-in-out"
                            onClick={() => {
                              setContractToDelete(contract)
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </div>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your contract
                              and remove its data from our servers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteContract}>Continue</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Contract Details Dialog */}
        <ContractDetailsDialog
          isOpen={isDetailsDialogOpen}
          onClose={() => {
            setIsDetailsDialogOpen(false)
            setSelectedContract(null)
          }}
          contract={selectedContract}
          onEdit={handleEditContract}
          onStatusChange={handleStatusChange}
        />

        {/* Create/Edit Contract Dialog */}
        <Dialog open={isCreateOrEditDialogOpen} onOpenChange={setIsCreateOrEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Edit Contract' : 'Create New Contract'}</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="splits">Splits</TabsTrigger>
                <TabsTrigger value="terms">Terms</TabsTrigger>
                <TabsTrigger value="distribution">Distribution</TabsTrigger>
                <TabsTrigger value="publishing">Publishing</TabsTrigger>
              </TabsList>
              <TabsContent value="general" className="py-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Contract Title</Label>
                    <Input id="title" placeholder="Enter contract title" value={newContract.title || ''} onChange={handleInputChange} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="type">Contract Type</Label>
                    <select
                      id="type"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={newContract.type || 'service'}
                      onChange={handleInputChange}
                    >
                      <option value="service">Service Contract</option>
                      <option value="audio">Audio Contract</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="file">Upload Contract</Label>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Drag and drop your contract file here or{" "}
                        <Button variant="link" className="p-0 h-auto">browse</Button>
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="splits" className="py-4">
                <div className="grid gap-4">
                  <p className="text-muted-foreground mb-2">Define percentage splits for royalties, revenue, etc.</p>
                  <div className="grid gap-2">
                    <Label htmlFor="royalty_split">Royalty Split (%)</Label>
                    <Input id="royalty_split" type="number" placeholder="e.g., 50" min="0" max="100" value={newContract.royalty_split || ''} onChange={handleInputChange} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="revenue_split">Revenue Split (%)</Label>
                    <Input id="revenue_split" type="number" placeholder="e.g., 50" min="0" max="100" value={newContract.revenue_split || ''} onChange={handleInputChange} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="split_notes">Notes on Splits</Label>
                    <Input id="split_notes" placeholder="Any specific details about the splits" value={newContract.split_notes || ''} onChange={handleInputChange} />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="terms" className="py-4">
                <div className="grid gap-4">
                  <p className="text-muted-foreground mb-2">Specify terms and conditions for the contract.</p>
                  <div className="grid gap-2">
                    <Label htmlFor="terms_conditions">Terms and Conditions</Label>
                    <textarea
                      id="terms_conditions"
                      rows={6}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Enter full terms and conditions here..."
                      value={newContract.terms_conditions || ''}
                      onChange={handleInputChange}
                    ></textarea>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="distribution" className="py-4">
                <div className="grid gap-4">
                  <p className="text-muted-foreground mb-2">Details regarding the distribution of the music.</p>
                  <div className="grid gap-2">
                    <Label htmlFor="distribution_platforms">Distribution Platforms</Label>
                    <Input
                      id="distribution_platforms"
                      placeholder="e.g., Spotify, Apple Music, YouTube"
                      value={newContract.distribution_platforms || ''}
                      onChange={handleInputChange}
                      disabled={allPlatformsChecked}
                    />
                    <div className="flex items-center space-x-2 mt-2">
                      <Checkbox
                        id="allPlatforms"
                        checked={allPlatformsChecked}
                        onCheckedChange={(checked: boolean) => handleCheckboxChange('allPlatforms', checked)}
                      />
                      <label
                        htmlFor="allPlatforms"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        All Platforms
                      </label>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="distribution_territories">Distribution Territories</Label>
                    <Input
                      id="distribution_territories"
                      placeholder="e.g., Worldwide, North America, Europe"
                      value={newContract.distribution_territories || ''}
                      onChange={handleInputChange}
                      disabled={allTerritoriesChecked}
                    />
                    <div className="flex items-center space-x-2 mt-2">
                      <Checkbox
                        id="allTerritories"
                        checked={allTerritoriesChecked}
                        onCheckedChange={(checked: boolean) => handleCheckboxChange('allTerritories', checked)}
                      />
                      <label
                        htmlFor="allTerritories"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        All Territories
                      </label>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="distribution_notes">Distribution Notes</Label>
                    <Input id="distribution_notes" placeholder="Any specific distribution instructions" value={newContract.distribution_notes || ''} onChange={handleInputChange} />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="publishing" className="py-4">
                <div className="grid gap-4">
                  <p className="text-muted-foreground mb-2">Information about publishing rights and administration.</p>
                  <div className="grid gap-2">
                    <Label htmlFor="publisher_name">Publisher Name</Label>
                    <Input id="publisher_name" placeholder="e.g., TuneFlow Publishing" value={newContract.publisher_name || ''} onChange={handleInputChange} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="pro_affiliation">PRO Affiliation</Label>
                    <Input id="pro_affiliation" placeholder="e.g., ASCAP, BMI, SESAC" value={newContract.pro_affiliation || ''} onChange={handleInputChange} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="publishing_notes">Publishing Notes</Label>
                    <Input id="publishing_notes" placeholder="Any specific publishing details" value={newContract.publishing_notes || ''} onChange={handleInputChange} />
                  </div>
                </div>
              </TabsContent>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsCreateOrEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>{isEditing ? 'Save Changes' : 'Create Contract'}</Button>
              </div>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
