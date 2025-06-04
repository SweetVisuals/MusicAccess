import { AppSidebar } from "@/components/dashboard/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/@/ui/sidebar"
import { SiteHeader } from "@/components/dashboard/layout/site-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/@/ui/card"
import { ChartAreaInteractive } from "@/components/dashboard/layout/chart-area-interactive"
import { Button } from "@/components/@/ui/button"
import { Badge } from "@/components/@/ui/badge"
import { TrendingUp, TrendingDown, Users, DollarSign, Music2, PlayCircle, ChevronLeft, ChevronRight, Calendar, Filter } from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-6 animate-fade-in p-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Analytics</h1>
                <p className="text-muted-foreground">Track your performance and growth</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Last 30 days
                </Button>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$45,231.89</div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                    +20.1% from last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Plays</CardTitle>
                  <PlayCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">892,345</div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                    +15.3% from last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Tracks</CardTitle>
                  <Music2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">245</div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                    +12 new this week
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unique Listeners</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">132,234</div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                    -4% from last week
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Plays Over Time</CardTitle>
                  <CardDescription>Track plays across all your content</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartAreaInteractive />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue Analysis</CardTitle>
                  <CardDescription>Track your earnings and growth</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartAreaInteractive />
                </CardContent>
              </Card>
            </div>

            {/* Top Performing Content */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Content</CardTitle>
                <CardDescription>Your most successful tracks and content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Music2 className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">Summer Vibes</h3>
                          <p className="text-sm text-muted-foreground">Released June 2024</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium">45.2K</p>
                          <p className="text-sm text-muted-foreground">Total Plays</p>
                        </div>
                        <Badge variant="secondary" className="ml-2">+12.3%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}