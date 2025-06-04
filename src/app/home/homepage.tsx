import { useAuth } from "@/contexts/auth-context"
import { SiteHeader } from "@/components/homepage/site-header"
import { AppSidebar } from "@/components/homepage/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/@/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/@/ui/avatar"
import { Badge } from "@/components/@/ui/badge"
import { Star, Headphones, Music, Mic2, TrendingUp, Play, Heart, MessageCircle, MoreVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/@/ui/dropdown-menu"

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

const trendingProjects = [
  {
    id: 1,
    title: "Summer Vibes EP",
    producer: "Alex Johnson",
    avatar: "https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg",
    coverImage: "https://images.pexels.com/photos/1626481/pexels-photo-1626481.jpeg",
    plays: 24500,
    likes: 1200,
    comments: 89,
    genre: "House"
  },
  {
    id: 2,
    title: "Late Night Beats",
    producer: "Sarah Smith",
    avatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg",
    coverImage: "https://images.pexels.com/photos/1389429/pexels-photo-1389429.jpeg",
    plays: 18300,
    likes: 890,
    comments: 45,
    genre: "Hip Hop"
  },
  {
    id: 3,
    title: "Soul Sessions",
    producer: "Mike Wilson",
    avatar: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg",
    coverImage: "https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg",
    plays: 32100,
    likes: 1500,
    comments: 120,
    genre: "R&B"
  },
  {
    id: 4,
    title: "Electronic Dreams",
    producer: "Emma Davis",
    avatar: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg",
    coverImage: "https://images.pexels.com/photos/1694900/pexels-photo-1694900.jpeg",
    plays: 15800,
    likes: 750,
    comments: 67,
    genre: "Electronic"
  },
  {
    id: 5,
    title: "Urban Nights",
    producer: "Chris Brown",
    avatar: "https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg",
    coverImage: "https://images.pexels.com/photos/1537638/pexels-photo-1537638.jpeg",
    plays: 28900,
    likes: 1300,
    comments: 95,
    genre: "Hip Hop"
  },
  {
    id: 6,
    title: "Acoustic Stories",
    producer: "Lisa Anderson",
    avatar: "https://images.pexels.com/photos/1181687/pexels-photo-1181687.jpeg",
    coverImage: "https://images.pexels.com/photos/1751731/pexels-photo-1751731.jpeg",
    plays: 21400,
    likes: 980,
    comments: 73,
    genre: "Acoustic"
  },
  {
    id: 7,
    title: "Jazz Fusion",
    producer: "David Lee",
    avatar: "https://images.pexels.com/photos/2379006/pexels-photo-2379006.jpeg",
    coverImage: "https://images.pexels.com/photos/1644616/pexels-photo-1644616.jpeg",
    plays: 19700,
    likes: 890,
    comments: 58,
    genre: "Jazz"
  },
  {
    id: 8,
    title: "Future Bass",
    producer: "Rachel Kim",
    avatar: "https://images.pexels.com/photos/1181688/pexels-photo-1181688.jpeg",
    coverImage: "https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg",
    plays: 23600,
    likes: 1100,
    comments: 82,
    genre: "Electronic"
  }
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
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold tracking-tight">Trending Now</h2>
                </div>
                <Button variant="outline">View All</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {trendingProjects.map((project) => (
                  <Card key={project.id} className="group overflow-hidden">
                    <div className="relative aspect-square">
                      <img 
                        src={project.coverImage} 
                        alt={project.title}
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button size="icon" className="rounded-full">
                          <Play className="h-6 w-6" />
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium truncate">{project.title}</h3>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Add to Playlist</DropdownMenuItem>
                            <DropdownMenuItem>Share</DropdownMenuItem>
                            <DropdownMenuItem>Report</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={project.avatar} />
                          <AvatarFallback>{project.producer[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">{project.producer}</span>
                        <Badge variant="secondary" className="ml-auto">
                          {project.genre}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Play className="h-4 w-4" />
                            {(project.plays / 1000).toFixed(1)}k
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            {(project.likes / 1000).toFixed(1)}k
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            {project.comments}
                          </span>
                        </div>
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