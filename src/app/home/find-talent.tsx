import { AppSidebar } from "@/components/homepage/app-sidebar"
import { SiteHeader } from "@/components/homepage/site-header"
import { SidebarInset, SidebarProvider } from "@/components/@/ui/sidebar"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

// Mock data - will be replaced with backend data
const mockServices = [
  {
    id: 1,
    title: "Professional Mixing",
    type: "Mix & Mastering",
    description: "High quality mixing for your tracks with analog warmth",
    price: 50,
    username: "mixmasterpro",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg"
  },
  {
    id: 2,
    title: "Beat Production",
    type: "Production",
    description: "Custom beats tailored to your style",
    price: 75,
    username: "beatmaker",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg"
  },
  {
    id: 3,
    title: "Live Sound Engineer",
    type: "Sound Technician",
    description: "Professional live sound setup and mixing",
    price: 100,
    username: "soundwizard",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg"
  }
]

const serviceTypes = [
  "All Types",
  "Mix & Mastering",
  "Production",
  "Sound Technician",
  "Vocal Recording",
  "Instrument Recording",
  "Audio Editing"
]

export default function FindTalentPage() {
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="@container/main flex flex-1 flex-col">
          <div className="flex-1 flex flex-col gap-8 py-4 md:gap-10 md:py-6 px-4">
            <section className="space-y-4">
              <h1 className="text-3xl font-bold tracking-tight">Find Talent</h1>
              <p className="text-muted-foreground">
                Discover and connect with music professionals offering their services
              </p>
              
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search services..."
                    className="pl-10"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Label htmlFor="filter-type" className="whitespace-nowrap">Filter by:</Label>
                  <select
                    id="filter-type"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {serviceTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="grid grid-cols-4 gap-4 px-4">
                {mockServices.map(service => (
                  <Card key={service.id} className="hover:shadow-lg hover:scale-[1.02] transition-all duration-300 ease-in-out bg-gradient-to-br from-primary/5 to-secondary/5">
                    <CardHeader className="flex flex-row gap-4 items-start">
                      <div className="flex-shrink-0">
                        <img 
                          src={service.avatar} 
                          alt={service.username}
                          className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-md"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{service.title}</CardTitle>
                            <span className="text-xs text-muted-foreground">@{service.username}</span>
                          </div>
                          <div className="text-sm font-bold bg-primary/10 text-primary px-2 py-1 rounded-md">
                            ${service.price}/hr
                          </div>
                        </div>
                        <span className="block text-sm text-muted-foreground">{service.type}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{service.description}</p>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3">
                      <div className="flex gap-2 w-full">
                        <Button variant="outline" className="flex-1">Message</Button>
                        <Button className="flex-1 bg-black text-white hover:bg-black/80">Book Now</Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </section>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
