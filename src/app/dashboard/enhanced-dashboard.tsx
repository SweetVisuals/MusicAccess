import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/@/ui/tabs"
import { Badge } from "@/components/@/ui/badge"
import RecentOrdersCard from "@/components/dashboard/RecentOrdersCard"
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Music, 
  PlayCircle, 
  Calendar,
  Filter,
  Loader2,
  Headphones,
  Clock,
  Gem,
  Heart,
  Share2,
  BarChart3,
  ShoppingCart,
  Briefcase,
  Mic2,
  Disc3,
  Sparkles,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock4,
  Package,
  FileText,
  MessageSquare,
  Download,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Star,
  StarHalf,
  StarOff
} from 'lucide-react'
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { RealtimeListenerCount } from "@/components/dashboard/RealtimeListenerCount"
import { useWallet } from "@/hooks/useWallet"
import { useDisputes, type Dispute as HookDispute, type WalletTransaction as HookWalletTransaction } from "@/hooks/useDisputes"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/@/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/@/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/@/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/@/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/@/ui/dropdown-menu"

interface DashboardMetrics {
  totalRevenue: number;
  totalPlays: number;
  activeServices: number;
  activeClients: number;
  totalTracks: number;
  totalFollowers: number;
  totalGems: number;
  totalLikes: number;
  totalShares: number;
  conversionRate: number;
  avgSessionDuration: number;
  revenueChange: number;
  playsChange: number;
  servicesChange: number;
  clientsChange: number;
  pendingOrders: number;
  completedOrders: number;
  disputeRate: number;
  onTimeDeliveryRate: number;
}

interface ServiceOrder {
  id: string;
  client: {
    name: string;
    avatar?: string;
    email?: string;
  };
  service: string;
  price: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'disputed';
  date: string;
  dueDate?: string;
  deliveryStatus: 'not_started' | 'in_progress' | 'delivered' | 'overdue';
  disputeReason?: string;
  disputeStatus?: 'open' | 'resolved' | 'escalated';
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  messages?: Array<{
    id: string;
    content: string;
    sender: string;
    timestamp: string;
  }>;
}

interface ServiceSale {
  id: string;
  service_id: string;
  service_title: string;
  service_type: string;
  buyer_id: string;
  buyer_name: string;
  buyer_avatar_url?: string;
  amount: number;
  status: 'active' | 'completed' | 'cancelled';
  order_date: string;
  delivery_deadline: string;
  progress: number;
  revisions_used: number;
  total_revisions: number;
  files_delivered: boolean;
}

// The Dispute interface is now imported from useDisputes hook as HookDispute
// interface Dispute {
//   id: string
//   user_id: string
//   transaction_id: string
//   dispute_type: 'unauthorized_charge' | 'service_not_received' | 'quality_issue' | 'refund_request' | 'other'
//   title: string
//   description: string
//   amount_disputed: number
//   status: 'open' | 'under_review' | 'resolved' | 'closed' | 'escalated'
//   priority: 'low' | 'medium' | 'high' | 'urgent'
//   resolution?: string
//   created_at: string
//   updated_at: string
//   resolved_at?: string
// }

export default function EnhancedDashboard() {
  const { user } = useAuth()
  const userId = user?.id || ''

  const {
    balance,
    transactions: walletTransactions,
    loading: walletLoading,
    fetchBalance,
    fetchTransactions: fetchWalletTransactions
  } = useWallet(userId)

  const {
    disputes: hookDisputes,
    stats: disputeStats,
    loading: disputesLoading,
    fetchDisputes: fetchHookDisputes,
    updateDisputeStatus
  } = useDisputes(userId)

  const [isLoading, setIsLoading] = useState(true)
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalRevenue: 0,
    totalPlays: 0,
    activeServices: 0,
    activeClients: 0,
    totalTracks: 0,
    totalFollowers: 0,
    totalGems: 0,
    totalLikes: 0,
    totalShares: 0,
    conversionRate: 0,
    avgSessionDuration: 0,
    revenueChange: 0,
    playsChange: 0,
    servicesChange: 0,
    clientsChange: 0,
    pendingOrders: 0,
    completedOrders: 0,
    disputeRate: 0,
    onTimeDeliveryRate: 0
  })
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([])
  const [serviceSales, setServiceSales] = useState<ServiceSale[]>([])
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null)
  const [selectedDispute, setSelectedDispute] = useState<HookDispute | null>(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [showDisputeDetails, setShowDisputeDetails] = useState(false)
  const [messageContent, setMessageContent] = useState('')
  const [statusUpdateLoading, setStatusUpdateLoading] = useState<string | null>(null)
  const [recentOrders, setRecentOrders] = useState<any[]>([])

  useEffect(() => {
    if (userId) {
      fetchHookDisputes() // Fetch disputes first so stats are available
      fetchDashboardData()
      fetchBalance()
      fetchWalletTransactions()
    }
  }, [userId, timeRange, fetchBalance, fetchWalletTransactions, fetchHookDisputes])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      await Promise.all([
        fetchMetrics(),
        fetchServiceOrders(),
        fetchServiceSales(),
        fetchRecentOrders()
      ])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMetrics = async () => {
    try {
      // Fetch revenue data from orders where services belong to current user
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'completed')

      if (ordersError) throw ordersError

      // Calculate revenue from services sold by current user
      let totalRevenue = 0
      let pendingOrders = 0
      let completedOrders = 0

      for (const order of ordersData || []) {
        if (order.status === 'pending') pendingOrders++
        if (order.status === 'completed') completedOrders++

        // Check if any items in this order belong to current user's services
        if (order.items && Array.isArray(order.items)) {
          for (const item of order.items) {
            if (item.service_id) {
              // Check if this service belongs to current user
              const { data: serviceData } = await supabase
                .from('services')
                .select('user_id')
                .eq('id', item.service_id)
                .single()

              if (serviceData?.user_id === userId) {
                totalRevenue += order.total || 0
                break // Count the order once if any item belongs to user
              }
            }
          }
        }
      }
      
      // Fetch active services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('is_active', true)

      if (servicesError) throw servicesError

      const activeServices = servicesData?.length || 0

      // Fetch user stats
      const { data: statsData, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (statsError && statsError.code !== 'PGRST116') throw statsError

      // Calculate on-time delivery rate from completed orders with due dates
      let onTimeDeliveries = 0
      let totalDeliveriesWithDueDate = 0

      for (const order of ordersData || []) {
        if (order.status === 'completed' && order.due_date) {
          totalDeliveriesWithDueDate++
          // Check if order was completed on or before due date
          const dueDate = new Date(order.due_date)
          const completedDate = order.completed_at ? new Date(order.completed_at) : new Date(order.order_date)
          if (completedDate <= dueDate) {
            onTimeDeliveries++
          }
        }
      }

      const onTimeDeliveryRate = totalDeliveriesWithDueDate > 0 ? (onTimeDeliveries / totalDeliveriesWithDueDate) * 100 : 0

      setMetrics({
        totalRevenue,
        activeServices,
        totalPlays: statsData?.total_plays || 0,
        activeClients: statsData?.active_clients || 0,
        totalTracks: statsData?.total_tracks || 0,
        totalFollowers: statsData?.total_followers || 0,
        totalGems: statsData?.total_gems || 0,
        totalLikes: statsData?.total_likes || 0,
        totalShares: statsData?.total_shares || 0,
        conversionRate: statsData?.conversion_rate || 0,
        avgSessionDuration: statsData?.avg_session_duration || 0,
        revenueChange: 0, // Placeholder
        playsChange: 0, // Placeholder
        servicesChange: 0, // Placeholder
        clientsChange: 0, // Placeholder
        pendingOrders,
        completedOrders,
        disputeRate: disputeStats.total_disputes > 0 ? (disputeStats.open_disputes / disputeStats.total_disputes) * 100 : 0,
        onTimeDeliveryRate
      })
    } catch (error) {
      console.error('Error fetching metrics:', error)
    }
  }

  const fetchServiceOrders = async () => {
    try {
      // First, get all service IDs that belong to the current user
      const { data: userServices, error: servicesError } = await supabase
        .from('services')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)

      if (servicesError) throw servicesError

      if (!userServices || userServices.length === 0) {
        // User has no services, so no orders for their services
        setServiceOrders([])
        return
      }

      const serviceIds = userServices.map(service => service.id)

      // Fetch orders that contain these service IDs in items, but exclude orders placed by current user
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .neq('user_id', userId) // Exclude orders placed by current user
        .order('order_date', { ascending: false })
        .limit(50)

      if (error) throw error

      // Filter orders to only include those that contain user's services
      const filteredOrders = (data || []).filter(order => {
        if (!order.items || !Array.isArray(order.items)) return false

        return order.items.some((item: any) =>
          item.service_id && serviceIds.includes(item.service_id)
        )
      })

      const orders = filteredOrders.slice(0, 10).map(order => ({
        id: order.id,
        client: {
          name: order.customer_name || 'Anonymous',
          avatar: order.customer_avatar,
          email: order.customer_email
        },
        service: order.title || 'Unknown Service',
        price: order.total || 0,
        status: order.status || 'pending',
        date: new Date(order.order_date).toISOString().split('T')[0],
        dueDate: order.due_date ? new Date(order.due_date).toISOString().split('T')[0] : undefined,
        deliveryStatus: getDeliveryStatus(order),
        disputeReason: order.dispute_reason,
        disputeStatus: order.dispute_status,
        attachments: order.attachments || [],
        messages: order.messages || []
      }))

      setServiceOrders(orders)
    } catch (error) {
      console.error('Error fetching service orders:', error)
    }
  }

  const fetchServiceSales = async () => {
    try {
      // Fetch actual service sales from orders where services belong to current user
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'completed')
        .order('order_date', { ascending: false })
        .limit(20)

      if (ordersError) throw ordersError

      const serviceSales: ServiceSale[] = []

      for (const order of ordersData || []) {
        if (order.items && Array.isArray(order.items)) {
          for (const item of order.items) {
            if (item.service_id) {
              // Check if this service belongs to current user
              const { data: serviceData } = await supabase
                .from('services')
                .select('*')
                .eq('id', item.service_id)
                .eq('user_id', userId)
                .single()

              if (serviceData) {
                // Get buyer info
                const { data: buyerData } = await supabase
                  .from('profiles')
                  .select('username, avatar_url')
                  .eq('id', order.user_id)
                  .single()

                serviceSales.push({
                  id: order.id + '-' + item.service_id, // Unique ID combining order and service
                  service_id: serviceData.id,
                  service_title: serviceData.title,
                  service_type: serviceData.type,
                  buyer_id: order.user_id,
                  buyer_name: buyerData?.username || order.customer_name || 'Anonymous',
                  buyer_avatar_url: buyerData?.avatar_url,
                  amount: item.price || serviceData.price || 0,
                  status: order.status === 'completed' ? 'completed' : 'active',
                  order_date: order.order_date,
                  delivery_deadline: order.due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                  progress: 100, // Assume completed orders are 100% done
                  revisions_used: item.revisions_used || 0,
                  total_revisions: serviceData.revisions || 3,
                  files_delivered: order.status === 'completed'
                })
              }
            }
          }
        }
      }

      setServiceSales(serviceSales.slice(0, 10)) // Limit to 10 most recent
    } catch (error) {
      console.error('Error fetching service sales:', error)
    }
  }

  const fetchRecentOrders = async () => {
    try {
      // Fetch recent orders for the current user
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*')
        .order('order_date', { ascending: false })
        .limit(10)

      if (error) throw error

      // Transform the data to match the RecentOrdersCard interface
      const recentOrders = (ordersData || []).map(order => {
        // Map database items to component expected format
        const mappedItems = (order.items || []).map((item: any) => ({
          name: item.title || 'Untitled Item',
          quantity: 1,
          price: item.price || 0,
          type: item.type === 'track' ? 'track_group' :
                item.type === 'project' ? 'project' :
                item.type === 'file' ? 'file' : 'soundpack'
        }))

        return {
          id: order.id,
          date: order.order_date,
          status: order.status as 'completed' | 'pending' | 'failed' | 'processing' | 'unconfirmed',
          total: order.total || 0,
          items: mappedItems,
          processingFee: order.processing_fee || 0,
          tax: order.tax || 0,
          customer_name: order.customer_name || 'Anonymous',
          customer_avatar: order.customer_avatar,
          customer_email: order.customer_email,
          due_date: order.due_date,
          delivery_status: getDeliveryStatus(order)
        }
      })

      setRecentOrders(recentOrders)
    } catch (error) {
      console.error('Error fetching recent orders:', error)
    }
  }

  // No longer need a separate fetchDisputes function here, as it's handled by the hook
  // The hookDisputes state will be used directly

  const getDeliveryStatus = (order: any): 'not_started' | 'in_progress' | 'delivered' | 'overdue' => {
    if (order.status === 'completed') return 'delivered'
    if (order.status === 'failed') return 'overdue'
    if (order.due_date && new Date(order.due_date) < new Date()) return 'overdue'
    if (order.status === 'processing') return 'in_progress'
    return 'not_started'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-500">Completed</Badge>
      case 'processing':
        return <Badge className="bg-blue-500/10 text-blue-500">Processing</Badge>
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-500">Pending</Badge>
      case 'failed':
        return <Badge className="bg-red-500/10 text-red-500">Failed</Badge>
      case 'disputed':
        return <Badge className="bg-orange-500/10 text-orange-500">Disputed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getDeliveryBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge className="bg-green-500/10 text-green-500"><CheckCircle className="h-3 w-3 mr-1" />Delivered</Badge>
      case 'in_progress':
        return <Badge className="bg-blue-500/10 text-blue-500"><Clock4 className="h-3 w-3 mr-1" />In Progress</Badge>
      case 'overdue':
        return <Badge className="bg-red-500/10 text-red-500"><AlertTriangle className="h-3 w-3 mr-1" />Overdue</Badge>
      case 'not_started':
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Not Started</Badge>
    }
  }

  const getDisputePriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <Badge className="bg-red-500/10 text-red-500">Critical</Badge>
      case 'high':
        return <Badge className="bg-orange-500/10 text-orange-500">High</Badge>
      case 'medium':
        return <Badge className="bg-yellow-500/10 text-yellow-500">Medium</Badge>
      case 'low':
        return <Badge className="bg-blue-500/10 text-blue-500">Low</Badge>
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }

  const getDisputeStatusBadge = (status: HookDispute['status']) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-yellow-500/10 text-yellow-500">Open</Badge>
      case 'under_review':
        return <Badge className="bg-blue-500/10 text-blue-500">Under Review</Badge>
      case 'resolved':
        return <Badge className="bg-green-500/10 text-green-500">Resolved</Badge>
      case 'closed':
        return <Badge className="bg-gray-500/10 text-gray-500">Closed</Badge>
      case 'escalated':
        return <Badge className="bg-red-500/10 text-red-500">Escalated</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    setStatusUpdateLoading(orderId)
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (error) throw error

      toast.success(`Order status updated to ${newStatus}`)
      fetchServiceOrders() // Refresh data
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Failed to update order status')
    } finally {
      setStatusUpdateLoading(null)
    }
  }

  const handleResolveDispute = async (disputeId: string) => {
    try {
      const result = await updateDisputeStatus(disputeId, 'resolved', messageContent)
      if (result.success) {
        toast.success('Dispute marked as resolved')
        fetchHookDisputes() // Refresh data
        setShowDisputeDetails(false)
        setMessageContent('')
      } else {
        toast.error(result.error || 'Failed to resolve dispute')
      }
    } catch (error) {
      console.error('Error resolving dispute:', error)
      toast.error('An unexpected error occurred while resolving dispute')
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-4 animate-fade-in p-6">
        {/* Header with Time Range Selector */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Enhanced Dashboard</h1>
            <p className="text-muted-foreground">Manage orders, disputes, and track service deliveries</p>
          </div>
          <div className="flex items-center gap-2">
            <RealtimeListenerCount />
            <Select value={timeRange} onValueChange={(value: '7d' | '30d' | '90d') => setTimeRange(value)}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {/* Revenue */}
          <Card className="col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-9 flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-muted-foreground">Loading...</span>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    {metrics.revenueChange >= 0 ? (
                      <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                    )}
                    {metrics.revenueChange >= 0 ? '+' : ''}{metrics.revenueChange.toFixed(1)}% from last period
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Active Orders */}
          <Card className="col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-9 flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-muted-foreground">Loading...</span>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{metrics.pendingOrders}</div>
                  <p className="text-xs text-muted-foreground">
                    {metrics.completedOrders} completed this month
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Dispute Rate */}
          <Card className="col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dispute Rate</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-9 flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-muted-foreground">Loading...</span>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{metrics.disputeRate.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">
                    {disputeStats.open_disputes} active disputes
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* On-Time Delivery */}
          <Card className="col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On-Time Delivery</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-9 flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-muted-foreground">Loading...</span>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{metrics.onTimeDeliveryRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    Delivery performance
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Order Performance */}
          <Card className="col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Order Performance</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Completion Rate</span>
                  <span className="font-semibold text-green-600">94%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Average Delivery Time</span>
                  <span className="font-semibold">3.2 days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Customer Satisfaction</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-4 w-4 text-yellow-500 fill-current" />
                    ))}
                    <span className="text-sm ml-1">4.8</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Metrics */}
          <Card className="col-span-2 md:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Services</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{metrics.activeServices}</div>
            </CardContent>
          </Card>

          <Card className="col-span-2 md:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{metrics.activeClients}</div>
            </CardContent>
          </Card>

          <Card className="col-span-2 md:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Plays</CardTitle>
              <PlayCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{formatNumber(metrics.totalPlays)}</div>
            </CardContent>
          </Card>

          <Card className="col-span-2 md:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Gems</CardTitle>
              <Gem className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{formatNumber(metrics.totalGems)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <div className="mt-4">
          {/* Recent Orders Card */}
          <div className="mb-6">
            <RecentOrdersCard
              orders={recentOrders}
              isLoading={isLoading}
              onViewOrder={(order) => {
                // Convert RecentOrder to ServiceOrder for the dialog
                const serviceOrder: ServiceOrder = {
                  id: order.id,
                  client: {
                    name: order.customer_name,
                    avatar: order.customer_avatar,
                    email: order.customer_email
                  },
                  service: order.items.length > 0 ? order.items[0].name : 'Multiple Items',
                  price: order.total,
                  status: order.status as 'pending' | 'processing' | 'completed' | 'failed' | 'disputed',
                  date: order.date,
                  dueDate: order.due_date,
                  deliveryStatus: order.delivery_status,
                  disputeReason: undefined,
                  disputeStatus: undefined,
                  attachments: [],
                  messages: []
                }
                setSelectedOrder(serviceOrder)
                setShowOrderDetails(true)
              }}
              onDownloadOrder={(order) => {
                // Handle download order files
                toast.success(`Downloading files for order ${order.id}`)
              }}
            />
          </div>
          <Tabs defaultValue="orders">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="orders" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Service Orders
              </TabsTrigger>
              <TabsTrigger value="services" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Services Sold
              </TabsTrigger>
              <TabsTrigger value="disputes" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Disputes
                {disputeStats.open_disputes > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center">
                    {disputeStats.open_disputes}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>
            
            {/* Orders Tab - Two Column Layout */}
            <TabsContent value="orders" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Service Orders Table */}
                <Card className="lg:col-span-1">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Service Orders</CardTitle>
                      <CardDescription>Manage incoming service requests and track deliveries</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Filter className="h-4 w-4" />
                      Filter
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="h-[200px] flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Client</TableHead>
                              <TableHead>Service</TableHead>
                              <TableHead>Price</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Delivery</TableHead>
                              <TableHead>Due Date</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {serviceOrders.map((order) => (
                              <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50" onClick={() => {
                                setSelectedOrder(order)
                                setShowOrderDetails(true)
                              }}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={order.client.avatar} />
                                      <AvatarFallback>{order.client.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <span className="font-medium">{order.client.name}</span>
                                      {order.client.email && (
                                        <p className="text-xs text-muted-foreground">{order.client.email}</p>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>{order.service}</TableCell>
                                <TableCell>${order.price.toFixed(2)}</TableCell>
                                <TableCell>{getStatusBadge(order.status)}</TableCell>
                                <TableCell>{getDeliveryBadge(order.deliveryStatus)}</TableCell>
                                <TableCell>
                                  {order.dueDate ? (
                                    <div className="flex flex-col">
                                      <span>{new Date(order.dueDate).toLocaleDateString()}</span>
                                      {order.dueDate && (
                                        <span className={`text-xs ${
                                          getDaysUntilDue(order.dueDate) < 0
                                            ? 'text-red-500'
                                            : getDaysUntilDue(order.dueDate) <= 3
                                              ? 'text-yellow-500'
                                              : 'text-green-500'
                                        }`}>
                                          {getDaysUntilDue(order.dueDate) < 0
                                            ? `${Math.abs(getDaysUntilDue(order.dueDate))} days overdue`
                                            : `${getDaysUntilDue(order.dueDate)} days left`
                                          }
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">No due date</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => {
                                        setSelectedOrder(order)
                                        setShowOrderDetails(true)
                                      }}>
                                        <Eye className="h-4 w-4 mr-2" />
                                        View Details
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                        Message Client
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        <Download className="h-4 w-4 mr-2" />
                                        Download Files
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="text-sm text-muted-foreground">
                      Showing {serviceOrders.length} of {serviceOrders.length} orders
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                      <ArrowUpRight className="h-4 w-4" />
                      View All Orders
                    </Button>
                  </CardFooter>
                </Card>

                {/* Order Statistics Card */}
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle>Order Statistics</CardTitle>
                    <CardDescription>Overview of your order performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Total Orders</span>
                        <span className="font-semibold">{serviceOrders.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Pending Orders</span>
                        <span className="font-semibold text-yellow-600">
                          {serviceOrders.filter(order => order.status === 'pending').length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Processing Orders</span>
                        <span className="font-semibold text-blue-600">
                          {serviceOrders.filter(order => order.status === 'processing').length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Completed Orders</span>
                        <span className="font-semibold text-green-600">
                          {serviceOrders.filter(order => order.status === 'completed').length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Disputed Orders</span>
                        <span className="font-semibold text-orange-600">
                          {serviceOrders.filter(order => order.status === 'disputed').length}
                        </span>
                      </div>
                      <div className="pt-4 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">On-Time Delivery Rate</span>
                          <span className="font-semibold text-green-600">{metrics.onTimeDeliveryRate}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${metrics.onTimeDeliveryRate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Services Sold Tab */}
            <TabsContent value="services" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Services Sold</CardTitle>
                    <CardDescription>Track your active service deliveries and progress</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filter
                  </Button>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-[200px] flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {serviceSales.map((sale) => (
                        <Card key={sale.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={sale.buyer_avatar_url} />
                                <AvatarFallback>{sale.buyer_name[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="font-semibold">{sale.service_title}</h4>
                                <p className="text-sm text-muted-foreground">{sale.buyer_name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant={sale.status === 'active' ? 'default' : sale.status === 'completed' ? 'secondary' : 'destructive'}>
                                    {sale.status}
                                  </Badge>
                                  <span className="text-sm font-medium">${sale.amount.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm text-muted-foreground">Due:</span>
                                <span className={`text-sm font-medium ${
                                  getDaysUntilDue(sale.delivery_deadline) < 0
                                    ? 'text-red-500'
                                    : getDaysUntilDue(sale.delivery_deadline) <= 3
                                      ? 'text-yellow-500'
                                      : 'text-green-500'
                                }`}>
                                  {new Date(sale.delivery_deadline).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-24 bg-muted rounded-full h-2">
                                  <div
                                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${sale.progress}%` }}
                                  />
                                </div>
                                <span className="text-sm text-muted-foreground">{sale.progress}%</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-muted-foreground">Revisions:</span>
                                <span className="text-sm font-medium">{sale.revisions_used}/{sale.total_revisions}</span>
                              </div>
                            </div>
                          </div>
                          {sale.files_delivered && (
                            <div className="flex items-center gap-2 mt-3 p-2 bg-green-50 dark:bg-green-950/20 rounded-md">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-green-600">Files delivered</span>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {serviceSales.length} active services
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <ArrowUpRight className="h-4 w-4" />
                    View All Services
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Disputes Tab */}
            <TabsContent value="disputes" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Active Disputes</CardTitle>
                    <CardDescription>Manage and resolve customer disputes</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Disputes</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_review">In Review</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Filter className="h-4 w-4" />
                      Filter
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-[200px] flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : hookDisputes.length === 0 ? (
                    <div className="h-[200px] flex flex-col items-center justify-center text-center">
                      <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Active Disputes</h3>
                      <p className="text-muted-foreground">All customer issues are currently resolved.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {hookDisputes.map((dispute) => (
                        <Card key={dispute.id} className="p-4 cursor-pointer hover:bg-muted/50" onClick={() => {
                          setSelectedDispute(dispute)
                          setShowDisputeDetails(true)
                        }}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={undefined} /> {/* No client avatar in hookDispute */}
                                <AvatarFallback>{dispute.title[0]}</AvatarFallback> {/* Use title for fallback */}
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold">{dispute.title}</h4>
                                  {getDisputePriorityBadge(dispute.priority)}
                                  {getDisputeStatusBadge(dispute.status)}
                                </div>
                                <p className="text-sm text-muted-foreground">{dispute.dispute_type.replace('_', ' ')}</p>
                                <p className="text-sm mt-1">{dispute.description}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">
                                {new Date(dispute.created_at).toLocaleDateString()}
                              </div>
                              {/* Dispute messages count is not directly available in hookDispute, can be fetched separately if needed */}
                              {/* <div className="flex items-center gap-1 mt-1">
                                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">{dispute.messagesCount} messages</span>
                              </div> */}
                              <div className="text-xs text-muted-foreground mt-1">
                                Last updated: {new Date(dispute.updated_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="text-sm text-muted-foreground">
                    {disputeStats.open_disputes} open disputes
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <ArrowUpRight className="h-4 w-4" />
                    View All Disputes
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Service Performance</CardTitle>
                  <CardDescription>Your most popular services and revenue</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { service: 'Mixing & Mastering', revenue: 2450, orders: 12 },
                      { service: 'Beat Production', revenue: 1800, orders: 8 },
                      { service: 'Vocal Recording', revenue: 1200, orders: 6 },
                      { service: 'Sound Design', revenue: 800, orders: 4 }
                    ].map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm">{item.service}</span>
                        <div className="text-right">
                          <div className="font-medium">${item.revenue}</div>
                          <div className="text-xs text-muted-foreground">{item.orders} orders</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Manage order status and communicate with the client
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Client Information</h4>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedOrder.client.avatar} />
                      <AvatarFallback>{selectedOrder.client.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedOrder.client.name}</p>
                      {selectedOrder.client.email && (
                        <p className="text-sm text-muted-foreground">{selectedOrder.client.email}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Order Information</h4>
                  <p className="text-sm">Service: {selectedOrder.service}</p>
                  <p className="text-sm">Amount: ${selectedOrder.price.toFixed(2)}</p>
                  <p className="text-sm">Order Date: {new Date(selectedOrder.date).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Status</h4>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <div>
                  <h4 className="font-medium mb-2">Delivery</h4>
                  {getDeliveryBadge(selectedOrder.deliveryStatus)}
                </div>
              </div>

              {selectedOrder.dueDate && (
                <div>
                  <h4 className="font-medium mb-2">Due Date</h4>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(selectedOrder.dueDate).toLocaleDateString()}</span>
                    <Badge variant={
                      getDaysUntilDue(selectedOrder.dueDate) < 0 
                        ? 'destructive' 
                        : getDaysUntilDue(selectedOrder.dueDate) <= 3 
                          ? 'secondary' 
                          : 'default'
                    }>
                      {getDaysUntilDue(selectedOrder.dueDate) < 0 
                        ? `${Math.abs(getDaysUntilDue(selectedOrder.dueDate))} days overdue`
                        : `${getDaysUntilDue(selectedOrder.dueDate)} days left`
                      }
                    </Badge>
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Update Status</h4>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant={selectedOrder.status === "pending" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, "pending")}
                    disabled={statusUpdateLoading === selectedOrder.id || selectedOrder.status === "pending"}
                  >
                    {statusUpdateLoading === selectedOrder.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Clock className="h-4 w-4 mr-2" />
                    )}
                    Pending
                  </Button>
                  <Button 
                    variant={selectedOrder.status === "processing" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, "processing")}
                    disabled={statusUpdateLoading === selectedOrder.id || selectedOrder.status === "processing"}
                  >
                    {statusUpdateLoading === selectedOrder.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Loader2 className="h-4 w-4 mr-2" />
                    )}
                    Processing
                  </Button>
                  <Button 
                    variant={selectedOrder.status === "completed" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, "completed")}
                    disabled={statusUpdateLoading === selectedOrder.id || selectedOrder.status === "completed"}
                  >
                    {statusUpdateLoading === selectedOrder.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Completed
                  </Button>
                  <Button 
                    variant={selectedOrder.status === "disputed" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, "disputed")}
                    disabled={statusUpdateLoading === selectedOrder.id || selectedOrder.status === "disputed"}
                  >
                    {statusUpdateLoading === selectedOrder.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 mr-2" />
                    )}
                    Disputed
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Message Client
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Invoice
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dispute Details Dialog */}
      <Dialog open={showDisputeDetails} onOpenChange={setShowDisputeDetails}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Dispute Details</DialogTitle>
            <DialogDescription>
              Review and resolve customer disputes
            </DialogDescription>
          </DialogHeader>
          {selectedDispute && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Dispute ID</h4>
                  <p>{selectedDispute.id}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Transaction ID</h4>
                  <p>{selectedDispute.transaction_id}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Dispute Title</h4>
                <p className="text-sm bg-muted p-3 rounded-md">{selectedDispute.title}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Dispute Description</h4>
                <p className="text-sm bg-muted p-3 rounded-md">{selectedDispute.description}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Dispute Type</h4>
                <p className="text-sm bg-muted p-3 rounded-md capitalize">{selectedDispute.dispute_type.replace('_', ' ')}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Amount Disputed</h4>
                <p className="text-sm bg-muted p-3 rounded-md">${selectedDispute.amount_disputed.toFixed(2)}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Priority</h4>
                  {getDisputePriorityBadge(selectedDispute.priority)}
                </div>
                <div>
                  <h4 className="font-medium mb-2">Status</h4>
                  {getDisputeStatusBadge(selectedDispute.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Created At</h4>
                  <p className="text-sm">{new Date(selectedDispute.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Updated At</h4>
                  <p className="text-sm">{new Date(selectedDispute.updated_at).toLocaleDateString()}</p>
                </div>
              </div>
              {selectedDispute.resolved_at && (
                <div>
                  <h4 className="font-medium mb-2">Resolved At</h4>
                  <p className="text-sm">{new Date(selectedDispute.resolved_at).toLocaleDateString()}</p>
                </div>
              )}
              {selectedDispute.resolution && (
                <div>
                  <h4 className="font-medium mb-2">Resolution</h4>
                  <p className="text-sm bg-green-50 dark:bg-green-950/20 p-3 rounded-md">{selectedDispute.resolution}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Resolution</h4>
                <textarea
                  placeholder="Add your response or resolution notes..."
                  value={messageContent}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessageContent(e.target.value)}
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDisputeDetails(false)}>
                  Cancel
                </Button>
                <Button onClick={() => handleResolveDispute(selectedDispute.id)}>
                  Mark as Resolved
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}