import { useState } from "react"
import { AppSidebar } from "@/components/dashboard/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/@/ui/sidebar"
import { SiteHeader } from "@/components/dashboard/layout/site-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartAreaInteractive } from "@/components/dashboard/layout/chart-area-interactive"
import { DataTable } from "@/components/dashboard/data-table"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Users, DollarSign, Music, PlayCircle, ChevronLeft, ChevronRight } from "lucide-react"
import data from "./data.json"

const chartMetrics = [
  { id: 'revenue', label: 'Revenue' },
  { id: 'plays', label: 'Total Plays' },
  { id: 'orders', label: 'Service Orders' },
  { id: 'clients', label: 'Active Clients' }
];

export default function Page() {
  const [currentMetric, setCurrentMetric] = useState(0);

  const nextMetric = () => {
    setCurrentMetric((prev) => (prev + 1) % chartMetrics.length);
  };

  const previousMetric = () => {
    setCurrentMetric((prev) => (prev - 1 + chartMetrics.length) % chartMetrics.length);
  };

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-6 animate-fade-in p-8">
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
                  <CardTitle className="text-sm font-medium">Active Services</CardTitle>
                  <Music className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">24</div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                    +12 new this week
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Plays</CardTitle>
                  <PlayCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,429</div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                    -4% from last week
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">573</div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                    +201 since last month
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Chart */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{chartMetrics[currentMetric].label}</CardTitle>
                  <CardDescription>
                    Analytics over time
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={previousMetric}
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={nextMetric}
                    className="h-8 w-8"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pl-2">
                <ChartAreaInteractive />
              </CardContent>
            </Card>

            {/* Service Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Service Orders</CardTitle>
                <CardDescription>
                  Manage your incoming service requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable data={data} />
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}