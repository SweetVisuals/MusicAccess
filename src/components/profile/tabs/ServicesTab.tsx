import { useState } from 'react';
import { useServices } from '@/hooks/useServices';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/@/ui/button';
import { Plus, Settings, Edit, Trash2, Eye, EyeOff, ShoppingCart, MoreVertical, MessageSquare, Pin } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/@/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Profile, Service } from '@/lib/types';
import { Checkbox } from '@/components/@/ui/checkbox';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useCart } from '@/contexts/cart-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/@/ui/avatar';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/@/ui/dropdown-menu';

interface ServicesTabProps {
  showCreateDialog: boolean;
  setShowCreateDialog: (show: boolean) => void;
  user: Profile;
  isPreviewMode?: boolean;
  viewMode?: 'grid' | 'list';
}

const ServicesTab = ({ showCreateDialog, setShowCreateDialog, user, isPreviewMode = false, viewMode = 'grid' }: ServicesTabProps) => {
   const { user: currentUser } = useAuth();
   const userId = user?.id;
   const isOwner = (currentUser?.id === userId) && !isPreviewMode;
   const { services, loading, error, addService, updateService, deleteService, toggleServiceStatus } = useServices(userId || '');
   const { addToCart, isInCart, recentlyAddedId } = useCart();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    is_active: true
  });

  const handleCreateService = async () => {
    if (!userId) {
      toast.error("You must be logged in to create a service");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("Please enter a title for your service");
      return;
    }

    setIsSubmitting(true);

    try {
      const serviceData = {
         user_id: userId || '',
         title: formData.title,
         description: formData.description,
         price: parseFloat(formData.price) || 0,
         is_active: formData.is_active
       };

      const result = await addService(serviceData);
      if (result.success) {
        toast.success("Service created successfully!");
        setShowCreateDialog(false);
        setFormData({ title: '', description: '', price: '', is_active: true });
      } else {
        toast.error("Failed to create service");
      }
    } catch (error) {
      console.error('Error creating service:', error);
      toast.error("Failed to create service");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setFormData({
      title: service.title,
      description: service.description || '',
      price: service.price?.toString() || '',
      is_active: service.is_active
    });
  };

  const handleUpdateService = async () => {
    if (!editingService) return;

    setIsSubmitting(true);

    try {
      const updateData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price) || 0,
        is_active: formData.is_active
      };

      const result = await updateService(editingService.id, updateData);
      if (result.success) {
        toast.success("Service updated successfully!");
        setEditingService(null);
        setFormData({ title: '', description: '', price: '', is_active: true });
      } else {
        toast.error("Failed to update service");
      }
    } catch (error) {
      console.error('Error updating service:', error);
      toast.error("Failed to update service");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const result = await deleteService(serviceId);
      if (result.success) {
        toast.success("Service deleted successfully!");
      } else {
        toast.error("Failed to delete service");
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error("Failed to delete service");
    }
  };

  if (!userId) return <div className="p-4">User not found.</div>;
  if (loading) return <div className="p-4 animate-pulse">Loading services...</div>;
  if (error) return <div className="p-4 text-destructive">Error: {error}</div>;

  // Sort services so pinned ones appear first
  const sortedServices = [...services].sort((a, b) => {
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;
    return 0; // Keep original order for same pinned status
  });

  return (
    <TooltipProvider>
      <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Services</h2>
      </div>

      {services.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No services found</h3>
          <p className="text-muted-foreground mt-2 mb-4">
            {isOwner
              ? "Create your first service to showcase what you offer"
              : "No services found"}
          </p>
        </div>
      ) : (
         <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}>
           {sortedServices.map((service) => (
             <div
               key={service.id}
               className="group relative rounded-lg overflow-hidden bg-muted/50 hover:bg-muted transition-all duration-300 shadow-sm hover:shadow-md text-left"
             >
               {/* Service Header */}
               <div className="p-4 space-y-3">
                 <div className="flex items-start justify-between gap-2">
                   <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-2 mb-2">
                       <h3 className="font-medium line-clamp-1">{service.title}</h3>
                       {service.is_featured && (
                         <Pin className="h-4 w-4 text-primary shrink-0" />
                       )}
                     </div>
                     <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                       {service.type && (
                         <span className="capitalize">{service.type}</span>
                       )}
                       {service.delivery_time && (
                         <span>📅<span className="ml-1.5">{service.delivery_time}</span></span>
                       )}
                       {service.revisions && service.revisions > 0 && (
                         <span>🔄<span className="ml-1.5">{service.revisions} revision{service.revisions !== 1 ? 's' : ''}</span></span>
                       )}
                     </div>
                   </div>
                   <div className="flex items-center gap-2">
                     <Badge variant={service.is_active ? "default" : "secondary"} className="shrink-0">
                       {service.is_active ? "Active" : "Inactive"}
                     </Badge>
                     {isOwner && (
                       <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8">
                             <MoreVertical className="h-4 w-4" />
                           </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent>
                           <DropdownMenuItem onClick={() => handleEditService(service)}>
                             <Edit className="h-4 w-4 mr-2" />
                             Edit
                           </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => updateService(service.id, { is_featured: !service.is_featured })}>
                             <Pin className="h-4 w-4 mr-2" />
                             {service.is_featured ? 'Unpin' : 'Pin'}
                           </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => toggleServiceStatus(service.id, service.is_active)}>
                             {service.is_active ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                             {service.is_active ? 'Deactivate' : 'Activate'}
                           </DropdownMenuItem>
                           <DropdownMenuItem
                             className="text-red-500"
                             onClick={() => handleDeleteService(service.id)}
                           >
                             <Trash2 className="h-4 w-4 mr-2" />
                             Delete
                           </DropdownMenuItem>
                         </DropdownMenuContent>
                       </DropdownMenu>
                     )}
                   </div>
                 </div>

                 {service.description && (
                   <div className="bg-muted/30 group-hover:bg-background rounded-md p-3 border">
                     <p className="text-sm text-foreground/90 leading-relaxed">{service.description}</p>
                   </div>
                 )}

               </div>

               {/* Creator Info and Action Icons */}
               <div className="flex items-center justify-between px-4 pb-4 border-t pt-3">
                 <Link to={`/user/${user.username}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                   <Avatar className="h-6 w-6">
                     <AvatarImage src={user.avatarUrl} alt={user.full_name} />
                     <AvatarFallback>{user.full_name ? user.full_name[0] : 'U'}</AvatarFallback>
                   </Avatar>
                   <div className="flex-1 min-w-0">
                     <p className="text-xs font-medium truncate">
                       {user.full_name}
                     </p>
                     {user.professional_title && (
                       <p className="text-xs text-muted-foreground truncate">
                         {user.professional_title}
                       </p>
                     )}
                   </div>
                 </Link>

                 <div className="flex items-center gap-3">
                   <div className="text-right">
                     {service.price && service.price > 0 ? (
                       <div className="text-sm font-semibold text-primary">
                         ${service.price.toLocaleString('en-US', {
                           minimumFractionDigits: service.price % 1 === 0 ? 0 : 2,
                           maximumFractionDigits: service.price % 1 === 0 ? 0 : 2
                         })}
                         {service.is_set_price && <span className="text-xs text-muted-foreground ml-1">(Fixed Price)</span>}
                       </div>
                     ) : (
                       <div className="text-sm font-semibold text-green-600">
                         Free
                       </div>
                     )}
                   </div>
                   {service.user_id !== currentUser?.id && (
                     <>
                       <Tooltip>
                         <TooltipTrigger asChild>
                           <Button
                             variant="ghost"
                             size="icon"
                             className={`h-7 w-7 transition-all duration-300 ${
                               recentlyAddedId === service.id
                                 ? 'animate-pulse ring-2 ring-primary bg-primary/20'
                                 : ''
                             }`}
                             onClick={(e) => {
                               e.stopPropagation();
                               addToCart(service.id, 'service');
                               toast.success(`${service.title} added to cart`, {
                                 description: service.price
                                   ? `Service price: $${service.price.toFixed(2)}`
                                   : 'Free service'
                               });
                             }}
                             disabled={isInCart(service.id, 'service')}
                           >
                             <ShoppingCart className={`h-4 w-4 transition-colors ${
                               isInCart(service.id, 'service')
                                 ? 'text-primary'
                                 : 'text-muted-foreground hover:text-primary'
                             } ${
                               recentlyAddedId === service.id ? 'scale-110' : ''
                             }`} />
                           </Button>
                         </TooltipTrigger>
                         <TooltipContent>
                           {isInCart(service.id, 'service') ? (
                             <p>Service in cart</p>
                           ) : (
                             <>
                               <p>Add service to cart</p>
                               {service.price && <p>Price: ${service.price.toFixed(2)}</p>}
                               {!service.price && <p>Free service</p>}
                             </>
                           )}
                         </TooltipContent>
                       </Tooltip>

                       <Tooltip>
                         <TooltipTrigger asChild>
                           <Button
                             variant="ghost"
                             size="icon"
                             className="h-7 w-7"
                             onClick={(e) => {
                               e.stopPropagation();
                               // Navigate to messages or open message dialog
                               toast.info(`Message ${user.full_name} about ${service.title}`);
                             }}
                           >
                             <MessageSquare className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                           </Button>
                         </TooltipTrigger>
                         <TooltipContent>
                           <p>Message creator</p>
                         </TooltipContent>
                       </Tooltip>
                     </>
                   )}
                 </div>
               </div>
             </div>
           ))}
         </div>
       )}

      {/* Create/Edit Service Dialog */}
      <Dialog open={showCreateDialog || !!editingService} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setEditingService(null);
          setFormData({ title: '', description: '', price: '', is_active: true });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingService ? 'Edit Service' : 'Create New Service'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Service Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Enter a title for your service"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe your service"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (USD)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                placeholder="0.00"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({...formData, is_active: checked as boolean})
                }
              />
              <Label htmlFor="is_active">Service is active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setEditingService(null);
                setFormData({ title: '', description: '', price: '', is_active: true });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingService ? handleUpdateService : handleCreateService}
              disabled={isSubmitting || !formData.title}
            >
              {isSubmitting ? (editingService ? 'Updating...' : 'Creating...') : (editingService ? 'Update Service' : 'Create Service')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default ServicesTab;
