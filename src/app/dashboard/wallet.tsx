import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useWallet } from "@/hooks/useWallet"
import { useDisputes, type Dispute, type WalletTransaction } from "@/hooks/useDisputes"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import {
  Wallet,
  CreditCard,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Gem,
  Loader2,
  Clock,
  Calendar,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  FileText,
  Plus,
  Shield,
  AlertCircle,
  HelpCircle
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/@/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/@/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { format } from "date-fns"

export default function WalletPage() {
  const { user } = useAuth()
  const {
    balance,
    transactions,
    loading,
    addFunds,
    withdrawFunds,
    purchaseGems,
    fetchTransactions
  } = useWallet(user?.id || '')
  
  const {
    disputes,
    disputeMessages,
    stats,
    loading: disputesLoading,
    createDispute,
    fetchDisputes,
    getDisputableTransactions
  } = useDisputes(user?.id || '')
  
  const [isAddFundsDialogOpen, setIsAddFundsDialogOpen] = useState(false)
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false)
  const [isBuyGemsDialogOpen, setIsBuyGemsDialogOpen] = useState(false)
  const [isCreateDisputeDialogOpen, setIsCreateDisputeDialogOpen] = useState(false)
  const [isDisputeDetailsDialogOpen, setIsDisputeDetailsDialogOpen] = useState(false)
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null)
  const [amount, setAmount] = useState('')
  const [gemCount, setGemCount] = useState(10)
  const [isProcessing, setIsProcessing] = useState(false)
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [disputableTransactions, setDisputableTransactions] = useState<WalletTransaction[]>([])
  const [selectedTransaction, setSelectedTransaction] = useState<string>('')
  const [disputeType, setDisputeType] = useState<Dispute['dispute_type']>('other')
  const [disputeTitle, setDisputeTitle] = useState('')
  const [disputeDescription, setDisputeDescription] = useState('')
  const [disputeAmount, setDisputeAmount] = useState('')

  useEffect(() => {
    if (user) {
      fetchTransactions(10)
      fetchDisputes()
      loadDisputableTransactions()
    }
  }, [user])

  const loadDisputableTransactions = async () => {
    const transactions = await getDisputableTransactions()
    setDisputableTransactions(transactions)
  }

  useEffect(() => {
    // Generate some demo transactions if none exist
    if (!loading && transactions.length === 0) {
      const demoTransactions = [
        {
          id: '1',
          type: 'deposit',
          amount: 100,
          description: 'Wallet deposit',
          created_at: new Date(Date.now() - 86400000 * 2).toISOString() // 2 days ago
        },
        {
          id: '2',
          type: 'gem_purchase',
          amount: -20,
          description: 'Purchased 20 gems',
          created_at: new Date(Date.now() - 86400000).toISOString() // 1 day ago
        },
        {
          id: '3',
          type: 'sale',
          amount: 49.99,
          description: 'Beat sale: Summer Vibes',
          created_at: new Date(Date.now() - 43200000).toISOString() // 12 hours ago
        }
      ]
      setRecentTransactions(demoTransactions)
    } else {
      setRecentTransactions(transactions)
    }
  }, [transactions, loading])

  const handleAddFunds = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    
    setIsProcessing(true)
    try {
      const result = await addFunds(Number(amount), 'Wallet deposit')
      
      if (result.success) {
        toast.success(`$${amount} added to your wallet`)
        setIsAddFundsDialogOpen(false)
        setAmount('')
      } else {
        toast.error(result.error || 'Failed to add funds')
      }
    } catch (error) {
      console.error('Error adding funds:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleWithdraw = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    
    if (Number(amount) > balance) {
      toast.error('Insufficient funds')
      return
    }
    
    setIsProcessing(true)
    try {
      const result = await withdrawFunds(Number(amount), 'Wallet withdrawal')
      
      if (result.success) {
        toast.success(`$${amount} withdrawn from your wallet`)
        setIsWithdrawDialogOpen(false)
        setAmount('')
      } else {
        toast.error(result.error || 'Failed to withdraw funds')
      }
    } catch (error) {
      console.error('Error withdrawing funds:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBuyGems = async () => {
    if (gemCount <= 0) {
      toast.error('Please select a valid number of gems')
      return
    }
    
    const costPerGem = 1 // $1 per gem
    const totalCost = gemCount * costPerGem
    
    if (totalCost > balance) {
      toast.error('Insufficient funds')
      return
    }
    
    setIsProcessing(true)
    try {
      const result = await purchaseGems(gemCount, costPerGem)
      
      if (result.success) {
        toast.success(`Purchased ${gemCount} gems successfully`)
        setIsBuyGemsDialogOpen(false)
        setGemCount(10)
      } else {
        toast.error(result.error || 'Failed to purchase gems')
      }
    } catch (error) {
      console.error('Error purchasing gems:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCreateDispute = async () => {
    if (!selectedTransaction) {
      toast.error('Please select a transaction to dispute')
      return
    }
    
    if (!disputeTitle.trim()) {
      toast.error('Please enter a title for your dispute')
      return
    }
    
    if (!disputeDescription.trim()) {
      toast.error('Please describe the issue')
      return
    }
    
    if (!disputeAmount || Number(disputeAmount) <= 0) {
      toast.error('Please enter a valid dispute amount')
      return
    }
    
    setIsProcessing(true)
    try {
      const result = await createDispute(
        selectedTransaction,
        disputeType,
        disputeTitle,
        disputeDescription,
        Number(disputeAmount)
      )
      
      if (result.success) {
        toast.success('Dispute created successfully')
        setIsCreateDisputeDialogOpen(false)
        setSelectedTransaction('')
        setDisputeType('other')
        setDisputeTitle('')
        setDisputeDescription('')
        setDisputeAmount('')
      } else {
        toast.error(result.error || 'Failed to create dispute')
      }
    } catch (error) {
      console.error('Error creating dispute:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleViewDisputeDetails = (dispute: Dispute) => {
    setSelectedDispute(dispute)
    setIsDisputeDetailsDialogOpen(true)
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowUpRight className="h-4 w-4 text-green-500" />
      case 'withdrawal':
        return <ArrowDownRight className="h-4 w-4 text-red-500" />
      case 'purchase':
        return <CreditCard className="h-4 w-4 text-blue-500" />
      case 'sale':
        return <DollarSign className="h-4 w-4 text-green-500" />
      case 'gem_purchase':
        return <Gem className="h-4 w-4 text-violet-500" />
      case 'refund':
        return <ArrowUpRight className="h-4 w-4 text-green-500" />
      case 'dispute_settlement':
        return <Shield className="h-4 w-4 text-orange-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getDisputeStatusBadge = (status: Dispute['status']) => {
    switch (status) {
      case 'open':
        return <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-100">Open</Badge>
      case 'under_review':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Under Review</Badge>
      case 'resolved':
        return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Resolved</Badge>
      case 'closed':
        return <Badge variant="default" className="bg-gray-100 text-gray-800 hover:bg-gray-100">Closed</Badge>
      case 'escalated':
        return <Badge variant="default" className="bg-red-100 text-red-800 hover:bg-red-100">Escalated</Badge>
      default:
        return <Badge variant="default">Unknown</Badge>
    }
  }

  const getDisputePriorityBadge = (priority: Dispute['priority']) => {
    switch (priority) {
      case 'low':
        return <Badge variant="outline" className="text-gray-600">Low</Badge>
      case 'medium':
        return <Badge variant="outline" className="text-blue-600">Medium</Badge>
      case 'high':
        return <Badge variant="outline" className="text-orange-600">High</Badge>
      case 'urgent':
        return <Badge variant="outline" className="text-red-600">Urgent</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <>
      <div className="@container/main flex flex-1 flex-col gap-6 animate-fade-in p-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Wallet</h1>
          <p className="text-muted-foreground">Manage your funds, transactions, and dispute resolutions</p>
        </div>

        {/* Wallet Overview */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1 flex flex-col">
            <CardHeader>
              <CardTitle>Wallet Balance</CardTitle>
              <CardDescription>Your current available funds</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wallet className="h-8 w-8 text-primary" />
                </div>
                <div>
                  {loading ? (
                    <div className="flex items-center">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      <span className="text-muted-foreground">Loading...</span>
                    </div>
                  ) : (
                    <div className="text-3xl font-bold">${balance.toFixed(2)}</div>
                  )}
                  <p className="text-sm text-muted-foreground">Available Balance</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="mt-auto flex justify-between">
              <Button variant="outline" onClick={() => setIsAddFundsDialogOpen(true)}>
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Add Funds
              </Button>
              <Button variant="outline" onClick={() => setIsWithdrawDialogOpen(true)}>
                <ArrowDownRight className="h-4 w-4 mr-2" />
                Withdraw
              </Button>
            </CardFooter>
          </Card>

          <Card className="md:col-span-1 flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-orange-500" />
                Dispute Resolution
              </CardTitle>
              <CardDescription>Manage transaction disputes</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-orange-500/10 flex items-center justify-center relative">
                  <Shield className="h-8 w-8 text-orange-500" />
                  {stats.open_disputes > 0 && (
                    <Badge variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 p-0 text-xs flex items-center justify-center rounded-full">
                      {stats.open_disputes}
                    </Badge>
                  )}
                </div>
                <div className="flex-1">
                  {disputesLoading ? (
                    <div className="flex items-center">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      <span className="text-muted-foreground">Loading...</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Open Disputes:</span>
                        <span className="font-medium text-lg">{stats.open_disputes}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Resolved:</span>
                        <span className="font-medium text-lg">{stats.resolved_disputes}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total:</span>
                        <span className="font-medium text-lg">{stats.total_disputes}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button
                className="w-full"
                variant="outline"
                onClick={() => setIsCreateDisputeDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Dispute
              </Button>
            </CardFooter>
          </Card>

          <Card className="md:col-span-1 flex flex-col">
            <CardHeader>
              <CardTitle>Gems</CardTitle>
              <CardDescription>Purchase gems to support creators</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-violet-500/10 flex items-center justify-center">
                  <Gem className="h-8 w-8 text-violet-500" />
                </div>
                <div>
                  <div className="text-sm">
                    Give gems to your favorite creators to show support and help them earn more.
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button className="w-full" onClick={() => setIsBuyGemsDialogOpen(true)}>
                <Gem className="h-4 w-4 mr-2" />
                Buy Gems
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Transactions and Disputes Tabs */}
        <Tabs defaultValue="transactions" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="transactions">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>Your recent wallet activity</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  View All
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : recentTransactions.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-muted-foreground">No transactions yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getTransactionIcon(transaction.type)}
                              <span className="capitalize">{transaction.type.replace('_', ' ')}</span>
                            </div>
                          </TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {format(new Date(transaction.created_at), 'MMM d, yyyy')}
                            </div>
                          </TableCell>
                          <TableCell className={`text-right font-medium ${Number(transaction.amount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {Number(transaction.amount) >= 0 ? '+' : ''}{Number(transaction.amount).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {transaction.type === 'purchase' && Number(transaction.amount) < 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedTransaction(transaction.id)
                                  setDisputeAmount(Math.abs(transaction.amount).toString())
                                  setIsCreateDisputeDialogOpen(true)
                                }}
                              >
                                <AlertTriangle className="h-4 w-4 mr-1" />
                                Dispute
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="disputes">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Dispute Cases</CardTitle>
                  <CardDescription>Manage your transaction disputes</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setIsCreateDisputeDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Dispute
                </Button>
              </CardHeader>
              <CardContent>
                {disputesLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : disputes.length === 0 ? (
                  <div className="text-center py-10">
                    <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Disputes</h3>
                    <p className="text-muted-foreground mb-4">
                      You don't have any active disputes. Create one if you need help with a transaction.
                    </p>
                    <Button onClick={() => setIsCreateDisputeDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Dispute
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Case</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {disputes.map((dispute) => (
                        <TableRow key={dispute.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-orange-500" />
                              {dispute.title}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {dispute.dispute_type.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getDisputeStatusBadge(dispute.status)}
                          </TableCell>
                          <TableCell>
                            {getDisputePriorityBadge(dispute.priority)}
                          </TableCell>
                          <TableCell className="font-medium text-red-600">
                            -${dispute.amount_disputed.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {format(new Date(dispute.created_at), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDisputeDetails(dispute)}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      {/* Add Funds Dialog */}
      <Dialog open={isAddFundsDialogOpen} onOpenChange={setIsAddFundsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Funds</DialogTitle>
            <DialogDescription>
              Add funds to your wallet to purchase items and services.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount (USD)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-8"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <Button variant="outline" onClick={() => setAmount('10')}>$10</Button>
              <Button variant="outline" onClick={() => setAmount('25')}>$25</Button>
              <Button variant="outline" onClick={() => setAmount('50')}>$50</Button>
              <Button variant="outline" onClick={() => setAmount('100')}>$100</Button>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="payment-method">Payment Method</Label>
              <div className="flex items-center gap-2 p-2 border rounded-md">
                <CreditCard className="h-4 w-4" />
                <span>Credit Card ending in 1234</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddFundsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddFunds} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Add Funds'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
            <DialogDescription>
              Withdraw funds from your wallet to your bank account.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="withdraw-amount">Amount (USD)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="withdraw-amount"
                  type="number"
                  min="1"
                  max={balance}
                  step="0.01"
                  placeholder="0.00"
                  className="pl-8"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Available balance: ${balance.toFixed(2)}
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="withdraw-method">Withdrawal Method</Label>
              <div className="flex items-center gap-2 p-2 border rounded-md">
                <CreditCard className="h-4 w-4" />
                <span>Bank Account ending in 5678</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWithdrawDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleWithdraw} disabled={isProcessing || Number(amount) > balance}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Withdraw'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Buy Gems Dialog */}
      <Dialog open={isBuyGemsDialogOpen} onOpenChange={setIsBuyGemsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buy Gems</DialogTitle>
            <DialogDescription>
              Purchase gems to support your favorite creators.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="gem-count">Number of Gems</Label>
              <Input
                id="gem-count"
                type="number"
                min="1"
                value={gemCount}
                onChange={(e) => setGemCount(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              <Button variant="outline" onClick={() => setGemCount(10)}>10</Button>
              <Button variant="outline" onClick={() => setGemCount(20)}>20</Button>
              <Button variant="outline" onClick={() => setGemCount(50)}>50</Button>
              <Button variant="outline" onClick={() => setGemCount(100)}>100</Button>
            </div>
            <div className="p-4 bg-muted rounded-md">
              <div className="flex justify-between mb-2">
                <span>Price per gem:</span>
                <span>$1.00</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total cost:</span>
                <span>${(gemCount * 1).toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Available balance: ${balance.toFixed(2)}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBuyGemsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleBuyGems} 
              disabled={isProcessing || gemCount <= 0 || gemCount * 1 > balance}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Buy Gems'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dispute Dialog */}
      <Dialog open={isCreateDisputeDialogOpen} onOpenChange={setIsCreateDisputeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Dispute</DialogTitle>
            <DialogDescription>
              File a dispute for a transaction that you believe was incorrect or unauthorized.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="transaction">Select Transaction</Label>
              <Select value={selectedTransaction} onValueChange={setSelectedTransaction}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a transaction to dispute" />
                </SelectTrigger>
                <SelectContent>
                  {disputableTransactions.map((transaction) => (
                    <SelectItem key={transaction.id} value={transaction.id}>
                      {format(new Date(transaction.created_at), 'MMM d, yyyy')} - {transaction.description} - ${Math.abs(transaction.amount).toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {disputableTransactions.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No disputable transactions found. Only completed purchases from the last 30 days can be disputed.
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dispute-type">Dispute Type</Label>
              <Select value={disputeType} onValueChange={(value: Dispute['dispute_type']) => setDisputeType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select dispute type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unauthorized_charge">Unauthorized Charge</SelectItem>
                  <SelectItem value="service_not_received">Service Not Received</SelectItem>
                  <SelectItem value="quality_issue">Quality Issue</SelectItem>
                  <SelectItem value="refund_request">Refund Request</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dispute-title">Title</Label>
              <Input
                id="dispute-title"
                placeholder="Brief description of the issue"
                value={disputeTitle}
                onChange={(e) => setDisputeTitle(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dispute-amount">Dispute Amount (USD)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="dispute-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-8"
                  value={disputeAmount}
                  onChange={(e) => setDisputeAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dispute-description">Description</Label>
              <Textarea
                id="dispute-description"
                placeholder="Please provide detailed information about why you are disputing this transaction..."
                rows={4}
                value={disputeDescription}
                onChange={(e) => setDisputeDescription(e.target.value)}
              />
            </div>

            <div className="p-4 bg-blue-50 rounded-md">
              <div className="flex items-start gap-2">
                <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium">Important Information</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Disputes are typically reviewed within 3-5 business days</li>
                    <li>You may be asked to provide additional evidence</li>
                    <li>Refunds are processed back to your original payment method</li>
                    <li>False disputes may result in account restrictions</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDisputeDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateDispute}
              disabled={isProcessing || !selectedTransaction || !disputeTitle.trim() || !disputeDescription.trim() || !disputeAmount}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Dispute'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dispute Details Dialog */}
      <Dialog open={isDisputeDetailsDialogOpen} onOpenChange={setIsDisputeDetailsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-orange-500" />
              Dispute Details
            </DialogTitle>
            <DialogDescription>
              View and manage your dispute case
            </DialogDescription>
          </DialogHeader>
          {selectedDispute && (
            <div className="grid gap-6 py-4">
              {/* Dispute Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Case Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span>{getDisputeStatusBadge(selectedDispute.status)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Priority:</span>
                      <span>{getDisputePriorityBadge(selectedDispute.priority)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="capitalize">{selectedDispute.dispute_type.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-medium text-red-600">-${selectedDispute.amount_disputed.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Timeline</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span>{format(new Date(selectedDispute.created_at), 'MMM d, yyyy HH:mm')}</span>
                    </div>
                    {selectedDispute.resolved_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Resolved:</span>
                        <span>{format(new Date(selectedDispute.resolved_at), 'MMM d, yyyy HH:mm')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Dispute Description */}
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <div className="p-4 bg-muted rounded-md">
                  <p className="text-sm">{selectedDispute.description}</p>
                </div>
              </div>

              {/* Resolution (if available) */}
              {selectedDispute.resolution && (
                <div>
                  <h3 className="font-semibold mb-2">Resolution</h3>
                  <div className="p-4 bg-green-50 rounded-md">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-800">Case Resolved</p>
                        <p className="text-sm text-green-700 mt-1">{selectedDispute.resolution}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
                {selectedDispute.status === 'open' && (
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Add Evidence
                  </Button>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDisputeDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
