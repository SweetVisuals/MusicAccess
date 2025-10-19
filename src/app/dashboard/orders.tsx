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
  File,
  Folder,
  ChevronRight,
  ChevronDown,
  MoreHorizontal
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
import { useNavigate, useLocation } from "react-router-dom";
import { downloadInvoice, generateInvoicePDF } from "@/lib/invoice-generator";
import { ContractDetailsDialog, MyDocument } from "@/components/dashboard/contracts/ContractDetailsDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

const getFormatFromExtension = (extension: string): string => {
  const formatMap: { [key: string]: string } = {
    'mp3': 'MP3', 'wav': 'WAV', 'flac': 'FLAC', 'aac': 'AAC', 'ogg': 'OGG',
    'wma': 'WMA', 'm4a': 'M4A', 'aiff': 'AIFF', 'au': 'AU', 'ra': 'RA',
    'mp4': 'MP4', 'avi': 'AVI', 'mov': 'MOV', 'wmv': 'WMV', 'flv': 'FLV',
    'webm': 'WEBM', 'mkv': 'MKV', 'jpg': 'JPG', 'jpeg': 'JPEG', 'png': 'PNG',
    'gif': 'GIF', 'bmp': 'BMP', 'tiff': 'TIFF', 'webp': 'WEBP', 'svg': 'SVG',
    'pdf': 'PDF', 'doc': 'DOC', 'docx': 'DOCX', 'txt': 'TXT', 'rtf': 'RTF',
    'odt': 'ODT', 'zip': 'ZIP', 'rar': 'RAR', '7z': '7Z', 'tar': 'TAR', 'gz': 'GZ',
    'stems': 'STEMS'
  };
  return formatMap[extension.toLowerCase()] || extension.toUpperCase();
};

const getFileFormat = (fileName: string): string => {
  if (fileName && fileName.includes('.')) {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (extension) {
      return getFormatFromExtension(extension);
    }
  }
  return 'Unknown';
};

const getDisplayName = (fileName: string): string => {
  if (fileName && fileName.includes('.')) {
    // Remove the extension from the display name
    return fileName.substring(0, fileName.lastIndexOf('.'));
  }
  return fileName;
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
  project_id?: string;
  track_id?: string;
  download_url?: string;
  file_name?: string;
  files?: OrderFile[];
  selected_file_types?: string[];
}

interface Contract {
  id: string;
  title: string;
  type: 'service' | 'audio';
  status: 'draft' | 'pending' | 'active' | 'expired';
  created_at: string;
  expires_at?: string;
  royalty_split?: number;
  revenue_split?: number;
  split_notes?: string;
  terms_conditions?: string;
  distribution_platforms?: string;
  distribution_territories?: string;
  distribution_notes?: string;
  publisher_name?: string;
  pro_affiliation?: string;
  publishing_notes?: string;
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
   contracts?: Contract[];
   archived?: boolean;
}

const downloadFile = async (fileUrl: string, fileName: string) => {
  try {
    // For Supabase storage public URLs, we can create a direct download link
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank'; // Open in new tab as fallback
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
};

export default function OrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAttachmentDialog, setShowAttachmentDialog] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<{url: string, name: string} | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [retryCount, setRetryCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [isContractDetailsOpen, setIsContractDetailsOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  // Check for refresh parameter to force refetch after checkout
  useEffect(() => {
    if (location.search.includes('refresh=true')) {
      setRefreshKey(prev => prev + 1);
      // Clean up the URL by removing the refresh parameter
      const newUrl = location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [location]);

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
          setOrders([]);
          setFilteredOrders([]);
        } else {
          // Filter out placeholder/demo orders
          const realOrders = data.filter((order: any) =>
            !['ORD-001', 'ORD-002', 'ORD-003'].includes(order.id)
          );

          // Map fetched data to the Order interface structure
          const fetchedOrders: Order[] = await Promise.all(realOrders.map(async (order: any) => {
            const orderItems = order.items || [];
            const projectIds = orderItems
              .map((item: any) => item.project_id)
              .filter((id: string) => id);

            // Fetch contracts for projects in this order
             let contracts: Contract[] = [];
             if (projectIds.length > 0) {
               // Get contracts from projects table (contract_url)
               const { data: projectsData, error: projectsError } = await supabase
                 .from('projects')
                 .select('id, title, contract_url')
                 .in('id', projectIds);

               if (!projectsError && projectsData) {
                 contracts = projectsData
                   .filter((project: any) => project.contract_url)
                   .map((project: any) => ({
                     id: `contract-${project.id}`,
                     title: `${project.title} Contract`,
                     type: 'audio' as const,
                     status: 'active' as const,
                     created_at: new Date().toISOString(),
                     expires_at: undefined,
                     royalty_split: undefined,
                     revenue_split: undefined,
                     split_notes: undefined,
                     terms_conditions: undefined,
                     distribution_platforms: undefined,
                     distribution_territories: undefined,
                     distribution_notes: undefined,
                     publisher_name: undefined,
                     pro_affiliation: undefined,
                     publishing_notes: undefined
                   }));
               }
             }

            // Populate download URLs and files for order items
            const itemsWithUrls = await Promise.all(orderItems.map(async (item: any) => {
              console.log('Processing order item:', item.title, 'type:', item.type, 'track_id:', item.track_id);
              let download_url = item.download_url;
              let file_name = item.file_name;
              let files: OrderFile[] = [];

               // If it's a project, get all project files
               if (item.type === 'project' && item.project_id) {
                 const { data: projectFiles } = await supabase
                   .from('project_files')
                   .select(`
                     id,
                     file_id,
                     files (
                       id,
                       file_url,
                       name,
                       size,
                       created_at
                     )
                   `)
                   .eq('project_id', item.project_id);

                 if (projectFiles && projectFiles.length > 0) {
                   // Get the files from the joined data
                   let allFiles: any[] = [];
                   projectFiles.forEach(pf => {
                     if (pf.files) {
                       allFiles.push(pf.files);
                     }
                   });

                   // Deduplicate files by ID first, then map
                   const uniqueFiles = allFiles.filter((file, index, self) =>
                     index === self.findIndex(f => f.id === file.id)
                   );

                   files = uniqueFiles.map((file: any, index: number) => {
                     // Generate proper public URL using Supabase client
                     const filePath = file.file_url.split('/audio_files/')[1];
                     const publicUrl = supabase.storage.from('audio_files').getPublicUrl(filePath).data.publicUrl;

                     return {
                       id: file.id || `file-${item.id}-${index}-${Date.now()}`,
                       name: file.name,
                       url: publicUrl,
                       type: file.name.split('.').pop() || 'file',
                       size: file.size,
                       created_at: file.created_at
                     };
                   });

                   // Set primary download URL to first file
                   if (files.length > 0) {
                     download_url = files[0].url;
                     file_name = files[0].name;
                   }
                 }
               }
               // If it's a track, get the file directly (track_id is actually file_id)
               else if (item.type === 'track' && item.track_id) {
                 console.log('Processing track item:', item.title, 'track_id:', item.track_id, 'selected_file_types:', item.selected_file_types);
                 try {
                   // Special handling for "FOR YOU GROUP" - create virtual files based on selected_file_types
                   if (item.title === 'FOR YOU GROUP' && item.track_id === '8c877e4a-8a60-4a4d-a0e8-e20599fd3e51') {
                     console.log('Processing FOR YOU GROUP with selected_file_types:', item.selected_file_types);

                     // Create virtual files based on selected_file_types (remove duplicates)
                       const selectedTypes: string[] = (item.selected_file_types && item.selected_file_types.length > 0)
                         ? [...new Set(item.selected_file_types as string[])] // Remove duplicates
                         : ['mp3'];
                       files = selectedTypes.map((type: string, index: number) => {
                         const extension = type.toLowerCase();
                         const formatName = extension.toUpperCase();
                         // Generate a placeholder URL that indicates files are being prepared
                         const placeholderUrl = `placeholder://for-you-group-${item.track_id}-${extension}`;
                         return {
                           id: `virtual-${item.id}-${type}-${index}`,
                           name: `FOR YOU GROUP.${extension}`,
                           url: placeholderUrl,
                           type: extension,
                           size: undefined,
                           created_at: new Date().toISOString()
                         };
                       });

                     console.log('Created virtual files for FOR YOU GROUP:', files);
                   } else {
                     // Handle multiple selected file types for individual tracks
                     const selectedTypes: string[] = (item.selected_file_types && item.selected_file_types.length > 0)
                       ? [...new Set(item.selected_file_types as string[])] // Remove duplicates
                       : ['mp3'];

                     // Get the base file data
                     const { data: fileData, error } = await supabase
                       .from('files')
                       .select('file_url, name, size, created_at')
                       .eq('id', item.track_id)
                       .single();

                     console.log('File data result for', item.title, ':', { fileData, error });

                     if (fileData) {
                       // Create files for each selected type
                       files = selectedTypes.map((type: string, index: number) => {
                         const extension = type.toLowerCase();
                         const baseName = fileData.name.replace(/\.[^/.]+$/, ""); // Remove extension
                         const fileName = `${baseName}.${extension}`;

                         // Generate proper public URL using Supabase client
                         const filePath = fileData.file_url.split('/audio_files/')[1];
                         const publicUrl = supabase.storage.from('audio_files').getPublicUrl(filePath).data.publicUrl;

                         return {
                           id: `file-${item.track_id}-${type}-${Date.now()}-${index}`, // Generate unique ID
                           name: fileName,
                           url: publicUrl,
                           type: extension,
                           size: fileData.size,
                           created_at: fileData.created_at
                         };
                       });

                       // Set primary download URL to first file
                       if (files.length > 0) {
                         download_url = files[0].url;
                         file_name = files[0].name;
                       }
                       console.log('Files loaded successfully for', item.title, ':', files);
                     } else {
                       // File not found - create virtual files for each selected type
                       files = selectedTypes.map((type: string, index: number) => {
                         const extension = type.toLowerCase();
                         const virtualName = item.file_name ? item.file_name.replace(/\.[^/.]+$/, `.${extension}`) : `${item.title}.${extension}`;
                         return {
                           id: `virtual-${item.id}-${type}-${index}`,
                           name: virtualName,
                           url: `placeholder://track-${item.track_id}-${extension}`,
                           type: extension,
                           size: undefined,
                           created_at: new Date().toISOString()
                         };
                       });

                       // Set primary download URL to first virtual file
                       if (files.length > 0) {
                         download_url = files[0].url;
                         file_name = files[0].name;
                       }
                       console.log('Created virtual files for track_id:', item.track_id, 'title:', item.title, 'files:', files);
                     }
                   }
                 } catch (error) {
                   console.error('Error fetching file for item:', item.id, error);
                   files = [];
                 }
               }
               // Handle track groups (folders) - these contain multiple files
               else if (item.type === 'track' && item.selected_file_types && item.selected_file_types.length > 1) {
                 console.log('Processing track group item:', item.title, 'track_id:', item.track_id, 'selected_file_types:', item.selected_file_types);

                 // This is a track group - create files for each selected variant
                 const selectedTypes: string[] = [...new Set(item.selected_file_types as string[])];

                 try {
                   // Get the base file data for the track
                   const { data: fileData, error } = await supabase
                     .from('files')
                     .select('file_url, name, size, created_at')
                     .eq('id', item.track_id)
                     .single();

                   if (fileData) {
                     // Create files for each selected type in the group
                     files = selectedTypes.map((type: string, index: number) => {
                       const extension = type.toLowerCase();
                       const baseName = fileData.name.replace(/\.[^/.]+$/, ""); // Remove extension
                       const fileName = `${baseName}.${extension}`;

                       // Generate proper public URL using Supabase client
                       const filePath = fileData.file_url.split('/audio_files/')[1];
                       const publicUrl = supabase.storage.from('audio_files').getPublicUrl(filePath).data.publicUrl;

                       return {
                         id: `group-file-${item.track_id}-${type}-${Date.now()}-${index}`,
                         name: fileName,
                         url: publicUrl,
                         type: extension,
                         size: fileData.size,
                         created_at: fileData.created_at
                       };
                     });

                     // Set primary download URL to first file
                     if (files.length > 0) {
                       download_url = files[0].url;
                       file_name = files[0].name;
                     }
                     console.log('Created track group files for', item.title, ':', files);
                   } else {
                     // Create virtual files for track group
                     files = selectedTypes.map((type: string, index: number) => {
                       const extension = type.toLowerCase();
                       const virtualName = `${item.title}.${extension}`;
                       return {
                         id: `virtual-group-${item.id}-${type}-${index}`,
                         name: virtualName,
                         url: `placeholder://track-group-${item.track_id}-${extension}`,
                         type: extension,
                         size: undefined,
                         created_at: new Date().toISOString()
                       };
                     });

                     if (files.length > 0) {
                       download_url = files[0].url;
                       file_name = files[0].name;
                     }
                     console.log('Created virtual track group files for', item.title, ':', files);
                   }
                 } catch (error) {
                   console.error('Error fetching files for track group:', item.id, error);
                   files = [];
                 }
               }

               return {
                 ...item,
                 download_url,
                 file_name,
                 files
               };
             }));

            return {
               id: order.id,
               date: order.order_date,
               status: order.status,
               total: order.total,
               items: itemsWithUrls,
               processingFee: order.processing_fee || 0,
               tax: order.tax || 0,
               attachmentUrl: order.attachment_url,
               attachmentName: order.attachment_name,
               contracts,
               archived: order.archived || false,
             };
          }));

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
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast.error("An unexpected error occurred while fetching orders.");
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchOrders();
    } else {
      // For guest users, show empty orders
      setOrders([]);
      setFilteredOrders([]);
      setIsLoading(false);
    }
  }, [user, retryCount, refreshKey, location.pathname]);

  useEffect(() => {
    // Apply filters when search query, status filter, or archive filter changes
    let filtered = [...orders];

    // Apply archive filter - show archived orders only when showArchived is true
    if (!showArchived) {
      filtered = filtered.filter(order => !order.archived);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(query) ||
        getOrderDisplayId(order).toLowerCase().includes(query) ||
        order.items.some(item => item.title.toLowerCase().includes(query))
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  }, [orders, searchQuery, statusFilter, showArchived]);

  const handleViewAttachment = (attachment: {url: string, name: string}) => {
    setSelectedAttachment(attachment);
    setShowAttachmentDialog(true);
  };

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrder(prevId => prevId === orderId ? null : orderId);
  };

  const toggleItemExpansion = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleDownloadInvoice = async (order: Order) => {
    try {
      await downloadInvoice(order);
      toast.success("Invoice downloaded successfully!");
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast.error("Failed to download invoice. Please try again.");
    }
  };

  const handleArchiveOrder = async (orderId: string, archive: boolean) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ archived: archive })
        .eq('id', orderId)
        .eq('user_id', user?.id);

      if (error) throw error;

      // Update local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, archived: archive } : order
        )
      );

      toast.success(archive ? "Order archived successfully!" : "Order unarchived successfully!");
    } catch (error) {
      console.error("Error updating order archive status:", error);
      toast.error("Failed to update order status. Please try again.");
    }
  };

  const getOrderDisplayId = (order: Order): string => {
    if (order.items.length === 0) return order.id;

    const firstItem = order.items[0];
    const itemTitle = firstItem.title;

    // Extract key information for display
    const creators = order.items
      .map(item => {
        // Try to extract creator from title or use generic
        if (item.title.includes(' - ')) {
          return item.title.split(' - ')[0];
        }
        return 'Creator';
      })
      .filter((creator, index, self) => self.indexOf(creator) === index) // Remove duplicates
      .slice(0, 2); // Limit to 2 creators

    const fileTypes = order.items
      .flatMap(item => item.selected_file_types || [])
      .filter((type, index, self) => self.indexOf(type) === index) // Remove duplicates
      .slice(0, 3); // Limit to 3 file types

    const parts = [];
    if (creators.length > 0 && creators[0] !== 'Creator') {
      parts.push(creators.join(', '));
    }
    if (fileTypes.length > 0) {
      parts.push(fileTypes.join('/').toUpperCase());
    }
    if (order.items.length > 1) {
      parts.push(`${order.items.length} items`);
    }

    return parts.length > 0 ? parts.join(' • ') : order.id;
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
            <Button
              variant={showArchived ? "default" : "outline"}
              size="sm"
              onClick={() => setShowArchived(!showArchived)}
              className="gap-2"
            >
              <Folder className="h-4 w-4" />
              {showArchived ? "Hide Archived" : "Show Archived"}
            </Button>
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
                <h3 className="text-lg font-medium">No orders</h3>
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
                          className={`cursor-pointer ${order.archived ? 'opacity-60 bg-muted/20' : ''}`}
                          onClick={() => toggleOrderExpansion(order.id)}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {order.archived && <Folder className="h-4 w-4 text-muted-foreground" />}
                              <div>
                                <div className="font-medium">{order.id}</div>
                                <div className="text-xs text-muted-foreground truncate max-w-[200px]" title={getOrderDisplayId(order)}>
                                  {getOrderDisplayId(order)}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {order.items.length === 1
                              ? order.items[0].title
                              : `${order.items.length} items`}
                          </TableCell>
                          <TableCell>${order.total.toFixed(2)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(order.status)}
                              {order.archived && (
                                <Badge variant="outline" className="text-xs">Archived</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" className="gap-1">
                                {expandedOrder === order.id ? "Hide" : "View"} Details
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleArchiveOrder(order.id, !order.archived);
                                    }}
                                  >
                                    <Folder className="h-4 w-4 mr-2" />
                                    {order.archived ? "Unarchive" : "Archive"} Order
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownloadInvoice(order);
                                    }}
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download Invoice
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
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
                                           {order.archived && (
                                             <Badge variant="outline" className="text-xs">Archived</Badge>
                                           )}
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
                                        <span>${(order.total - (order.processingFee || 0) - (order.tax || 0)).toFixed(2)}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">Processing Fee:</span>
                                        <span>${(order.processingFee || 0).toFixed(2)}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">Tax:</span>
                                        <span>${(order.tax || 0).toFixed(2)}</span>
                                      </div>
                                      <div className="flex items-center gap-2 font-bold">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <span>Total:</span>
                                        <span>${order.total.toFixed(2)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Purchased Files - File Browser Style */}
                                <div className="border rounded-lg overflow-hidden">
                                  {/* File Browser Header */}
                                  <div className="p-4 border-b bg-muted/20">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Package className="h-4 w-4" />
                                        <h4 className="font-medium">Purchased Files</h4>
                                        <Badge variant="outline" className="text-xs">
                                          {order.items.reduce((total, item) => total + (item.files?.length || 0), 0)} files
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>

                                  {/* File Browser Content */}
                                  <div className="p-4">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                      {/* Folders Column */}
                                      <div className="space-y-4">
                                        <div className="flex items-center gap-2 pb-2 border-b">
                                          <Folder className="h-4 w-4 text-blue-600" />
                                          <h4 className="font-medium">Folders</h4>
                                          <Badge variant="outline" className="text-xs">
                                            {order.items.filter(item => item.type === 'project').length + order.items.filter(item => item.type === 'track' && item.selected_file_types && item.selected_file_types.length > 1).length} folder{order.items.filter(item => item.type === 'project').length + order.items.filter(item => item.type === 'track' && item.selected_file_types && item.selected_file_types.length > 1).length !== 1 ? 's' : ''}
                                          </Badge>
                                        </div>

                                        <div className="space-y-3">
                                          {/* Project folders */}
                                          {order.items.filter(item => item.type === 'project').map((item) => {
                                            // If no files but has download_url, create a virtual file
                                            let displayFiles = item.files || [];
                                            if (displayFiles.length === 0 && item.download_url && item.file_name) {
                                              displayFiles = [{
                                                id: `virtual-${item.id}`,
                                                name: item.file_name,
                                                url: item.download_url,
                                                type: item.file_name.split('.').pop() || 'file',
                                                size: undefined,
                                                created_at: undefined
                                              }];
                                            }

                                            const totalFiles = displayFiles.length;
                                            const isExpanded = expandedItems.has(item.id);

                                            return (
                                              <div key={item.id} className="space-y-2">
                                                {/* Project Folder */}
                                                <div
                                                  className="p-3 border rounded-lg transition-all duration-200 flex items-center gap-3 cursor-pointer hover:shadow-md hover:bg-primary/5"
                                                  onClick={() => toggleItemExpansion(item.id)}
                                                >
                                                  <div className="p-2 bg-blue-100 rounded-md">
                                                    <Folder className="h-4 w-4 text-blue-600" />
                                                  </div>
                                                  <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">{item.title}</p>
                                                    <p className="text-xs text-muted-foreground">{totalFiles} file{totalFiles !== 1 ? 's' : ''}</p>
                                                  </div>
                                                  {isExpanded ? (
                                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                  ) : (
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                  )}
                                                </div>

                                                {/* Files in this project when expanded */}
                                                {isExpanded && displayFiles.map((file) => {
                                                  const fileType = file.name.toLowerCase().includes('.mp3') || file.name.toLowerCase().includes('.wav') || file.name.toLowerCase().includes('.flac') ? 'audio' :
                                                                   file.name.toLowerCase().includes('.jpg') || file.name.toLowerCase().includes('.png') || file.name.toLowerCase().includes('.gif') ? 'image' :
                                                                   file.name.toLowerCase().includes('.mp4') || file.name.toLowerCase().includes('.avi') || file.name.toLowerCase().includes('.mov') ? 'video' :
                                                                   file.name.toLowerCase().includes('.pdf') ? 'pdf' : 'file';

                                                  return (
                                                    <div
                                                      key={file.id}
                                                      className="ml-6 p-3 border rounded-lg transition-all duration-200 flex items-center gap-3 cursor-pointer hover:shadow-md hover:bg-primary/5"
                                                    >
                                                      <div className="p-2 bg-primary/10 rounded-md">
                                                        {getFileIcon(fileType)}
                                                      </div>
                                                      <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1">
                                                          <p className="font-medium truncate">{file.name}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                          {file.size && <span>{formatFileSize(file.size)}</span>}
                                                          {file.size && file.created_at && <span>•</span>}
                                                          {file.created_at && <span>{new Date(file.created_at).toLocaleDateString()}</span>}
                                                        </div>
                                                      </div>

                                                      <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                          <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={(e) => e.stopPropagation()}
                                                          >
                                                            <MoreHorizontal className="h-4 w-4" />
                                                          </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                          <DropdownMenuItem onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (!file.url || file.url.startsWith('placeholder://')) {
                                                              toast.error("File not available - files are being prepared");
                                                              return;
                                                            }
                                                            handleViewAttachment({
                                                              url: file.url,
                                                              name: file.name
                                                            });
                                                          }}>
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            View
                                                          </DropdownMenuItem>
                                                          <DropdownMenuItem onClick={async (e) => {
                                                            e.stopPropagation();
                                                            if (!file.url || file.url.startsWith('placeholder://')) {
                                                              toast.error("File not available - files are being prepared. Contact support if this takes longer than 24 hours.");
                                                              return;
                                                            }
                                                            try {
                                                              await downloadFile(file.url, file.name);
                                                              toast.success("Download started!");
                                                            } catch (error) {
                                                              toast.error("Failed to download file");
                                                            }
                                                          }}>
                                                            <Download className="h-4 w-4 mr-2" />
                                                            Download
                                                          </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                      </DropdownMenu>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            );
                                          })}

                                          {/* Track group folders */}
                                          {order.items.filter(item => item.type === 'track' && item.selected_file_types && item.selected_file_types.length > 1).map((item) => {
                                            // If no files but has download_url, create a virtual file
                                            let displayFiles = item.files || [];
                                            if (displayFiles.length === 0 && item.download_url && item.file_name) {
                                              displayFiles = [{
                                                id: `virtual-${item.id}`,
                                                name: item.file_name,
                                                url: item.download_url,
                                                type: item.file_name.split('.').pop() || 'file',
                                                size: undefined,
                                                created_at: undefined
                                              }];
                                            }

                                            const totalFiles = displayFiles.length;
                                            const isExpanded = expandedItems.has(item.id);

                                            return (
                                              <div key={item.id} className="space-y-2">
                                                {/* Track Group Folder */}
                                                <div
                                                  className="p-3 border rounded-lg transition-all duration-200 flex items-center gap-3 cursor-pointer hover:shadow-md hover:bg-primary/5"
                                                  onClick={() => toggleItemExpansion(item.id)}
                                                >
                                                  <div className="p-2 bg-green-100 rounded-md">
                                                    <Folder className="h-4 w-4 text-green-600" />
                                                  </div>
                                                  <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">{item.title}</p>
                                                    <p className="text-xs text-muted-foreground">{totalFiles} file{totalFiles !== 1 ? 's' : ''}</p>
                                                  </div>
                                                  {isExpanded ? (
                                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                  ) : (
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                  )}
                                                </div>

                                                {/* Files in this track group when expanded */}
                                                {isExpanded && displayFiles.map((file) => {
                                                  const fileType = file.name.toLowerCase().includes('.mp3') || file.name.toLowerCase().includes('.wav') || file.name.toLowerCase().includes('.flac') ? 'audio' :
                                                                   file.name.toLowerCase().includes('.jpg') || file.name.toLowerCase().includes('.png') || file.name.toLowerCase().includes('.gif') ? 'image' :
                                                                   file.name.toLowerCase().includes('.mp4') || file.name.toLowerCase().includes('.avi') || file.name.toLowerCase().includes('.mov') ? 'video' :
                                                                   file.name.toLowerCase().includes('.pdf') ? 'pdf' : 'file';

                                                  return (
                                                    <div
                                                      key={file.id}
                                                      className="ml-6 p-3 border rounded-lg transition-all duration-200 flex items-center gap-3 cursor-pointer hover:shadow-md hover:bg-primary/5"
                                                    >
                                                      <div className="p-2 bg-primary/10 rounded-md">
                                                        {getFileIcon(fileType)}
                                                      </div>
                                                      <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1">
                                                          <p className="font-medium truncate">{file.name}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                          {file.size && <span>{formatFileSize(file.size)}</span>}
                                                          {file.size && file.created_at && <span>•</span>}
                                                          {file.created_at && <span>{new Date(file.created_at).toLocaleDateString()}</span>}
                                                        </div>
                                                      </div>

                                                      <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                          <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={(e) => e.stopPropagation()}
                                                          >
                                                            <MoreHorizontal className="h-4 w-4" />
                                                          </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                          <DropdownMenuItem onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (!file.url || file.url.startsWith('placeholder://')) {
                                                              toast.error("File not available - files are being prepared");
                                                              return;
                                                            }
                                                            handleViewAttachment({
                                                              url: file.url,
                                                              name: file.name
                                                            });
                                                          }}>
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            View
                                                          </DropdownMenuItem>
                                                          <DropdownMenuItem onClick={async (e) => {
                                                            e.stopPropagation();
                                                            if (!file.url || file.url.startsWith('placeholder://')) {
                                                              toast.error("File not available - files are being prepared. Contact support if this takes longer than 24 hours.");
                                                              return;
                                                            }
                                                            try {
                                                              await downloadFile(file.url, file.name);
                                                              toast.success("Download started!");
                                                            } catch (error) {
                                                              toast.error("Failed to download file");
                                                            }
                                                          }}>
                                                            <Download className="h-4 w-4 mr-2" />
                                                            Download
                                                          </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                      </DropdownMenu>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>

                                      {/* Files Column */}
                                      <div className="space-y-4">
                                        <div className="flex items-center gap-2 pb-2 border-b">
                                          <File className="h-4 w-4 text-gray-600" />
                                          <h4 className="font-medium">Individual Files</h4>
                                          <Badge variant="outline" className="text-xs">
                                            {order.items.filter(item => item.type === 'track' && (!item.selected_file_types || item.selected_file_types.length <= 1)).reduce((total, item) => total + (item.files?.length || 0), 0)} file{order.items.filter(item => item.type === 'track' && (!item.selected_file_types || item.selected_file_types.length <= 1)).reduce((total, item) => total + (item.files?.length || 0), 0) !== 1 ? 's' : ''}
                                          </Badge>
                                        </div>

                                        <div className="space-y-3">
                                          {/* Individual track files (single file tracks) */}
                                          {order.items.filter(item => item.type === 'track' && (!item.selected_file_types || item.selected_file_types.length <= 1)).flatMap(item => {
                                            // If no files but has download_url, create a virtual file
                                            let displayFiles = item.files || [];
                                            if (displayFiles.length === 0 && item.download_url && item.file_name) {
                                              displayFiles = [{
                                                id: `virtual-${item.id}`,
                                                name: item.file_name,
                                                url: item.download_url,
                                                type: item.file_name.split('.').pop() || 'file',
                                                size: undefined,
                                                created_at: undefined
                                              }];
                                            }

                                            return displayFiles.map(file => {
                                              const fileType = file.name.toLowerCase().includes('.mp3') || file.name.toLowerCase().includes('.wav') || file.name.toLowerCase().includes('.flac') ? 'audio' :
                                                               file.name.toLowerCase().includes('.jpg') || file.name.toLowerCase().includes('.png') || file.name.toLowerCase().includes('.gif') ? 'image' :
                                                               file.name.toLowerCase().includes('.mp4') || file.name.toLowerCase().includes('.avi') || file.name.toLowerCase().includes('.mov') ? 'video' :
                                                               file.name.toLowerCase().includes('.pdf') ? 'pdf' : 'file';

                                              return (
                                                <div
                                                  key={file.id}
                                                  className="p-3 border rounded-lg transition-all duration-200 flex items-center gap-3 cursor-pointer hover:shadow-md hover:bg-primary/5"
                                                >
                                                  <div className="p-2 bg-primary/10 rounded-md">
                                                    {getFileIcon(fileType)}
                                                  </div>
                                                  <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1">
                                                      <p className="font-medium truncate">{file.name}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                      <span>{item.title}</span>
                                                      {file.size && (
                                                        <>
                                                          <span>•</span>
                                                          <span>{formatFileSize(file.size)}</span>
                                                        </>
                                                      )}
                                                      {file.created_at && (
                                                        <>
                                                        <span>•</span>
                                                        <span>{new Date(file.created_at).toLocaleDateString()}</span>
                                                      </>
                                                    )}
                                                  </div>
                                                </div>

                                                <DropdownMenu>
                                                  <DropdownMenuTrigger asChild>
                                                    <Button
                                                      variant="ghost"
                                                      size="icon"
                                                      className="h-8 w-8"
                                                      onClick={(e) => e.stopPropagation()}
                                                    >
                                                      <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                  </DropdownMenuTrigger>
                                                  <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={(e) => {
                                                      e.stopPropagation();
                                                      if (!file.url || file.url.startsWith('placeholder://')) {
                                                        toast.error("File not available - files are being prepared");
                                                        return;
                                                      }
                                                      handleViewAttachment({
                                                        url: file.url,
                                                        name: file.name
                                                      });
                                                    }}>
                                                      <Eye className="h-4 w-4 mr-2" />
                                                      View
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={async (e) => {
                                                      e.stopPropagation();
                                                      if (!file.url || file.url.startsWith('placeholder://')) {
                                                        toast.error("File not available - files are being prepared. Contact support if this takes longer than 24 hours.");
                                                      return;
                                                    }
                                                    try {
                                                      await downloadFile(file.url, file.name);
                                                      toast.success("Download started!");
                                                    } catch (error) {
                                                      toast.error("Failed to download file");
                                                    }
                                                  }}>
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Download
                                                  </DropdownMenuItem>
                                                </DropdownMenuContent>
                                              </DropdownMenu>
                                            </div>
                                          );
                                        });
                                      })}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Contract Access */}
                                {true && (
                                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                                      <FileText className="h-4 w-4" />
                                      Contract & Legal Documents
                                      <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                        {(order.contracts || []).length} contract{(order.contracts || []).length !== 1 ? 's' : ''}
                                      </Badge>
                                    </h4>
                                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                                      Access the licensing agreements and contracts for your purchased content.
                                    </p>
                                    <div className="space-y-3">
                                      {(order.contracts || []).length > 0 ? (
                                        (order.contracts || []).map((contract, index) => (
                                        <div key={contract.id} className="flex items-center justify-between p-3 bg-white dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-700">
                                          <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">{contract.title}</span>
                                            <Badge variant="outline" className="text-xs">{contract.type}</Badge>
                                            <Badge className={`text-xs ${contract.status === 'active' ? 'bg-green-500/10 text-green-500' : contract.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-gray-500/10 text-gray-500'}`}>
                                              {contract.status}
                                            </Badge>
                                          </div>
                                          <div className="flex gap-2">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="gap-1 border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20"
                                              onClick={async (e) => {
                                                e.stopPropagation();
                                                try {
                                                  // Get contract URL from projects table
                                                  const projectItem = order.items.find(item => item.project_id);
                                                  if (projectItem?.project_id) {
                                                    const { data: project, error } = await supabase
                                                      .from('projects')
                                                      .select('contract_url')
                                                      .eq('id', projectItem.project_id)
                                                      .single();

                                                    if (error) throw error;

                                                    if (project?.contract_url) {
                                                      window.open(project.contract_url, '_blank');
                                                    } else {
                                                      toast.error('Contract not available for this order');
                                                    }
                                                  }
                                                } catch (error) {
                                                  console.error('Error fetching contract:', error);
                                                  toast.error('Failed to load contract');
                                                }
                                              }}
                                            >
                                              <Eye className="h-3 w-3" />
                                              View
                                            </Button>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="gap-1 border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20"
                                              onClick={async (e) => {
                                                e.stopPropagation();
                                                try {
                                                  // Get contract URL from projects table
                                                  const projectItem = order.items.find(item => item.project_id);
                                                  if (projectItem?.project_id) {
                                                    const { data: project, error } = await supabase
                                                      .from('projects')
                                                      .select('contract_url')
                                                      .eq('id', projectItem.project_id)
                                                      .single();

                                                    if (error) throw error;

                                                    if (project?.contract_url) {
                                                      // Create a temporary link to download the contract
                                                      const link = document.createElement('a');
                                                      link.href = project.contract_url;
                                                      link.download = `contract-${order.id}.pdf`; // Assuming PDF, adjust if needed
                                                      document.body.appendChild(link);
                                                      link.click();
                                                      document.body.removeChild(link);
                                                    } else {
                                                      toast.error('Contract not available for this order');
                                                    }
                                                  }
                                                } catch (error) {
                                                  console.error('Error downloading contract:', error);
                                                  toast.error('Failed to download contract');
                                                }
                                              }}
                                            >
                                              <Download className="h-3 w-3" />
                                              Download
                                            </Button>
                                          </div>
                                        </div>
                                      ))) : (
                                        <div className="text-center py-4">
                                          <FileText className="h-8 w-8 mx-auto text-blue-400 mb-2" />
                                          <p className="text-sm text-blue-600 dark:text-blue-400">
                                            No contracts available for this order
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Actions */}
                                <div className="flex justify-end gap-2 mt-4">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // For viewing, we'll open the PDF in a new tab
                                      const viewInvoice = async () => {
                                        try {
                                          const blob = await generateInvoicePDF(order);
                                          const url = URL.createObjectURL(blob);
                                          window.open(url, '_blank');
                                        } catch (error) {
                                          console.error('Error viewing invoice:', error);
                                          toast.error("Failed to view invoice. Please try again.");
                                        }
                                      };
                                      viewInvoice();
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                    View Invoice
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownloadInvoice(order);
                                    }}
                                  >
                                    <Download className="h-4 w-4" />
                                    Download Invoice
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

      {/* Contract Details Dialog */}
      <ContractDetailsDialog
        isOpen={isContractDetailsOpen}
        onClose={() => {
          setIsContractDetailsOpen(false);
          setSelectedContract(null);
        }}
        contract={selectedContract}
        onEdit={() => {}} // Read-only in orders page
        onStatusChange={() => {}} // Read-only in orders page
      />
    </div>
  );
}
