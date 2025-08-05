import React, { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/@/ui/badge"
import { Loader2, Check, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/@/ui/select"
import { Checkbox } from "@/components/@/ui/checkbox"
import { CreateServiceDialog } from "@/components/dashboard/services/CreateServiceDialog"

interface Service {
  id: string
  title: string
  type: string
  description: string
  price: number | null
  delivery_time: string | null
  revisions: number | null
  is_featured: boolean
  is_active: boolean
  created_at: string
  user_id: string
  is_set_price: boolean // Changed to boolean, assuming NOT NULL in DB with default
}

export default function ServicesPage() {
  const { user } = useAuth()
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    active: 0
  })

  // Fetch user's services
  useEffect(() => {
    if (user) {
      fetchServices()
    }
  }, [user])

  const fetchServices = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      setServices(data || [])
      
      // Calculate stats
      const total = data?.length || 0
      const active = data?.filter(service => service.is_active).length || 0
      setStats({ total, active })
    } catch (error) {
      console.error('Error fetching services:', error)
      toast.error('Failed to load services')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleServiceStatus = async (serviceId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: !isActive })
        .eq('id', serviceId)
      
      if (error) throw error
      
      // Update local state
      setServices(prev => 
        prev.map(service => 
          service.id === serviceId 
            ? { ...service, is_active: !isActive } 
            : service
        )
      )
      
      // Update stats
      setStats(prev => ({
        ...prev,
        active: isActive 
          ? prev.active - 1 
          : prev.active + 1
      }))
      
      toast.success(`Service ${isActive ? 'deactivated' : 'activated'}`)
    } catch (error) {
      console.error('Error toggling service status:', error)
      toast.error('Failed to update service')
    }
  }

  const deleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return
    
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId)
      
      if (error) throw error
      
      // Update local state
      const deletedService = services.find(s => s.id === serviceId)
      setServices(prev => prev.filter(service => service.id !== serviceId))
      
      // Update stats
      setStats(prev => ({
        total: prev.total - 1,
        active: deletedService?.is_active ? prev.active - 1 : prev.active
      }))
      
      toast.success('Service deleted successfully')
    } catch (error) {
      console.error('Error deleting service:', error)
      toast.error('Failed to delete service')
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-6 animate-fade-in p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Services</h1>
            <p className="text-muted-foreground">Manage your professional services</p>
          </div>
          {/* Add search and filter buttons if needed, but for now, just the title */}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Post a Service</CardTitle>
                <CardDescription>
                  Offer your professional services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CreateServiceDialog onServiceCreated={fetchServices} />
              </CardContent>
            </Card>
            
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Your Services</CardTitle>
                  <CardDescription>Manage your posted services</CardDescription>
                </div>
                {isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
              </CardHeader>
              <CardContent>
                {services.length === 0 && !isLoading ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">No services posted yet</p>
                    <p className="text-sm text-muted-foreground">
                      Use the form to post your first service and start getting clients.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {services.map(service => (
                      <Card key={service.id} className="overflow-hidden">
                        <CardContent className="p-0">
                          <div className="flex flex-col md:flex-row">
                            <div className="flex-1 p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-medium">{service.title}</h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline">{service.type}</Badge>
                                    <Badge 
                                      variant={service.is_active ? "default" : "secondary"}
                                      className="text-xs"
                                    >
                                      {service.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="text-right">
                                  {service.price ? (
                                    <p className="font-medium">
                                      ${service.price}
                                      {!service.is_set_price && ' / hour'}
                                    </p>
                                  ) : (
                                    <p className="text-sm text-muted-foreground">Contact for pricing</p>
                                  )}
                                  {service.delivery_time && (
                                    <p className="text-xs text-muted-foreground">{service.delivery_time}</p>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                {service.description}
                              </p>
                            </div>
                            <div className="flex md:flex-col justify-end gap-2 p-4 bg-muted/30 md:w-48">
                              <Button 
                                variant={service.is_active ? "outline" : "default"}
                                size="sm"
                                onClick={() => toggleServiceStatus(service.id, service.is_active)}
                              >
                                {service.is_active ? 'Deactivate' : 'Activate'}
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => deleteService(service.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Service Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Total Services</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Active Services</p>
                    <p className="text-2xl font-bold">{stats.active}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {services.length === 0 ? (
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-muted"></div>
                    <div>
                      <p className="text-sm font-medium">No recent activity</p>
                      <p className="text-sm text-muted-foreground">When you post services, activity will appear here</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {services.slice(0, 3).map(service => (
                      <div key={service.id} className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Check className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Service Posted</p>
                          <p className="text-sm text-muted-foreground">
                            You posted "{service.title}" on {new Date(service.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
      </div>
    </div>
  )
}
