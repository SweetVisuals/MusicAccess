import { AppSidebar } from "@/components/dashboard/layout/app-sidebar"
import { SectionCards } from "@/components/dashboard/layout/section-cards"
import { SiteHeader } from "@/components/dashboard/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/@/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const serviceTypes = [
  "Mix & Mastering",
  "Production",
  "Sound Technician",
  "Vocal Recording",
  "Instrument Recording",
  "Audio Editing"
]

export default function ServicesPage() {
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              
              <div className="grid grid-cols-1 gap-6 px-4 lg:grid-cols-3 lg:px-6">
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle>Post a Service</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="service-title">Service Title</Label>
                      <Input id="service-title" placeholder="e.g. Professional Mixing" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="service-type">Service Type</Label>
                      <select
                        id="service-type"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Select a service type</option>
                        {serviceTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="service-description">Description</Label>
                      <Textarea id="service-description" placeholder="Describe your service in detail" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="service-price">Price (optional)</Label>
                      <Input id="service-price" type="number" placeholder="e.g. 50" />
                    </div>
                    
                    <Button className="w-full">Post Service</Button>
                  </CardContent>
                </Card>
                
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Your Services</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">No services posted yet</p>
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
                        <p className="text-2xl font-bold">0</p>
                      </div>
                      <div className="rounded-lg border p-4">
                        <p className="text-sm text-muted-foreground">Active Services</p>
                        <p className="text-2xl font-bold">0</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-muted"></div>
                        <div>
                          <p className="text-sm font-medium">No recent activity</p>
                          <p className="text-sm text-muted-foreground">When you post services, activity will appear here</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
