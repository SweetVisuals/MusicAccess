import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/@/ui/tabs"
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
  ArrowUpRight
} from 'lucide-react'
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
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
}

interface ServiceOrder {
  id: string;
  client: {
    name: string;
    avatar?: string;
  };
  service: string;
  price: number;
  status: 'pending' | 'accepted' | 'completed' | 'rejected';
  date: string;
}

interface AudioSale {
  id: string;
  track: {
    title: string;
    artwork?: string;
  };
  buyer: {
    name: string;
    avatar?: string;
  };
  amount: number;
  license: string;
  date: string;
}

export default function Dashboard() {
  const { user } = useAuth()
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
    clientsChange: 0
  })
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([])
  const [audioSales, setAudioSales] = useState<AudioSale[]>([])
  const [topPerformers, setTopPerformers] = useState<{
    services: { name: string; revenue: number }[];
    tracks: { title: string; sales: number }[];
  }>({
    services: [],
    tracks: []
  })

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user, timeRange])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      // Fetch dashboard metrics
      await Promise.all([
        fetchMetrics(),
        fetchServiceOrders(),
        fetchAudioSales(),
        fetchTopPerformers()
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
      // Fetch revenue data from orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('total')
        .eq('user_id', user?.id)

      if (ordersError) throw ordersError

      const totalRevenue = ordersData?.reduce((sum, item) => sum + (item.total || 0), 0) || 0
      
      // Fetch active services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('id', { count: 'exact' })
        .eq('user_id', user?.id)
        .eq('is_active', true)
      
      if (servicesError) throw servicesError
      
      const activeServices = servicesData?.length || 0
      
      // Fetch user stats
      const { data: statsData, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user?.id)
        .single()
      
      if (statsError && statsError.code !== 'PGRST116') throw statsError
      
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
        clientsChange: 0 // Placeholder
      })
    } catch (error) {
      console.error('Error fetching metrics:', error)
    }
  }

  const fetchServiceOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user?.id)
        .order('order_date', { ascending: false })
        .limit(5)

      if (error) throw error

      const orders = data?.map(order => ({
        id: order.id,
        client: {
          name: order.customer_name || 'Anonymous',
          avatar: order.customer_avatar
        },
        service: order.title || 'Unknown Service',
        price: order.total || 0,
        status: order.status || 'pending',
        date: new Date(order.order_date).toISOString().split('T')[0]
      })) || []

      setServiceOrders(orders)
    } catch (error) {
      console.error('Error fetching service orders:', error)
    }
  }

  const fetchAudioSales = async () => {
    try {
      const { data, error } = await supabase
        .from('files')
        .select(`
          id,
          name,
          price,
          orders (
            customer_name,
            customer_avatar,
            order_date
          )
        `)
        .eq('orders.user_id', user?.id)
        .order('order_date', { ascending: false, foreignTable: 'orders' })
        .limit(5)

      if (error) throw error

      const sales = data?.map((sale: any) => ({
        id: sale.id,
        track: {
          title: sale.name,
        },
        buyer: {
          name: sale.orders.customer_name || 'Anonymous',
          avatar: sale.orders.customer_avatar,
        },
        amount: sale.price, // Assuming quantity is 1 for a file sale
        license: 'Standard',
        date: new Date(sale.orders.order_date).toISOString().split('T')[0],
      })) || []

      setAudioSales(sales)
    } catch (error) {
      console.error('Error fetching audio sales:', error)
    }
  }

  const fetchTopPerformers = async () => {
    try {
      const { data: servicesData, error: servicesError } = await supabase
        .from('orders')
        .select('title, total')
        .eq('user_id', user?.id)
        .eq('type', 'service')
        .order('total', { ascending: false })
        .limit(4)

      if (servicesError) throw servicesError

      const topServices = servicesData?.map(service => ({
        name: service.title,
        revenue: service.total
      })) || []

      const { data: tracksData, error: tracksError } = await supabase
        .from('files')
        .select('name, orders!inner(id)')
        .eq('orders.user_id', user?.id)

      if (tracksError) throw tracksError

      const trackSales = tracksData?.reduce((acc, track) => {
        acc[track.name] = (acc[track.name] || 0) + 1 // Counting sales
        return acc
      }, {} as Record<string, number>)

      const topTracks = Object.entries(trackSales)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 4)
        .map(([title, sales]) => ({ title, sales }))

      setTopPerformers({
        services: topServices,
        tracks: topTracks
      })
    } catch (error) {
      console.error('Error fetching top performers:', error)
    }
  }

  // Helper function to get date from range
  const getDateFromRange = (range: string, previous = false) => {
    const now = new Date()
    let days = 0
    
    switch (range) {
      case '7d':
        days = 7
        break
      case '30d':
        days = 30
        break
      case '90d':
        days = 90
        break
      default:
        days = 30
    }
    
    if (previous) {
      // For previous period, go back 2x the days
      now.setDate(now.getDate() - (days * 2))
    } else {
      now.setDate(now.getDate() - days)
    }
    
    return now.toISOString()
  }

  // Helper function to format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Helper function to get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-500">Completed</Badge>
      case 'accepted':
        return <Badge className="bg-blue-500/10 text-blue-500">Accepted</Badge>
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-500">Pending</Badge>
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-500">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-4 animate-fade-in p-6">
        {/* Header with Time Range Selector */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's an overview of your activity</p>
          </div>
          <div className="flex items-center gap-2">
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
                  <div className="text-2xl font-bold">${metrics.totalRevenue.toLocaleString()}</div>
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

          {/* Plays */}
          <Card className="col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Plays</CardTitle>
              <PlayCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-9 flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-muted-foreground">Loading...</span>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{formatNumber(metrics.totalPlays)}</div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    {metrics.playsChange >= 0 ? (
                      <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                    )}
                    {metrics.playsChange >= 0 ? '+' : ''}{metrics.playsChange.toFixed(1)}% from last period
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Active Services */}
          <Card className="col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Services</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-9 flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-muted-foreground">Loading...</span>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{metrics.activeServices}</div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    {metrics.servicesChange >= 0 ? (
                      <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                    )}
                    {metrics.servicesChange >= 0 ? '+' : ''}{Math.abs(metrics.servicesChange).toFixed(1)}% from last period
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Active Clients */}
          <Card className="col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-9 flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-muted-foreground">Loading...</span>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{metrics.activeClients}</div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    {metrics.clientsChange >= 0 ? (
                      <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                    )}
                    {metrics.clientsChange >= 0 ? '+' : ''}{Math.abs(metrics.clientsChange).toFixed(1)}% from last period
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Additional Metrics - Row 2 */}
          {/* Total Tracks */}
          <Card className="col-span-2 md:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Tracks</CardTitle>
              <Music className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{metrics.totalTracks}</div>
            </CardContent>
          </Card>

          {/* Followers */}
          <Card className="col-span-2 md:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Followers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{formatNumber(metrics.totalFollowers)}</div>
            </CardContent>
          </Card>

          {/* Gems */}
          <Card className="col-span-2 md:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Gems</CardTitle>
              <Gem className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{formatNumber(metrics.totalGems)}</div>
            </CardContent>
          </Card>

          {/* Likes */}
          <Card className="col-span-2 md:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Likes</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{formatNumber(metrics.totalLikes)}</div>
            </CardContent>
          </Card>

          {/* Shares */}
          <Card className="col-span-2 md:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Shares</CardTitle>
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{formatNumber(metrics.totalShares)}</div>
            </CardContent>
          </Card>

          {/* Conversion Rate */}
          <Card className="col-span-2 md:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Conversion</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{metrics.conversionRate.toFixed(1)}%</div>
            </CardContent>
          </Card>

          {/* Avg Session */}
          <Card className="col-span-2 md:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Avg Session</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{Math.floor(metrics.avgSessionDuration / 60)}m {metrics.avgSessionDuration % 60}s</div>
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card className="col-span-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Top Services</CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="space-y-2">
                {topPerformers.services.map((service, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        index === 0 ? 'bg-green-500' : 
                        index === 1 ? 'bg-blue-500' : 
                        index === 2 ? 'bg-purple-500' : 'bg-orange-500'
                      }`} />
                      <span className="text-sm truncate max-w-[150px]">{service.name}</span>
                    </div>
                    <span className="text-sm font-medium">${service.revenue}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Top Tracks</CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="space-y-2">
                {topPerformers.tracks.map((track, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        index === 0 ? 'bg-green-500' : 
                        index === 1 ? 'bg-blue-500' : 
                        index === 2 ? 'bg-purple-500' : 'bg-orange-500'
                      }`} />
                      <span className="text-sm truncate max-w-[150px]">{track.title}</span>
                    </div>
                    <span className="text-sm font-medium">{track.sales} sales</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Services and Audio Sales */}
        <div className="mt-4">
          <Tabs defaultValue="services">
            <TabsList>
              <TabsTrigger value="services" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Service Orders
              </TabsTrigger>
              <TabsTrigger value="audio" className="flex items-center gap-2">
                <Headphones className="h-4 w-4" />
                Audio Sales
              </TabsTrigger>
            </TabsList>
            
            {/* Services Tab */}
            <TabsContent value="services" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Recent Service Orders</CardTitle>
                    <CardDescription>Manage your incoming service requests</CardDescription>
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
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {serviceOrders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={order.client.avatar} />
                                    <AvatarFallback>{order.client.name[0]}</AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium">{order.client.name}</span>
                                </div>
                              </TableCell>
                              <TableCell>{order.service}</TableCell>
                              <TableCell>${order.price.toFixed(2)}</TableCell>
                              <TableCell>{getStatusBadge(order.status)}</TableCell>
                              <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm">View</Button>
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
                    View All
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Audio Sales Tab */}
            <TabsContent value="audio" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Recent Audio Sales</CardTitle>
                    <CardDescription>Track your music and audio sales</CardDescription>
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
                            <TableHead>Track</TableHead>
                            <TableHead>Buyer</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>License</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {audioSales.map((sale) => (
                            <TableRow key={sale.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 rounded-md bg-muted overflow-hidden">
                                    {sale.track.artwork && (
                                      <img 
                                        src={sale.track.artwork} 
                                        alt={sale.track.title}
                                        className="h-full w-full object-cover"
                                      />
                                    )}
                                  </div>
                                  <span className="font-medium">{sale.track.title}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={sale.buyer.avatar} />
                                    <AvatarFallback>{sale.buyer.name[0]}</AvatarFallback>
                                  </Avatar>
                                  <span>{sale.buyer.name}</span>
                                </div>
                              </TableCell>
                              <TableCell>${sale.amount.toFixed(2)}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{sale.license}</Badge>
                              </TableCell>
                              <TableCell>{new Date(sale.date).toLocaleDateString()}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm">View</Button>
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
                    Showing {audioSales.length} of {audioSales.length} sales
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <ArrowUpRight className="h-4 w-4" />
                    View All
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
