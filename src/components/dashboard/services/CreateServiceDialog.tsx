import React, { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const serviceTypes = [
  "Mix & Mastering",
  "Production",
  "Sound Technician",
  "Vocal Recording",
  "Instrument Recording",
  "Audio Editing",
  "Composition",
  "Arrangement",
  "Sound Design",
  "Podcast Production"
]

// Define the form schema with Zod
const serviceFormSchema = z.object({
  title: z.string().min(3, {
    message: "Service title must be at least 3 characters.",
  }).max(100, {
    message: "Service title must not exceed 100 characters."
  }),
  type: z.string({
    required_error: "Please select a service type.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }).max(900, { // Approximately 150 words (assuming 6 characters per word)
    message: "Description must not exceed 150 words."
  }),
  price: z.coerce.number().min(0, {
    message: "Price must be a positive number.",
  }).optional(),
  delivery_time_value: z.coerce.number().min(0).optional(),
  delivery_time_unit: z.enum(["Hours", "Days", "Weeks", "Custom"]).optional(),
  delivery_time_custom: z.string().optional(),
  revisions: z.coerce.number().min(0).optional(),
  is_featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
  is_set_price: z.boolean().default(false),
})

// Explicitly define ServiceFormValues to match react-hook-form's expectations
type ServiceFormValues = z.infer<typeof serviceFormSchema>;

interface CreateServiceDialogProps {
  onServiceCreated: () => void;
}

export function CreateServiceDialog({ onServiceCreated }: CreateServiceDialogProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      title: "",
      type: "",
      description: "",
      price: undefined,
      delivery_time_value: undefined,
      delivery_time_unit: undefined,
      delivery_time_custom: undefined,
      revisions: undefined,
      is_featured: false,
      is_active: true,
      is_set_price: false,
    } as ServiceFormValues, // Explicitly cast to help TypeScript
  });

  const onSubmit = async (values: ServiceFormValues) => {
    if (!user) {
      toast.error('You must be logged in to post a service');
      return;
    }

    setIsSubmitting(true);
    try {
      // Construct the delivery_time string based on selected unit
      let deliveryTimeString: string | null = null;
      if (values.delivery_time_unit === "Custom") {
        deliveryTimeString = values.delivery_time_custom || null;
      } else if (values.delivery_time_value !== undefined && values.delivery_time_unit) {
        deliveryTimeString = `${values.delivery_time_value} ${values.delivery_time_unit}`;
      }
      
      const { data, error } = await supabase
        .from('services')
        .insert([
          {
            ...values,
            delivery_time: deliveryTimeString, // Use the constructed string
            user_id: user.id,
          }
        ])
        .select();
      
      if (error) throw error;
      
      toast.success('Service posted successfully');
      form.reset();
      onServiceCreated(); // Call the callback to refresh services list
      setOpen(false); // Close the dialog
    } catch (error: any) {
      console.error('Error posting service:', error);
      toast.error(`Failed to post service: ${error.message || error.code || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">Post a Service</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Service</DialogTitle>
          <DialogDescription>
            Fill in the details for your professional service.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="basic-info" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic-info">Basic Info</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>
              <TabsContent value="basic-info" className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Professional Mixing" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a service type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {serviceTypes.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Write a short description of your service." 
                          className="min-h-[120px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Include what you offer (Max 150 words)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              <TabsContent value="pricing" className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="is_set_price"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                      <div className="flex items-center h-full">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </div>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Set a fixed price instead of hourly
                        </FormLabel>
                        <FormDescription>
                          If checked, the price will be a one-time fee. Otherwise, it's per hour.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (USD)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder={form.watch('is_set_price') ? "e.g. 500" : "e.g. 50 per hour"} 
                          {...field}
                          onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Leave empty for "Contact for pricing"
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              <TabsContent value="details" className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="delivery_time_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Time</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="e.g. 2" 
                            {...field}
                            onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                            disabled={form.watch('delivery_time_unit') === 'Custom'}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="delivery_time_unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Hours">Hours</SelectItem>
                            <SelectItem value="Days">Days</SelectItem>
                            <SelectItem value="Weeks">Weeks</SelectItem>
                            <SelectItem value="Custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {form.watch('delivery_time_unit') === 'Custom' && (
                  <FormField
                    control={form.control}
                    name="delivery_time_custom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom Delivery Time</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Varies by project" {...field} />
                        </FormControl>
                        <FormDescription>
                          Specify a custom delivery time description.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="revisions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Revisions</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="e.g. 3" 
                          {...field}
                          onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Number of revisions included
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="is_featured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                      <div className="flex items-center h-full">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </div>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Feature this service
                        </FormLabel>
                        <FormDescription>
                          Highlight this service on your profile.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                      <div className="flex items-center h-full">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </div>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Make service active
                        </FormLabel>
                        <FormDescription>
                          If unchecked, this service will not be visible to others.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>
            <Button 
              type="submit" 
              className="w-full mt-4"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                'Post Service'
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
