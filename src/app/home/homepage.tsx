import { useAuth } from "@/contexts/auth-context"
import { SiteHeader } from "@/components/homepage/site-header"
import { AppSidebar } from "@/components/homepage/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/@/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/@/ui/tabs"
import { ScrollArea } from "@/components/@/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/@/ui/avatar"
import { Badge } from "@/components/@/ui/badge"
import { Play, Heart, MessageCircle, Star, Headphones, Music, Users, Mic2, Clock, TrendingUp } from "lucide-react"

const featuredProjects = [
  {
    id: 1,
    title: "Summer Vibes EP",
    producer: "Alex Johnson",
    producerAvatar: "https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg",
    coverArt: "https://images.pexels.com/photos/1626481/pexels-photo-1626481.jpeg",
    genre: "House",
    plays: "12.5k",
    likes: 342,
    price: 29.99
  },
  {
    id: 2,
    title: "Midnight Sessions",
    producer: "Sarah Smith",
    producerAvatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg",
    coverArt: "https://images.pexels.com/photos/1389429/pexels-photo-1389429.jpeg",
    genre: "Hip Hop",
    plays: "8.2k",
    likes: 256,
    price: 24.99
  },
  {
    id: 3,
    title: "Urban Dreams",
    producer: "Mike Wilson",
    producerAvatar: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg",
    coverArt: "https://images.pexels.com/photos/1694900/pexels-photo-1694900.jpeg",
    genre: "R&B",
    plays: "15.7k",
    likes: 421,
    price: 34.99
  }
];

const topProducers = [
  {
    name: "Alex Johnson",
    avatar: "https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg",
    genre: "House",
    rating: 4.9,
    projects: 24
  },
  {
    name: "Sarah Smith",
    avatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg",
    genre: "Hip Hop",
    rating: 4.8,
    projects: 18
  },
  {
    name: "Mike Wilson",
    avatar: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg",
    genre: "R&B",
    rating: 4.7,
    projects: 32
  }
];

const categories = [
  { name: "Beats & Instrumentals", icon: Music, count: 1245 },
  { name: "Vocal Production", icon: Mic2, count: 856 },
  { name: "Mixing & Mastering", icon: Headphones, count: 932 },
  { name: "Sound Design", icon: Star, count: 647 }
];

export default function HomePage() {
  const { user } = useAuth()

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <div className="@container/main flex flex-1 flex-col">
          <SiteHeader />
          
          <div className="flex-1 space-y-8 p-8 pt-6">
            {/* Hero Section */}
            <div className="flex flex-col space-y-4">
              <h1 className="text-4xl font-bold tracking-tight">Discover Amazing Music</h1>
              <p className="text-lg text-muted-foreground">
                Find the perfect tracks, connect with producers, and bring your vision to life
              </p>
              <div className="flex w-full max-w-sm items-center space-x-2">
                <Input type="text" placeholder="Search tracks, producers, or services..." />
                <Button type="submit">Search</Button>
              </div>
            </div>

            {/* Featured Projects */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold tracking-tight">Featured Projects</h2>
                <Button variant="ghost">View all</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredProjects.map((project) => (
                  <Card key={project.id} className="group hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-0">
                      <div className="relative aspect-square">
                        <img 
                          src={project.coverArt} 
                          alt={project.title}
                          className="object-cover w-full h-full rounded-t-lg"
                        />
                        <Button 
                          size="icon"
                          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full w-12 h-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        >
                          <Play className="h-6 w-6" />
                        </Button>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={project.producerAvatar} />
                            <AvatarFallback>{project.producer[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{project.producer}</span>
                        </div>
                        <h3 className="font-semibold mb-2">{project.title}</h3>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">{project.genre}</Badge>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Headphones className="h-4 w-4" />
                              {project.plays}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="h-4 w-4" />
                              {project.likes}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-4">Browse Categories</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {categories.map((category) => (
                  <Card key={category.name} className="hover:bg-accent transition-colors cursor-pointer">
                    <CardContent className="flex items-center gap-4 p-4">
                      <category.icon className="h-8 w-8 text-primary" />
                      <div>
                        <h3 className="font-medium">{category.name}</h3>
                        <p className="text-sm text-muted-foreground">{category.count} items</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Top Producers */}
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-4">Top Producers</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {topProducers.map((producer) => (
                  <Card key={producer.name}>
                    <CardContent className="flex items-center gap-4 p-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={producer.avatar} />
                        <AvatarFallback>{producer.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-medium">{producer.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="secondary">{producer.genre}</Badge>
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-current text-yellow-500" />
                            {producer.rating}
                          </span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View Profile
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Trending Now */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold tracking-tight">Trending Now</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">Trending #{i}</Badge>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <h3 className="font-medium">Summer Hit {i}</h3>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>24.5k plays</span>
                        <span>+128%</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}