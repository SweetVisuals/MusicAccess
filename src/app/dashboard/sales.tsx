import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/@/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/@/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/@/ui/tabs";
import { Input } from "@/components/@/ui/input";
import { 
  ChevronDown, 
  ChevronUp, 
  CreditCard, 
  Calendar, 
  User, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Search,
  Filter,
  MoreVertical,
  ArrowUpRight,
  Download,
  FileText,
  Loader2,
  DollarSign,
  ShoppingBag,
  Package,
  Headphones,
  Music2,
  BarChart3,
  MessageSquare,
  ExternalLink,
  Eye,
  TrendingUp,
  TrendingDown,
  Users
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/@/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/@/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/@/ui/avatar";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/@/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ChartAreaInteractive } from "@/components/dashboard/layout/chart-area-interactive";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/@/ui/dropdown-menu";

interface Sale {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
  sale_date: string;
  order_id: string;
}

interface Order {
  id: string;
  type: 'beat' | 'service';
  title: string;
  price: number;
  status: 'completed' | 'pending' | 'failed' | 'processing';
  paymentMethod: string;
  date: string;
  customer: {
    name: string;
    email: string;
    location: string;
    avatar?: string;
    id?: string;
    username?: string;
  };
  details?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  notes?: string;
  processingFee?: number;
  tax?: number;
  total?: number;
  items?: Array<{
    id: string;
    title: string;
    price: number;
    type?: string;
  }>;
}

interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  failedOrders: 0;
  totalRevenue: 0;
  averageOrderValue: number;
  conversionRate: number;
  repeatCustomers: number;
}

export default function SalesPage() {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [orderStats, setOrderStats] = useState<OrderStats>({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    failedOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    conversionRate: 0,
    repeatCustomers: 0
  });
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalSales: 0,
    newCustomers: 0,
  });
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<{id: string, name: string} | null>(null);
  const [messageContent, setMessageContent] = useState("");
  const [showAttachmentDialog, setShowAttachmentDialog] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<{url: string, name: string} | null>(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState<string | null>(null);

  const calculateStats = (salesData: Sale[]) => {
    const totalRevenue = salesData.reduce((acc, sale) => acc + sale.price * sale.quantity, 0);
    const totalSales = salesData.length;
    const newCustomers = new Set(salesData.map(sale => sale.order_id)).size;
    setStats({ totalRevenue, totalSales, newCustomers });
  };

  useEffect(() => {
    const fetchSalesAndOrders = async () => {
      setIsLoading(true);
      try {
        const [salesRes, ordersRes] = await Promise.all([
          supabase.from('sales').select('*'),
          supabase.from('orders').select('*').order('order_date', { ascending: false })
        ]);

        if (salesRes.error) {
          console.error('Error fetching sales:', salesRes.error);
        } else {
          const salesData = salesRes.data as Sale[];
          setSales(salesData);
          calculateStats(salesData);
        }

        if (ordersRes.error) {
          console.error("Error fetching orders:", ordersRes.error);
          toast.error("Failed to fetch orders.");
          setOrders([]);
          setFilteredOrders([]);
        } else {
          const fetchedOrders: Order[] = ordersRes.data.map((order: any) => ({
            id: order.id,
            type: order.type,
            title: order.title,
            price: order.price,
            status: order.status,
            paymentMethod: order.payment_method,
            date: order.order_date,
            customer: {
              id: order.user_id,
              name: order.customer_name,
              email: order.customer_email,
              location: order.customer_location,
              avatar: order.customer_avatar,
              username: order.customer_username,
            },
            details: order.details,
            attachmentUrl: order.attachment_url,
            attachmentName: order.attachment_name,
            notes: order.notes,
            processingFee: order.processing_fee,
            tax: order.tax,
            total: order.total,
            items: order.items,
          }));

          setOrders(fetchedOrders);
          setFilteredOrders(fetchedOrders);
          calculateOrderStats(fetchedOrders);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchSalesAndOrders();
    }
  }, [user, timeRange]);

  useEffect(() => {
    let filtered = [...orders];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order => 
        order.title.toLowerCase().includes(query) || 
        order.customer.name.toLowerCase().includes(query) ||
        order.id.toLowerCase().includes(query)
      );
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    if (typeFilter !== "all") {
      filtered = filtered.filter(order => order.type === typeFilter);
    }
    
    setFilteredOrders(filtered);
  }, [orders, searchQuery, statusFilter, typeFilter]);

  const calculateOrderStats = (orders: Order[]) => {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(order => order.status === "pending").length;
    const completedOrders = orders.filter(order => order.status === "completed").length;
    const failedOrders = orders.filter(order => order.status === "failed").length;
    
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || order.price), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    const uniqueCustomers = new Set(orders.map(order => order.customer.email)).size;
    const repeatCustomers = totalOrders > 0 ? Math.round(((totalOrders - uniqueCustomers) / totalOrders) * 100) : 0;
    
    const conversionRate = 0;
    
    setOrderStats({
      totalOrders,
      pendingOrders,
      completedOrders,
      failedOrders,
      totalRevenue,
      averageOrderValue,
      conversionRate,
      repeatCustomers
    });
  };

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrder(prevId => prevId === orderId ? null : orderId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-500 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-500 flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/10 text-red-500 flex items-center gap-1"><XCircle className="h-3 w-3" /> Failed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500/10 text-blue-500 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Processing</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'beat':
        return <Badge variant="outline" className="flex items-center gap-1"><Music2 className="h-3 w-3" /> Beat</Badge>;
      case 'service':
        return <Badge variant="outline" className="flex items-center gap-1"><Headphones className="h-3 w-3" /> Service</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: 'completed' | 'pending' | 'failed' | 'processing') => {
    setStatusUpdateLoading(orderId);
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) {
        throw error;
      }
      
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      
      calculateOrderStats(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      
      toast.success(`Order ${orderId} status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    } finally {
      setStatusUpdateLoading(null);
    }
  };

  const handleMessageCustomer = (customer: {id: string, name: string}) => {
    setSelectedCustomer(customer);
    setMessageContent("");
    setShowMessageDialog(true);
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !selectedCustomer) return;
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`Message sent to ${selectedCustomer.name}`);
      setShowMessageDialog(false);
      setMessageContent("");
      setSelectedCustomer(null);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  const handleViewAttachment = (attachment: {url: string, name: string}) => {
    setSelectedAttachment(attachment);
    setShowAttachmentDialog(true);
  };

  return (
    <>
      <div className="@container/main flex flex-1 flex-col gap-6 animate-fade-in p-6">
        <Tabs defaultValue="orders">
              <TabsList>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="sales">Sales</TabsTrigger>
              </TabsList>
              <TabsContent value="sales" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                      <Music2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalSales}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">New Customers</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.newCustomers}</div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Sales Analytics</CardTitle>
                    <CardDescription>Track your sales performance over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartAreaInteractive />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Sales</CardTitle>
                    <CardDescription>Your latest audio file sales</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input placeholder="Search sales..." className="pl-9" />
                        </div>
                        <Button variant="outline" size="icon">
                          <Filter className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Track</TableHead>
                              <TableHead>Buyer</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>License</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sales.map((sale) => (
                              <TableRow key={sale.id}>
                                <TableCell className="font-medium">{sale.product_name}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                      <AvatarFallback>{sale.order_id[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                      <span className="text-sm font-medium">{sale.order_id}</span>
                                    </div>
                                    </div>
                                  </TableCell>
                                <TableCell>${sale.price}</TableCell>
                                <TableCell>{sale.quantity}</TableCell>
                                <TableCell>{new Date(sale.sale_date).toLocaleDateString()}</TableCell>
                                <TableCell>
                                  <Badge variant="secondary" className="capitalize">
                                    Completed
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem>View Details</DropdownMenuItem>
                                      <DropdownMenuItem>Download Invoice</DropdownMenuItem>
                                      <DropdownMenuItem>Contact Buyer</DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Selling Tracks</CardTitle>
                    <CardDescription>Your best performing audio files</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[1, 2, 3].map((item) => (
                        <div key={item} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Music2 className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">Summer Vibes {item}</h4>
                            <p className="text-sm text-muted-foreground">
                              {Math.floor(Math.random() * 100)} sales this month
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${(Math.random() * 1000).toFixed(2)}</p>
                            <div className="flex items-center gap-1 text-sm text-green-500">
                              <ArrowUpRight className="h-3 w-3" />
                              <span>12.5%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="orders" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                  <Card className="col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                      <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="h-9 flex items-center">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span className="text-muted-foreground">Loading...</span>
                        </div>
                      ) : (
                        <div className="text-2xl font-bold">{orderStats.totalOrders}</div>
                      )}
                    </CardContent>
                  </Card>

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
                        <div className="text-2xl font-bold">{formatCurrency(orderStats.totalRevenue)}</div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Average Order</CardTitle>
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="h-9 flex items-center">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span className="text-muted-foreground">Loading...</span>
                        </div>
                      ) : (
                        <div className="text-2xl font-bold">{formatCurrency(orderStats.averageOrderValue)}</div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="h-9 flex items-center">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span className="text-muted-foreground">Loading...</span>
                        </div>
                      ) : (
                        <div className="text-2xl font-bold">{orderStats.conversionRate}%</div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="col-span-2 md:col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xs font-medium">Pending</CardTitle>
                      <Clock className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold">{orderStats.pendingOrders}</div>
                    </CardContent>
                  </Card>

                  <Card className="col-span-2 md:col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xs font-medium">Completed</CardTitle>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold">{orderStats.completedOrders}</div>
                    </CardContent>
                  </Card>

                  <Card className="col-span-2 md:col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xs font-medium">Failed</CardTitle>
                      <XCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold">{orderStats.failedOrders}</div>
                    </CardContent>
                  </Card>

                  <Card className="col-span-2 md:col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xs font-medium">Repeat Customers</CardTitle>
                      <User className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold">{orderStats.repeatCustomers}%</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search orders..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="beat">Beats</SelectItem>
                        <SelectItem value="service">Services</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Order History</CardTitle>
                    <CardDescription>Manage your beat sales and service orders</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="h-[300px] flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : filteredOrders.length === 0 ? (
                      <div className="text-center py-8">
                        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">No orders found</h3>
                        <p className="text-muted-foreground">Try adjusting your filters or search query</p>
                      </div>
                    ) : (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[100px]">Order ID</TableHead>
                              <TableHead>Customer</TableHead>
                              <TableHead>Item</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredOrders.map((order) => (
                              <React.Fragment key={order.id}>
                                <TableRow className="cursor-pointer" onClick={() => toggleOrderExpansion(order.id)}>
                                  <TableCell className="font-medium">{order.id}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage src={order.customer.avatar} />
                                        <AvatarFallback>{order.customer.name[0]}</AvatarFallback>
                                      </Avatar>
                                      <div className="flex flex-col">
                                        <Button 
                                          variant="link" 
                                          className="h-auto p-0 font-medium text-left"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (order.customer.username) {
                                              window.open(`/user/${order.customer.username}`, '_blank');
                                            }
                                          }}
                                        >
                                          {order.customer.name}
                                        </Button>
                                        <div className="text-xs text-muted-foreground">{order.customer.email}</div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Button 
                                      variant="link" 
                                      className="h-auto p-0 text-left"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (order.attachmentUrl && order.attachmentName) {
                                          handleViewAttachment({
                                            url: order.attachmentUrl!,
                                            name: order.attachmentName
                                          });
                                        }
                                      }}
                                    >
                                      {order.title}
                                    </Button>
                                  </TableCell>
                                  <TableCell>{getTypeBadge(order.type)}</TableCell>
                                  <TableCell>${(order.total || order.price).toFixed(2)}</TableCell>
                                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                                  <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                                  <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" className="gap-1">
                                      {expandedOrder === order.id ? (
                                        <ChevronUp className="h-4 w-4" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4" />
                                      )}
                                      Details
                                    </Button>
                                  </TableCell>
                                </TableRow>
                                {expandedOrder === order.id && (
                                  <TableRow>
                                    <TableCell colSpan={8} className="bg-muted/50 p-4">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                          <h4 className="font-medium mb-2">Customer Information</h4>
                                          <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm">
                                              <User className="h-4 w-4 text-muted-foreground" />
                                              <span className="font-medium">Name:</span>
                                              <Button 
                                                variant="link" 
                                                className="h-auto p-0"
                                                onClick={() => {
                                                  if (order.customer.username) {
                                                    window.open(`/user/${order.customer.username}`, '_blank');
                                                  }
                                                }}
                                              >
                                                {order.customer.name}
                                                <ExternalLink className="h-3 w-3 ml-1" />
                                              </Button>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                              <Mail className="h-4 w-4 text-muted-foreground" />
                                              <span className="font-medium">Email:</span>
                                              <span>{order.customer.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                              <MapPin className="h-4 w-4 text-muted-foreground" />
                                              <span className="font-medium">Location:</span>
                                              <span>{order.customer.location}</span>
                                            </div>
                                          </div>
                                        </div>
                                        <div>
                                          <h4 className="font-medium mb-2">Order Details</h4>
                                          <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm">
                                              <FileText className="h-4 w-4 text-muted-foreground" />
                                              <span className="font-medium">Description:</span>
                                              <span>{order.details}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                              <CreditCard className="h-4 w-4 text-muted-foreground" />
                                              <span className="font-medium">Payment Method:</span>
                                              <span>{order.paymentMethod}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                              <Calendar className="h-4 w-4 text-muted-foreground" />
                                              <span className="font-medium">Order Date:</span>
                                              <span>{new Date(order.date).toLocaleDateString()}</span>
                                            </div>
                                            {order.attachmentUrl && (
                                              <div className="flex items-center gap-2 text-sm">
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">Attachment:</span>
                                                <Button 
                                                  variant="link" 
                                                  className="h-auto p-0"
                                                  onClick={() => handleViewAttachment({
                                                    url: order.attachmentUrl!,
                                                    name: order.attachmentName || 'attachment'
                                                  })}
                                                >
                                                  {order.attachmentName || 'View attachment'}
                                                  <Eye className="h-3 w-3 ml-1" />
                                                </Button>
                                              </div>
                                            )}
                                            {order.notes && (
                                              <div className="flex gap-2 text-sm mt-2">
                                                <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                                <div>
                                                  <span className="font-medium">Notes:</span>
                                                  <p className="text-muted-foreground mt-1">{order.notes}</p>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {order.items && order.items.length > 0 && (
                                        <div className="mt-4 border-t pt-4">
                                          <h4 className="font-medium mb-2">Order Items</h4>
                                          <div className="rounded-md border">
                                            <Table>
                                              <TableHeader>
                                                <TableRow>
                                                  <TableHead>Item</TableHead>
                                                  <TableHead>Type</TableHead>
                                                  <TableHead className="text-right">Price</TableHead>
                                                </TableRow>
                                              </TableHeader>
                                              <TableBody>
                                                {order.items.map((item) => (
                                                  <TableRow key={item.id}>
                                                    <TableCell>{item.title}</TableCell>
                                                    <TableCell>{item.type || 'Beat'}</TableCell>
                                                    <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                                                  </TableRow>
                                                ))}
                                                {order.processingFee && (
                                                  <TableRow>
                                                    <TableCell colSpan={2} className="text-right font-medium">Processing Fee (3%)</TableCell>
                                                    <TableCell className="text-right">${order.processingFee.toFixed(2)}</TableCell>
                                                  </TableRow>
                                                )}
                                                {order.tax && (
                                                  <TableRow>
                                                    <TableCell colSpan={2} className="text-right font-medium">Tax (8%)</TableCell>
                                                    <TableCell className="text-right">${order.tax.toFixed(2)}</TableCell>
                                                  </TableRow>
                                                )}
                                                <TableRow>
                                                  <TableCell colSpan={2} className="text-right font-bold">Total</TableCell>
                                                  <TableCell className="text-right font-bold">${(order.total || order.price).toFixed(2)}</TableCell>
                                                </TableRow>
                                              </TableBody>
                                            </Table>
                                          </div>
                                        </div>
                                      )}
                                      
                                      <div className="mt-4 border-t pt-4">
                                        <h4 className="font-medium mb-2">Update Status</h4>
                                        <div className="flex flex-wrap gap-2">
                                          <Button 
                                            variant={order.status === "pending" ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handleUpdateStatus(order.id, "pending")}
                                            disabled={statusUpdateLoading === order.id || order.status === "pending"}
                                          >
                                            {statusUpdateLoading === order.id ? (
                                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                              <Clock className="h-4 w-4 mr-2" />
                                            )}
                                            Pending
                                          </Button>
                                          <Button 
                                            variant={order.status === "processing" ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handleUpdateStatus(order.id, "processing")}
                                            disabled={statusUpdateLoading === order.id || order.status === "processing"}
                                          >
                                            {statusUpdateLoading === order.id ? (
                                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                              <Loader2 className="h-4 w-4 mr-2" />
                                            )}
                                            Processing
                                          </Button>
                                          <Button 
                                            variant={order.status === "completed" ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handleUpdateStatus(order.id, "completed")}
                                            disabled={statusUpdateLoading === order.id || order.status === "completed"}
                                          >
                                            {statusUpdateLoading === order.id ? (
                                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                              <CheckCircle className="h-4 w-4 mr-2" />
                                            )}
                                            Completed
                                          </Button>
                                          <Button 
                                            variant={order.status === "failed" ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handleUpdateStatus(order.id, "failed")}
                                            disabled={statusUpdateLoading === order.id || order.status === "failed"}
                                          >
                                            {statusUpdateLoading === order.id ? (
                                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                              <XCircle className="h-4 w-4 mr-2" />
                                            )}
                                            Failed
                                          </Button>
                                        </div>
                                      </div>
                                      
                                      <div className="flex justify-end gap-2 mt-4">
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="gap-2"
                                          onClick={() => handleMessageCustomer({
                                            id: order.customer.id || 'unknown',
                                            name: order.customer.name
                                          })}
                                        >
                                          <MessageSquare className="h-4 w-4" />
                                          Message Customer
                                        </Button>
                                        <Button variant="outline" size="sm" className="gap-2">
                                          <Download className="h-4 w-4" />
                                          Invoice
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </React.Fragment>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="text-sm text-muted-foreground">
                      Showing {filteredOrders.length} of {orders.length} orders
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={filteredOrders.length === 0}>
                        Previous
                      </Button>
                      <Button variant="outline" size="sm" disabled={filteredOrders.length === 0}>
                        Next
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Message to {selectedCustomer?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Type your message here..."
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              className="min-h-[150px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMessageDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendMessage} disabled={!messageContent.trim()}>
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAttachmentDialog} onOpenChange={setShowAttachmentDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Attachment: {selectedAttachment?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="border rounded-md p-4 bg-muted/50">
              <div className="flex items-center justify-center p-8 bg-muted rounded-md">
                {selectedAttachment?.name.endsWith('.mp3') || selectedAttachment?.name.endsWith('.wav') ? (
                  <div className="w-full">
                    <div className="flex items-center justify-center mb-4">
                      <Music2 className="h-16 w-16 text-primary/50" />
                    </div>
                    <audio controls className="w-full">
                      <source src={selectedAttachment?.url} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                ) : selectedAttachment?.name.endsWith('.zip') ? (
                  <div className="text-center">
                    <CustomPackage className="h-16 w-16 mx-auto text-primary/50 mb-4" />
                    <p className="text-muted-foreground">Archive file</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <FileText className="h-16 w-16 mx-auto text-primary/50 mb-4" />
                    <p className="text-muted-foreground">File preview not available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAttachmentDialog(false)}>
              Close
            </Button>
            <Button 
              onClick={() => {
                if (selectedAttachment?.url) {
                  window.open(selectedAttachment.url, '_blank');
                }
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Mail(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

function MapPin(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function CustomPackage(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  )
}
