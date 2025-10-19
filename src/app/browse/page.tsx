'use client'

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/@/ui/badge"
import { Headphones, Music, Mic2, TrendingUp, Rocket, ChevronRight, Users, SlidersHorizontal, DollarSign, Clock, ArrowLeft, Search, Filter, Grid, List, Play, Eye } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import ProjectCard from "@/components/profile/music/ProjectCard"
import ProducerCard from "@/components/homepage/ProducerCard"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Project } from "@/lib/types"
import { formatDuration } from "@/lib/utils"
import { PageLoading } from "@/components/ui/page-loading"
import { useTopProducers } from "@/hooks/useTopProducers"
import { useCategoryCounts } from "@/hooks/useCategoryCounts"
import { useTrendingGenres } from "@/hooks/useTrendingGenres"
import { HomeLayout } from "@/components/layout/HomeLayout"

interface ProjectWithStats extends Project {
  stats?: {
    views: number;
    streams: number;
    downloads: number;
  };
}


// Dynamic categories with real counts
const getCategories = (counts: Record<string, number>) => [
  {
    name: "Beats & Instrumentals",
    icon: Music,
    count: counts["Beats & Instrumentals"] || 0,
    description: "Find the perfect beat for your next project",
    color: "bg-blue-500/10 text-blue-500"
  },
  {
    name: "Vocal Production",
    icon: Mic2,
    count: counts["Vocal Production"] || 0,
    description: "Professional vocal recordings and processing",
    color: "bg-purple-500/10 text-purple-500"
  },
  {
    name: "Mixing & Mastering",
    icon: Headphones,
    count: counts["Mixing & Mastering"] || 0,
    description: "Expert audio engineering services",
    color: "bg-green-500/10 text-green-500"
  },
  {
    name: "Sound Packs",
    icon: Rocket,
    count: counts["Sound Packs"] || 0,
    description: "Premium sound libraries and samples",
    color: "bg-orange-500/10 text-orange-500"
  },
  {
    name: "Collaborate",
    icon: Users,
    count: counts["Collaborate"] || 0,
    description: "Connect with other music professionals",
    color: "bg-pink-500/10 text-pink-500"
  },
  {
    name: "Tutorials",
    icon: Play,
    count: counts["Tutorials"] || 0,
    description: "Learn from industry experts",
    color: "bg-red-500/10 text-red-500"
  }
];


export default function BrowsePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [genreFilter, setGenreFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200])
  const [bpmRange, setBpmRange] = useState<[number, number]>([60, 180])
  const [quickFilter, setQuickFilter] = useState("all")
  const [trendingProjects, setTrendingProjects] = useState<ProjectWithStats[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [errorProjects, setErrorProjects] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeCategory, setActiveCategory] = useState("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch real top producers data
  const { producers: topProducers, loading: loadingProducers, error: producersError } = useTopProducers(6);

  // Fetch real category counts
  const { categoryCounts, loading: loadingCategories } = useCategoryCounts();

  // Fetch real trending genres
  const { genres: trendingGenres } = useTrendingGenres(6);

  const fetchTrendingProjects = useCallback(async (): Promise<void> => {
    setLoadingProjects(true);
    setErrorProjects(null);
    try {
      // Fetch recent public projects (limit 50 to calculate trending scores efficiently)
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          profiles!left(*),
          audio_tracks!left(*)
        `)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(100);

      if (projectsError) {
        console.error('Error fetching projects:', projectsError);
        throw projectsError;
      }

      console.log('Fetched projects:', projectsData?.length || 0);

      // Debug: check total projects count
      const { count, error: countError } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true });

      console.log('Total projects in DB:', count, 'Count error:', countError);

      // Debug: check public projects count
      const { count: publicCount, error: publicCountError } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('visibility', 'public');

      console.log('Public projects in DB:', publicCount, 'Public count error:', publicCountError);

      // If no projects found, set empty array
      if (!projectsData || projectsData.length === 0) {
        console.log('No projects found');
        setTrendingProjects([]);
        return;
      }

      // First, format tracks for all projects
      const projectsWithFormattedTracks = (projectsData || []).map(project => {
        const audioTracks = project.audio_tracks || [];

        const formattedTracks = audioTracks.map((track: any) => ({
          ...track,
          id: track.id,
          title: track.title,
          audio_url: track.audio_url,
          duration: track.duration_seconds ? formatDuration(track.duration_seconds) : (track.duration ? formatDuration(track.duration) : '0:00'),
          price: track.price || 0,
          allow_download: track.allow_download || false
        }));

        return {
          ...project,
          files: [],
          audio_tracks: formattedTracks,
          trackIds: formattedTracks.map((track: any) => track.id)
        };
      });

      // Get all unique track IDs
      const allTrackIds = projectsWithFormattedTracks.flatMap(p => p.trackIds);

      // Fetch streams data for all tracks at once
      let streamsData: any[] = [];
      if (allTrackIds.length > 0) {
        const { data, error } = await supabase
          .from('track_streams')
          .select('track_id, streams')
          .in('track_id', allTrackIds);

        if (!error && data) {
          streamsData = data;
        }
      }

      // Create a map of track_id to streams count
      const streamsMap: Record<string, number> = {};
      streamsData.forEach(stream => {
        streamsMap[stream.track_id] = (streamsMap[stream.track_id] || 0) + (stream.streams || 0);
      });

      // Calculate trending score for each project and add stats
      const projectsWithScore = projectsWithFormattedTracks.map(project => {
        const trackStreams = project.trackIds.reduce((sum: number, trackId: string) => sum + (streamsMap[trackId] || 0), 0);
        const downloadsCount = Math.floor(trackStreams * 0.1); // Assume 10% of streams are downloads
        const viewsCount = trackStreams * 3 + Math.floor(Math.random() * 100); // 3x streams + some random views

        // Calculate days since created
        const daysSinceCreated = (new Date().getTime() - new Date(project.created_at).getTime()) / (1000 * 60 * 60 * 24);

        // Trending score algorithm: streams + (tracks * 5) - (days since created * 0.1)
        // Higher streams and more tracks boost score, older projects get slightly lower score
        const trendingScore = trackStreams + (project.audio_tracks.length * 5) - (daysSinceCreated * 0.1);

        // Remove trackIds from final object
        const { trackIds, ...projectWithoutTrackIds } = project;

        return {
          ...projectWithoutTrackIds,
          trending_score: trendingScore,
          stats: {
            views: Math.max(viewsCount, project.audio_tracks.length * 10), // Minimum views based on tracks
            streams: trackStreams,
            downloads: downloadsCount
          }
        };
      });

      // Sort by trending score descending and take top 8
      projectsWithScore.sort((a, b) => b.trending_score - a.trending_score);
      const topTrendingProjects = projectsWithScore.slice(0, 8);

      console.log('Top trending projects:', topTrendingProjects.length, topTrendingProjects.map(p => ({ id: p.id, title: p.title, score: p.trending_score })));

      setTrendingProjects(topTrendingProjects);
    } catch (err) {
      setErrorProjects("Failed to load trending projects.");
      console.error("Error fetching trending projects:", err);
    } finally {
      setLoadingProjects(false);
    }
  }, []);


  useEffect(() => {
    fetchTrendingProjects();
  }, [fetchTrendingProjects]);

  const handleCategoryClick = (categoryName: string) => {
    const path = `/home/${categoryName.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`
    navigate(path)
  }

  const filteredProjects = trendingProjects.filter(project => {
    if (activeCategory === "all") return true;

    const categoryMap: Record<string, string[]> = {
      "beats-instrumentals": ["beat", "instrumental", "lo-fi", "trap", "hip hop"],
      "vocal-production": ["vocal", "singing", "rapping", "vocals"],
      "mixing-mastering": ["mix", "master", "engineering", "audio"],
      "sound-packs": ["sample", "sound", "pack", "library"],
      "collaborate": ["collab", "feature", "joint"],
      "tutorials": ["tutorial", "lesson", "guide"]
    };

    const searchTerms = categoryMap[activeCategory] || [];
    return searchTerms.some(term =>
      project.title?.toLowerCase().includes(term) ||
      project.description?.toLowerCase().includes(term)
    );
  });


  return (
    <HomeLayout>
      <div className="flex-1 space-y-8 p-8 pt-6">

        {/* Quick Filters Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold tracking-tight">Browse Categories</h2>
            <Badge variant="outline" className="text-sm">
              {getCategories(categoryCounts).reduce((sum, cat) => sum + cat.count, 0).toLocaleString()} items
            </Badge>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
            
            <div className="flex items-center gap-1">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label className="mb-2 block">Price Range</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                      className="w-20"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                      className="w-20"
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="mb-2 block">BPM Range</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={bpmRange[0]}
                      onChange={(e) => setBpmRange([Number(e.target.value), bpmRange[1]])}
                      className="w-20"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={bpmRange[1]}
                      onChange={(e) => setBpmRange([bpmRange[0], Number(e.target.value)])}
                      className="w-20"
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="mb-2 block">Genre</Label>
                  <Select value={genreFilter} onValueChange={setGenreFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Genres" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Genres</SelectItem>
                      <SelectItem value="lo-fi">Lo-Fi</SelectItem>
                      <SelectItem value="trap">Trap</SelectItem>
                      <SelectItem value="house">House</SelectItem>
                      <SelectItem value="r&b">R&B</SelectItem>
                      <SelectItem value="electronic">Electronic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="mb-2 block">Quick Filters</Label>
                  <Select value={quickFilter} onValueChange={setQuickFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="popular">Popular</SelectItem>
                      <SelectItem value="new">New Arrivals</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {getCategories(categoryCounts).map((category) => (
            <Card 
              key={category.name} 
              className="hover:shadow-lg transition-all duration-300 cursor-pointer group border-2 border-transparent hover:border-primary/20"
              onClick={() => handleCategoryClick(category.name)}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-lg ${category.color}`}>
                    <category.icon className="h-8 w-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">{category.count.toLocaleString()} items</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <p className="text-sm text-muted-foreground mb-3">{category.description}</p>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className={category.color}>
                    Explore
                  </Badge>
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{(category.count * 10).toLocaleString()}+ views</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trending Genres */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Trending Genres</h2>
            <Button variant="outline" size="sm">
              View All Genres
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {trendingGenres.map((genre) => (
              <div key={genre.name} className="text-center group cursor-pointer">
                <div className={`w-16 h-16 rounded-full ${genre.color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                  <Music className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-medium text-sm mb-1">{genre.name}</h3>
                <p className="text-xs text-muted-foreground">{genre.count} projects</p>
              </div>
            ))}
          </div>
        </div>

        {/* Trending Now Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold tracking-tight">Trending Now</h2>
              <Badge variant="secondary" className="animate-pulse">
                <TrendingUp className="h-3 w-3 mr-1" />
                Live
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/trending')}
              >
                View All
              </Button>
            </div>
          </div>

          {loadingProjects ? (
            <PageLoading />
          ) : errorProjects ? (
            <div className="text-center text-red-500 py-8">{errorProjects}</div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <Music className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No trending projects yet</h3>
              <p className="text-muted-foreground mb-4">
                Be the first to upload a public project and start trending!
              </p>
              <Button onClick={() => navigate('/upload')}>
                Upload Your First Project
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} id={project.id} />
              ))}
            </div>
          )}
        </div>

        {/* Top Producers */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Top Producers</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/producers')}
            >
              View All Producers
            </Button>
          </div>

          {loadingProducers ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="p-4">
                  <div className="animate-pulse space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted rounded-full"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="h-6 bg-muted rounded w-20"></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-8 bg-muted rounded"></div>
                      <div className="h-8 bg-muted rounded"></div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : producersError ? (
            <div className="text-center text-red-500 py-8">
              Failed to load top producers. Please try again later.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topProducers.map((producer) => (
                <ProducerCard key={producer.username || producer.name} producer={producer} />
              ))}
            </div>
          )}
        </div>
      </div>
    </HomeLayout>
  )
}