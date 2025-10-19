import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/@/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/@/ui/badge";
import { Input } from "@/components/@/ui/input";
import {
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Download,
  Search,
  Filter,
  FileText,
  ShoppingBag,
  Calendar,
  Eye,
  ExternalLink,
  Package,
  Music,
  Image,
  Video,
  File
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/@/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/@/ui/dialog";
import { toast } from "sonner";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (fileType: string) => {
  switch (fileType) {
    case 'audio':
      return <Music className="h-4 w-4 text-green-500" />;
    case 'image':
      return <Image className="h-4 w-4 text-blue-500" />;
    case 'video':
      return <Video className="h-4 w-4 text-red-500" />;
    case 'pdf':
      return <FileText className="h-4 w-4 text-orange-500" />;
    default:
      return <File className="h-4 w-4 text-gray-500" />;
  }
};

const getFileFormat = (fileName: string): string => {
  if (fileName && fileName.includes('.')) {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (extension) {
      const formatMap: { [key: string]: string } = {
        'mp3': 'MP3', 'wav': 'WAV', 'flac': 'FLAC', 'aac': 'AAC', 'ogg': 'OGG',
        'wma': 'WMA', 'm4a': 'M4A', 'aiff': 'AIFF', 'au': 'AU', 'ra': 'RA',
        'mp4': 'MP4', 'avi': 'AVI', 'mov': 'MOV', 'wmv': 'WMV', 'flv': 'FLV',
        'webm': 'WEBM', 'mkv': 'MKV', 'jpg': 'JPG', 'jpeg': 'JPEG', 'png': 'PNG',
        'gif': 'GIF', 'bmp': 'BMP', 'tiff': 'TIFF', 'webp': 'WEBP', 'svg': 'SVG',
        'pdf': 'PDF', 'doc': 'DOC', 'docx': 'DOCX', 'txt': 'TXT', 'rtf': 'RTF',
        'odt': 'ODT', 'zip': 'ZIP', 'rar': 'RAR', '7z': '7Z', 'tar': 'TAR', 'gz': 'GZ'
      };
      return formatMap[extension] || extension.toUpperCase();
    }
  }
  return 'Unknown';
};

interface OrderFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size?: number;
  created_at?: string;
}

interface OrderItem {
  id: string;
  title: string;
  price: number;
  type?: string;
  selected_file_types?: string[];
  files?: OrderFile[];
  project_id?: string;
  track_id?: string;
}

interface Order {
   id: string;
   date: string;
   status: 'completed' | 'pending' | 'failed' | 'processing';
   total: number;
   items: OrderItem[];
   processingFee: number;
   tax: number;
   attachmentUrl?: string;
   attachmentName?: string;
   archived?: boolean;
}

export default function OrderHistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAttachmentDialog, setShowAttachmentDialog] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<{url: string, name: string} | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [instantOrder, setInstantOrder] = useState<Order | null>(null);

  // Check for refresh parameter to force refetch after checkout
  useEffect(() => {
    if (searchParams.get('refresh') === 'true') {
      setRefreshKey(prev => prev + 1);
      // Clean up the URL by removing the refresh parameter
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('refresh');
      const newUrl = `${window.location.pathname}${newSearchParams.toString() ? '?' + newSearchParams.toString() : ''}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);

  // Handle instant order display from navigation state
  useEffect(() => {
    if (location.state?.newOrder) {
      const newOrder = location.state.newOrder;
      const formattedOrder: Order = {
        id: newOrder.id,
        date: newOrder.order_date,
        status: newOrder.status,
        total: newOrder.total,
        items: (newOrder.items || []).map((item: any) => ({
          id: item.id,
          title: item.title,
          price: item.price,
          type: item.type,
          selected_file_types: item.selected_file_types,
          files: item.files || [],
          project_id: item.project_id,
          track_id: item.track_id
        })),
        processingFee: newOrder.processing_fee || 0,
        tax: newOrder.tax || 0,
        attachmentUrl: newOrder.attachment_url,
        attachmentName: newOrder.attachment_name,
      };
      setInstantOrder(formattedOrder);
      // Clear the state to prevent it from persisting on page refresh
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [location.state]);

  // Sample orders data - in a real app, this would come from your database
  const sampleOrders: Order[] = [
    {
      id: "ORD-001",
      date: "2024-03-15",
      status: "completed",
      total: 332.99,
      processingFee: 9.00,
      tax: 24.00,
      items: [
        {
          id: "item-001",
          title: "Summer Vibes Beat",
          price: 299.99,
          type: "track",
          project_id: "proj-001",
          track_id: "track-001",
          files: [
            { id: "file-001", name: "summer-vibes-beat.mp3", url: "https://example.com/files/summer-vibes-beat.mp3", type: "mp3", size: 5242880, created_at: "2024-03-10T10:00:00Z" },
            { id: "file-002", name: "summer-vibes-beat.wav", url: "https://example.com/files/summer-vibes-beat.wav", type: "wav", size: 15728640, created_at: "2024-03-10T10:00:00Z" }
          ]
        }
      ],
      attachmentUrl: "https://example.com/files/summer-vibes-beat.mp3",
      attachmentName: "summer-vibes-beat.mp3"
    },
    {
      id: "ORD-002",
      date: "2024-03-10",
      status: "completed",
      total: 554.99,
      processingFee: 15.00,
      tax: 40.00,
      items: [
        {
          id: "item-002",
          title: "Mix & Master Service",
          price: 499.99,
          type: "service"
        }
      ],
      attachmentUrl: "https://example.com/files/track-to-mix.wav",
      attachmentName: "track-to-mix.wav"
    },
    {
      id: "ORD-003",
      date: "2024-02-28",
      status: "completed",
      total: 199.89,
      processingFee: 5.40,
      tax: 14.40,
      items: [
        {
          id: "item-003",
          title: "Track 1",
          price: 49.99,
          type: "track",
          project_id: "proj-002",
          track_id: "track-002",
          files: [
            { id: "file-003", name: "track1.mp3", url: "https://example.com/files/track1.mp3", type: "mp3", size: 4194304, created_at: "2024-02-25T14:30:00Z" },
            { id: "file-004", name: "track1.wav", url: "https://example.com/files/track1.wav", type: "wav", size: 12582912, created_at: "2024-02-25T14:30:00Z" }
          ]
        },
        {
          id: "item-004",
          title: "Track 2",
          price: 49.99,
          type: "track",
          project_id: "proj-002",
          track_id: "track-003",
          files: [
            { id: "file-005", name: "track2.mp3", url: "https://example.com/files/track2.mp3", type: "mp3", size: 3670016, created_at: "2024-02-25T15:45:00Z" },
            { id: "file-006", name: "track2.wav", url: "https://example.com/files/track2.wav", type: "wav", size: 11010048, created_at: "2024-02-25T15:45:00Z" }
          ]
        }
      ],
      attachmentUrl: "https://example.com/files/lofi-collection.zip",
      attachmentName: "lofi-collection.zip"
    }
  ];

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user?.id)
          .order('order_date', { ascending: false });

        if (error) {
          console.error("Error fetching orders:", error);
          toast.error("Failed to fetch orders.");
          // Show sample data if fetch fails
          setOrders(sampleOrders);
          setFilteredOrders(sampleOrders);
        } else {
          // Map fetched data to the Order interface structure
          const fetchedOrders: Order[] = data.map((order: any) => {
            // Use the files and project_id that were already stored in the order during checkout
            const itemsWithFiles = (order.items || []).map((item: any) => {
              let files = Array.isArray(item.files) ?
                item.files
                  .filter((file: any, index: number, self: any[]) => self.findIndex((f: any) => f.id === file.id) === index) // Deduplicate by id
                  .map((file: any, index: number) => ({
                    id: `${item.id}-${file.id || `file-${index}`}`, // Ensure unique ID
                    name: file.name,
                    url: file.url,
                    type: file.type,
                    size: file.size,
                    created_at: file.created_at
                  })) : [];

              // If no files, create virtual file for tracks
              if (files.length === 0 && item.type === 'track') {
                const extension = item.file_name ? item.file_name.split('.').pop()?.toLowerCase() : 'mp3';
                const virtualName = item.file_name || `${item.title}.${extension}`;
                files = [{
                  id: `virtual-${item.id}-${extension}`,
                  name: virtualName,
                  url: `placeholder://track-${item.track_id || item.id}-${extension}`,
                  type: extension,
                  size: undefined,
                  created_at: new Date().toISOString()
                }];
              }

              return {
                ...item,
                files
              };
            });

            return {
              id: order.id,
              date: order.order_date,
              status: order.status,
              total: order.total,
              items: itemsWithFiles,
              processingFee: order.processing_fee || 0,
              tax: order.tax || 0,
              attachmentUrl: order.attachment_url,
              attachmentName: order.attachment_name,
              archived: order.archived || false,
            };
          });

          // If no orders from database, show sample data for demo
          if (fetchedOrders.length === 0) {
            setOrders(sampleOrders);
            setFilteredOrders(sampleOrders);
          } else {
            setOrders(fetchedOrders);
            setFilteredOrders(fetchedOrders);

            // Check if any order has items with no files, and retry if needed
            const hasEmptyFiles = fetchedOrders.some(order =>
              order.items.some(item => !item.files || item.files.length === 0)
            );

            if (hasEmptyFiles && retryCount < 3) {
              setTimeout(() => {
                setRetryCount(prev => prev + 1);
              }, 2000); // Retry after 2 seconds
            }
          }
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast.error("An unexpected error occurred while fetching orders.");
        // Show sample data on error
        setOrders(sampleOrders);
        setFilteredOrders(sampleOrders);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchOrders();
    } else {
      // For guest users, show sample orders
      setOrders(sampleOrders);
      setFilteredOrders(sampleOrders);
      setIsLoading(false);
    }
  }, [user, retryCount, refreshKey]);

  useEffect(() => {
    // Apply filters when search query or status filter changes
    let allOrders = [...orders];
    if (instantOrder && !orders.find(o => o.id === instantOrder.id)) {
      allOrders = [instantOrder, ...allOrders];
    }

    let filtered = [...allOrders];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(query) ||
        order.items.some(item => item.title.toLowerCase().includes(query))
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  }, [orders, searchQuery, statusFilter, instantOrder]);

  const handleViewAttachment = (attachment: {url: string, name: string}) => {
    setSelectedAttachment(attachment);
    setShowAttachmentDialog(true);
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

  return (
    <>
      <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-4 animate-fade-in p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Order History</h1>
                <p className="text-muted-foreground">View your past orders and downloads</p>
              </div>
            </div>

            {/* Filters */}
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
                <select
                  className="flex h-10 w-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Orders List */}
            <Card>
              <CardHeader>
                <CardTitle>Your Orders</CardTitle>
                <CardDescription>View and manage your past orders</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No orders found</h3>
                    <p className="text-muted-foreground">You haven't placed any orders yet</p>
                    <Button 
                      className="mt-4"
                      onClick={() => navigate('/')}
                    >
                      Browse Products
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrders.map((order) => (
                          <React.Fragment key={order.id}>
                            <TableRow 
                              className="cursor-pointer" 
                              onClick={() => toggleOrderExpansion(order.id)}
                            >
                              <TableCell className="font-medium">{order.id}</TableCell>
                              <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                              <TableCell>
                                {order.items.length === 1 
                                  ? order.items[0].title 
                                  : `${order.items.length} items`}
                              </TableCell>
                              <TableCell>${order.total.toFixed(2)}</TableCell>
                              <TableCell>{getStatusBadge(order.status)}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm" className="gap-1">
                                  {expandedOrder === order.id ? "Hide" : "View"} Details
                                </Button>
                              </TableCell>
                            </TableRow>
                            
                            {/* Expanded Order Details */}
                            {expandedOrder === order.id && (
                              <TableRow>
                                <TableCell colSpan={6} className="bg-muted/50 p-4">
                                  <div className="space-y-4">
                                    {/* Order Details */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <h4 className="font-medium mb-2">Order Information</h4>
                                        <div className="space-y-2 text-sm">
                                          <div className="flex items-center gap-2">
                                            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">Order ID:</span>
                                            <span>{order.id}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">Date:</span>
                                            <span>{new Date(order.date).toLocaleDateString()}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">Status:</span>
                                            <span>{getStatusBadge(order.status)}</span>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div>
                                        <h4 className="font-medium mb-2">Payment Information</h4>
                                        <div className="space-y-2 text-sm">
                                          <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">Payment Method:</span>
                                            <span>Credit Card</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">Subtotal:</span>
                                            <span>${(order.total - order.processingFee - order.tax).toFixed(2)}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">Processing Fee:</span>
                                            <span>${order.processingFee.toFixed(2)}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">Tax:</span>
                                            <span>${order.tax.toFixed(2)}</span>
                                          </div>
                                          <div className="flex items-center gap-2 font-bold">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            <span>Total:</span>
                                            <span>${order.total.toFixed(2)}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Purchased Files - Grouped by Project */}
                                     <div>
                                       <h4 className="font-medium mb-3 flex items-center gap-2">
                                         <Package className="h-4 w-4" />
                                         Purchased Items
                                         <Badge variant="outline" className="text-xs">
                                           {order.items.reduce((total, item) => total + (item.files?.length || 0), 0)} files
                                         </Badge>
                                       </h4>
                                       <div className="space-y-6">
                                         {/* Group items by project_id */}
                                         {(() => {
                                           const projectGroups = order.items.reduce((groups, item) => {
                                             const projectId = item.project_id || 'no-project';
                                             if (!groups[projectId]) {
                                               groups[projectId] = {
                                                 project_id: item.project_id,
                                                 project_title: item.project_id ? 'Project Files' : 'Individual Items',
                                                 items: [],
                                                 allFiles: []
                                               };
                                             }
                                             groups[projectId].items.push(item);
                                             groups[projectId].allFiles.push(...(item.files || []));
                                             return groups;
                                           }, {} as Record<string, { project_id?: string; project_title: string; items: OrderItem[]; allFiles: OrderFile[] }>);

                                           return Object.values(projectGroups).map((group, groupIndex) => (
                                             <div key={group.project_id || `group-${groupIndex}`} className="border rounded-lg p-4">
                                               {/* Project Header */}
                                               <div className="flex items-center justify-between mb-4">
                                                 <h5 className="font-medium flex items-center gap-2">
                                                   <Music className="h-4 w-4 text-primary" />
                                                   {group.project_title}
                                                   {group.project_id && (
                                                     <Badge variant="outline" className="text-xs">
                                                       Project
                                                     </Badge>
                                                   )}
                                                 </h5>
                                                 <Badge variant="outline" className="text-xs">
                                                   {group.allFiles.length} file{group.allFiles.length !== 1 ? 's' : ''}
                                                 </Badge>
                                               </div>

                                               {/* Contract Access for Projects */}
                                               {group.project_id && (
                                                 <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                                                   <h6 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2 text-sm">
                                                     <FileText className="h-4 w-4" />
                                                     Contract & Legal Documents
                                                   </h6>
                                                   <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                                                     Access the licensing agreement and contract for this project.
                                                   </p>
                                                   <div className="flex gap-2">
                                                     <Button
                                                       variant="outline"
                                                       size="sm"
                                                       className="gap-1 h-7 text-xs border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20"
                                                       onClick={async (e) => {
                                                         e.stopPropagation();
                                                         try {
                                                           const { data: project, error } = await supabase
                                                             .from('projects')
                                                             .select('contract_url')
                                                             .eq('id', group.project_id)
                                                             .single();

                                                           if (error) throw error;

                                                           if (project?.contract_url) {
                                                             window.open(project.contract_url, '_blank');
                                                           } else {
                                                             toast.error('Contract not available for this project');
                                                           }
                                                         } catch (error) {
                                                           console.error('Error fetching contract:', error);
                                                           toast.error('Failed to load contract');
                                                         }
                                                       }}
                                                     >
                                                       <Eye className="h-3 w-3" />
                                                       View Contract
                                                     </Button>
                                                     <Button
                                                       variant="outline"
                                                       size="sm"
                                                       className="gap-1 h-7 text-xs border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20"
                                                       onClick={async (e) => {
                                                         e.stopPropagation();
                                                         try {
                                                           const { data: project, error } = await supabase
                                                             .from('projects')
                                                             .select('contract_url')
                                                             .eq('id', group.project_id)
                                                             .single();

                                                           if (error) throw error;

                                                           if (project?.contract_url) {
                                                             const link = document.createElement('a');
                                                             link.href = project.contract_url;
                                                             link.download = `contract-${group.project_id}.pdf`;
                                                             document.body.appendChild(link);
                                                             link.click();
                                                             document.body.removeChild(link);
                                                           } else {
                                                             toast.error('Contract not available for this project');
                                                           }
                                                         } catch (error) {
                                                           console.error('Error downloading contract:', error);
                                                           toast.error('Failed to download contract');
                                                         }
                                                       }}
                                                     >
                                                       <Download className="h-3 w-3" />
                                                       Download Contract
                                                     </Button>
                                                   </div>
                                                 </div>
                                               )}

                                               {/* Files Grid */}
                                               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                                 {group.allFiles.map((file) => {
                                                   const fileType = file.name.toLowerCase().includes('.mp3') || file.name.toLowerCase().includes('.wav') || file.name.toLowerCase().includes('.flac') ? 'audio' :
                                                                    file.name.toLowerCase().includes('.jpg') || file.name.toLowerCase().includes('.png') || file.name.toLowerCase().includes('.gif') ? 'image' :
                                                                    file.name.toLowerCase().includes('.mp4') || file.name.toLowerCase().includes('.avi') || file.name.toLowerCase().includes('.mov') ? 'video' :
                                                                    file.name.toLowerCase().includes('.pdf') ? 'pdf' : 'file';
                                                   return (
                                                     <div
                                                       key={file.id}
                                                       className="border rounded-lg p-3 hover:bg-muted/50 transition-all duration-200 cursor-pointer flex flex-col overflow-hidden"
                                                     >
                                                       <div className="flex items-center justify-between mb-2">
                                                         <div className="flex items-center gap-2 max-w-[80%]">
                                                           <div className="flex-shrink-0">
                                                             {getFileIcon(fileType)}
                                                           </div>
                                                           <span className="font-medium truncate text-sm" title={file.name}>{file.name}</span>
                                                         </div>
                                                       </div>
                                                       <div className="mt-2 flex-1 flex flex-col">
                                                         {fileType === 'audio' && (
                                                           <div className="bg-muted/50 rounded-md h-16 flex items-center justify-center mb-2">
                                                             <Music className="h-6 w-6 text-primary/50" />
                                                           </div>
                                                         )}
                                                         {fileType === 'image' && (
                                                           <div className="bg-muted/50 rounded-md h-16 flex items-center justify-center mb-2">
                                                             <Image className="h-6 w-6 text-green-500/50" />
                                                           </div>
                                                         )}
                                                         {fileType === 'video' && (
                                                           <div className="bg-muted/50 rounded-md h-16 flex items-center justify-center mb-2">
                                                             <Video className="h-6 w-6 text-red-500/50" />
                                                           </div>
                                                         )}
                                                         {(fileType !== 'audio' && fileType !== 'image' && fileType !== 'video') && (
                                                           <div className="bg-muted/50 rounded-md h-16 flex items-center justify-center mb-2">
                                                             <File className="h-6 w-6 text-muted-foreground/50" />
                                                           </div>
                                                         )}
                                                         <div className="text-xs text-muted-foreground mt-auto space-y-1">
                                                           <div className="flex justify-between">
                                                             <span>Format:</span>
                                                             <span>{getFileFormat(file.name)}</span>
                                                           </div>
                                                           {file.size && (
                                                             <div className="flex justify-between">
                                                               <span>Size:</span>
                                                               <span>{formatFileSize(file.size)}</span>
                                                             </div>
                                                           )}
                                                         </div>
                                                       </div>
                                                       <div className="flex gap-1 mt-2">
                                                         <Button
                                                           variant="ghost"
                                                           size="sm"
                                                           className="flex-1 h-6 text-xs"
                                                           onClick={(e) => {
                                                             e.stopPropagation();
                                                             handleViewAttachment({
                                                               url: file.url,
                                                               name: file.name
                                                             });
                                                           }}
                                                         >
                                                           <Eye className="h-3 w-3 mr-1" />
                                                           View
                                                         </Button>
                                                         <Button
                                                           variant="ghost"
                                                           size="sm"
                                                           className="flex-1 h-6 text-xs"
                                                           onClick={(e) => {
                                                             e.stopPropagation();
                                                             window.open(file.url, '_blank');
                                                           }}
                                                         >
                                                           <Download className="h-3 w-3 mr-1" />
                                                           Download
                                                         </Button>
                                                       </div>
                                                     </div>
                                                   );
                                                 })}
                                               </div>

                                               {/* Show individual item titles if multiple items in group */}
                                               {group.items.length > 1 && (
                                                 <div className="mt-4 pt-3 border-t">
                                                   <p className="text-xs text-muted-foreground mb-2">Items in this project:</p>
                                                   <div className="flex flex-wrap gap-1">
                                                     {group.items.map((item) => (
                                                       <Badge key={item.id} variant="secondary" className="text-xs">
                                                         {item.title}
                                                       </Badge>
                                                     ))}
                                                   </div>
                                                 </div>
                                               )}
                                             </div>
                                           ));
                                         })()}
                                       </div>
                                     </div>


                                    {/* Actions */}
                                    <div className="flex justify-end gap-2 mt-4">
                                      <Button variant="outline" size="sm" className="gap-2">
                                        <Download className="h-4 w-4" />
                                        Invoice
                                      </Button>
                                      <Button
                                        size="sm"
                                        className="gap-2"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigate('/dashboard/orders');
                                        }}
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                        View in Dashboard
                                      </Button>
                                    </div>
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
        </div>
      </div>

      {/* View Attachment Dialog */}
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
                      <FileText className="h-16 w-16 text-primary/50" />
                    </div>
                    <audio controls className="w-full">
                      <source src={selectedAttachment?.url} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                ) : selectedAttachment?.name.endsWith('.zip') ? (
                  <div className="text-center">
                    <Package className="h-16 w-16 mx-auto text-primary/50 mb-4" />
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
