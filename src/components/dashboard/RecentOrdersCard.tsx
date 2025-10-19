import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/@/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/@/ui/avatar"
import { 
  ShoppingCart, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  MoreVertical,
  Download,
  Eye,
  MessageSquare
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/@/ui/dropdown-menu"
import { Loader2 } from 'lucide-react'

interface RecentOrder {
  id: string
  date: string
  status: 'completed' | 'pending' | 'failed' | 'processing' | 'unconfirmed'
  total: number
  items: Array<{
    name: string
    quantity: number
    price: number
    type: 'project' | 'file' | 'soundpack' | 'track_group'
  }>
  processingFee: number
  tax: number
  customer_name: string
  customer_avatar?: string
  customer_email?: string
  due_date?: string
  delivery_status: 'not_started' | 'in_progress' | 'delivered' | 'overdue'
}

interface RecentOrdersCardProps {
  orders: RecentOrder[]
  isLoading: boolean
  onViewOrder: (order: RecentOrder) => void
  onDownloadOrder: (order: RecentOrder) => void
}

export default function RecentOrdersCard({ orders, isLoading, onViewOrder, onDownloadOrder }: RecentOrdersCardProps) {
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
      case 'unconfirmed':
        return <Badge className="bg-gray-500/10 text-gray-500">Unconfirmed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getDeliveryBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge className="bg-green-500/10 text-green-500"><CheckCircle className="h-3 w-3 mr-1" />Delivered</Badge>
      case 'in_progress':
        return <Badge className="bg-blue-500/10 text-blue-500"><Clock className="h-3 w-3 mr-1" />In Progress</Badge>
      case 'overdue':
        return <Badge className="bg-red-500/10 text-red-500"><AlertTriangle className="h-3 w-3 mr-1" />Overdue</Badge>
      case 'not_started':
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Not Started</Badge>
    }
  }

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const getItemTypeIcon = (type: string) => {
    switch (type) {
      case 'project':
        return <div className="w-2 h-2 rounded-full bg-blue-500" />
      case 'file':
        return <div className="w-2 h-2 rounded-full bg-green-500" />
      case 'soundpack':
        return <div className="w-2 h-2 rounded-full bg-purple-500" />
      case 'track_group':
        return <div className="w-2 h-2 rounded-full bg-orange-500" />
      default:
        return <div className="w-2 h-2 rounded-full bg-gray-500" />
    }
  }

  const getItemTypeLabel = (type: string) => {
    switch (type) {
      case 'project':
        return 'Project'
      case 'file':
        return 'File'
      case 'soundpack':
        return 'Soundpack'
      case 'track_group':
        return 'Track Group'
      default:
        return type
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Recent Orders
          </CardTitle>
          <CardDescription>Latest orders across projects, files, and soundpacks</CardDescription>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          View All
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[200px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="h-[200px] flex flex-col items-center justify-center text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Recent Orders</h3>
            <p className="text-muted-foreground">Orders will appear here as they come in.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4 flex-1">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={order.customer_avatar} />
                    <AvatarFallback>{order.customer_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{order.customer_name}</span>
                      {getStatusBadge(order.status)}
                      {getDeliveryBadge(order.delivery_status)}
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      <span>{new Date(order.date).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{formatCurrency(order.total)}</span>
                      {order.due_date && (
                        <>
                          <span>•</span>
                          <span className={
                            getDaysUntilDue(order.due_date) < 0 
                              ? 'text-red-500' 
                              : getDaysUntilDue(order.due_date) <= 3 
                                ? 'text-yellow-500' 
                                : 'text-green-500'
                          }>
                            {getDaysUntilDue(order.due_date) < 0 
                              ? `${Math.abs(getDaysUntilDue(order.due_date))}d overdue`
                              : `${getDaysUntilDue(order.due_date)}d left`
                            }
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {order.items.slice(0, 3).map((item, index) => (
                        <div key={index} className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
                          {getItemTypeIcon(item.type)}
                          <span>{getItemTypeLabel(item.type)}</span>
                          <span className="text-muted-foreground">({item.quantity})</span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">
                          +{order.items.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewOrder(order)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message Client
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDownloadOrder(order)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download Files
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}