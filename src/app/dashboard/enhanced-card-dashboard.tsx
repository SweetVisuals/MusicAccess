import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/@/ui/badge"
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
  StarOff,
  CreditCard,
  BarChart,
  PieChart,
  Target,
  Zap,
  CalendarDays,
  Clock3,
  UserCheck,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  X,
  Circle,
  Play,
  Pause,
  StopCircle,
  Plus,
  Settings,
  Target as TargetIcon,
  Zap as ZapIcon,
  CalendarDays as CalendarDaysIcon,
  Clock3 as Clock3Icon,
  UserCheck as UserCheckIcon,
  FileCheck as FileCheckIcon
} from 'lucide-react'
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { RealtimeListenerCount } from "@/components/dashboard/RealtimeListenerCount"
import { DashboardStatsCard } from "@/components/dashboard/DashboardStatsCard"
import { AnalyticsCard } from "@/components/dashboard/AnalyticsCard"
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
import { Progress } from "@/components/@/ui/progress"
import { useWallet } from "@/hooks/useWallet"
import { useDisputes, type Dispute as HookDispute } from "@/hooks/useDisputes"

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
  activeProjects: number;
  completedProjects: number;
  averageRating: number;
  responseTime: number;
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

interface Project {
  id: string;
  title: string;
  status: 'draft' | 'in_progress' | 'review' | 'completed' | 'archived';
  progress: number;
  client: string;
  deadline: string;
  revenue: number;
  type: 'mixing' | 'mastering' | 'production' | 'recording';
}

export default function EnhancedCardDashboard() {
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
    onTimeDeliveryRate: 0,
    activeProjects: 0,
    completedProjects: 0,
    averageRating: 4.8,
    responseTime: 2.5
  })
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([])
  const [serviceSales, setServiceSales] = useState<ServiceSale[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null)
  const [selectedDispute, setSelectedDispute] = useState<HookDispute | null>(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [showDisputeDetails, setShowDisputeDetails] = useState(false)
  const [messageContent, setMessageContent] = useState('')
  const [statusUpdateLoading, setStatusUpdateLoading] = useState<string | null>(null)

  // Mock data for charts
  const revenueData = [
    { name: 'Jan', revenue: 4000 },
    { name: 'Feb', revenue: 3000 },
    { name: 'Mar', revenue: 2000 },
    { name: 'Apr', revenue: 2780 },
    { name: 'May', revenue: 1890 },
    { name: 'Jun', revenue: 2390 },
  ]

  const serviceTypeData = [
    { name: 'Mixing', value: 35 },
    { name: 'Mastering', value: 25 },
    { name: 'Production', value: 20 },
    { name: 'Recording', value: 20 },
  ]

  const performanceData = [
    { name: 'Week 1', performance: 85 },
    { name: 'Week 2', performance: 92 },
    { name: 'Week 3', performance: 78 },
    { name: 'Week 4', performance: 95 },
  ]

  useEffect(() => {
    if (userId) {
      fetchHookDisputes()
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
        fetchProjects()
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
        revenueChange: 12.5, // Mock data
        playsChange: 8.2, // Mock data
        servicesChange: 5.7, // Mock data
        clientsChange: 3.4, // Mock data
        pendingOrders,
        completedOrders,
        disputeRate: disputeStats.total_disputes > 0 ? (disputeStats.open_disputes / disputeStats.total_disputes) * 100 : 0,
        onTimeDeliveryRate,
        activeProjects: 8, // Mock data
        completedProjects: 24, // Mock data
        averageRating: 4.8, // Mock data
        responseTime: 2.5 // Mock data
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

  const fetchProjects = async () => {
    try {
      // Mock projects data - in a real app, this would come from a projects table
      const mockProjects: Project[] = [
        {
          id: '1',
          title: 'Album Mixing - Summer Vibes',
          status: 'in_progress',
          progress: 75,
          client: 'John Smith',
          deadline: '2024-02-15',
          revenue: 1200,
          type: 'mixing'
        },
        {
          id: '2',
          title: 'Single Mastering - Urban Beat',
          status: 'review',
          progress: 90,
          client: 'Sarah Johnson',
          deadline: '2024-02-10',
          revenue: 350,
          type: 'mastering'
        },
        {
          id: '3',
          title: 'EP Production - Dreamscape',
          status: 'draft',
          progress: 25,
          client: 'Mike Davis',
          deadline: '2024-03-01',
          revenue: 2500,
          type: 'production'
        },
        {
          id: '4',
          title: 'Vocal Recording Session',
          status: 'completed',
          progress: 100,
          client: 'Alex Turner',
          deadline: '2024-01-20',
          revenue: 800,
          type: 'recording'
        }
      ]

      setProjects(mockProjects)
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

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

  const getProjectStatusBadge = (status: Project['status']) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>
      case 'in_progress':
        return <Badge className="bg-blue-500/10 text-blue-500">In Progress</Badge>
      case 'review':
        return <Badge className="bg-yellow-500/10 text-yellow-500">Review</Badge>
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-500">Completed</Badge>
      case 'archived':
        return <Badge variant="secondary">Archived</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getProjectTypeIcon = (type: Project['type']) => {
    switch (type) {
      case 'mixing':
        return <Headphones className="h-4 w-4" />
      case 'mastering':
        return <Disc3 className="h-4 w-4" />
      case 'production':
        return <Music className="h-4 w-4" />
      case 'recording':
        return <Mic2 className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
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

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return 'bg-green-500'
    if (progress >= 70) return 'bg-blue-500'
    if (progress >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-6 animate-fade-in p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's your business overview</p>
          </div>
          <div className="flex items-center gap-4">
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

        {/* Enhanced Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DashboardStatsCard
            title="Total Revenue"
            value={formatCurrency(metrics.totalRevenue)}
            description="vs last period"
            icon={DollarSign}
            trend={{ value: metrics.revenueChange, isPositive: true }}
          />
          <DashboardStatsCard
            title="Active Orders"
            value={metrics.pendingOrders}
            description={`${metrics.completedOrders} completed`}
            icon={ShoppingCart}
          />
          <DashboardStatsCard
            title="Performance"
            value={`${metrics.onTimeDeliveryRate}%`}
            description="On-time delivery"
            icon={TargetIcon}
          />
          <DashboardStatsCard
            title="Disputes"
            value={disputeStats.open_disputes}
            description={`${disputeStats.total_disputes} total`}
            icon={AlertTriangle}
          />
        </div>

        {/* Additional Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <DashboardStatsCard
            title="Active Clients"
            value={metrics.activeClients}
            description="Total clients"
            icon={Users}
            className="col-span-1"
          />
          <DashboardStatsCard
            title="Services"
            value={metrics.activeServices}
            description="Active services"
            icon={Briefcase}
            className="col-span-1"
          />
          <DashboardStatsCard
            title="Total Plays"
            value={formatNumber(metrics.totalPlays)}
            description="Track plays"
            icon={PlayCircle}
            className="col-span-1"
          />
          <DashboardStatsCard
            title="Gems Balance"
            value={formatNumber(metrics.totalGems)}
            description="Available gems"
            icon={Gem}
            className="col-span-1"
          />
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnalyticsCard
            title="Revenue Trend"
            description="Monthly revenue performance"
            data={revenueData}
            type="line"
            dataKey="revenue"
          />
          <AnalyticsCard
            title="Service Distribution"
            description="Breakdown by service type"
            data={serviceTypeData}
            type="pie"
            dataKey="value"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Orders & Projects */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Orders Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Manage incoming service requests</CardDescription>
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
                ) : serviceOrders.length === 0 ? (
                  <div className="h-[200px] flex flex-col items-center justify-center text-center">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Orders Yet</h3>
                    <p className="text-muted-foreground">Your service orders will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {serviceOrders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => {
                        setSelectedOrder(order)
                        setShowOrderDetails(true)
                      }}>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={order.client.avatar} />
                            <AvatarFallback>{order.client.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{order.client.name}</div>
                            <div className="text-sm text-muted-foreground">{order.service}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">${order.price.toFixed(2)}</div>
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusBadge(order.status)}
                            {getDeliveryBadge(order.deliveryStatus)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full gap-2">
                  <ArrowUpRight className="h-4 w-4" />
                  View All Orders
                </Button>
              </CardFooter>
            </Card>

            {/* Active Projects Card */}
            <Card>
              <CardHeader>
                <CardTitle>Active Projects</CardTitle>
                <CardDescription>Your current projects and their progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                          {getProjectTypeIcon(project.type)}
                        </div>
                        <div>
                          <div className="font-medium">{project.title}</div>
                          <div className="text-sm text-muted-foreground">{project.client}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(project.revenue)}</div>
                        <div className="flex items-center gap-2 mt-1">
                          {getProjectStatusBadge(project.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Create New Project
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Right Column - Stats & Quick Actions */}
          <div className="space-y-6">
            {/* Performance Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Stats</CardTitle>
                <CardDescription>Your business metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Active Clients</span>
                  </div>
                  <span className="font-semibold">{metrics.activeClients}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Active Services</span>
                  </div>
                  <span className="font-semibold">{metrics.activeServices}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <PlayCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Total Plays</span>
                  </div>
                  <span className="font-semibold">{formatNumber(metrics.totalPlays)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Gem className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Gems Balance</span>
                  </div>
                  <span className="font-semibold">{formatNumber(metrics.totalGems)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start gap-2">
                  <Plus className="h-4 w-4" />
                  Create New Service
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <FileText className="h-4 w-4" />
                  Generate Invoice
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <BarChart className="h-4 w-4" />
                  View Analytics
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity Card */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates and notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <div className="flex-1">
                    <p className="text-sm">New order received from John Smith</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <div className="flex-1">
                    <p className="text-sm">Project "Summer Vibes" completed</p>
                    <p className="text-xs text-muted-foreground">1 day ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                  <div className="flex-1">
                    <p className="text-sm">New review received (5 stars)</p>
                    <p className="text-xs text-muted-foreground">2 days ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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

              {selectedOrder.dueDate && (() => {
                const daysUntilDue = getDaysUntilDue(selectedOrder.dueDate);
                let badgeVariant: "destructive" | "secondary" | "default" = "default";
                if (daysUntilDue < 0) {
                  badgeVariant = "destructive";
                } else if (daysUntilDue <= 3) {
                  badgeVariant = "secondary";
                }
                
                return (
                  <div>
                    <h4 className="font-medium mb-2">Due Date</h4>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(selectedOrder.dueDate).toLocaleDateString()}</span>
                      <Badge variant={badgeVariant}>
                        {daysUntilDue < 0 
                          ? `${Math.abs(daysUntilDue)} days overdue`
                          : `${daysUntilDue} days left`
                        }
                      </Badge>
                    </div>
                  </div>
                );
              })()}

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
    </div>
  )
}