'use client'

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/@/ui/badge"
import { SlidersHorizontal, DollarSign, Clock, Search, Filter, Grid, List } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { TrendingUp, Music } from "lucide-react"
import ProjectCard from "@/components/profile/music/ProjectCard"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Project } from "@/lib/types"
import { formatDuration } from "@/lib/utils"
import { PageLoading } from "@/components/ui/page-loading"

interface ProjectWithStats extends Project {
  stats?: {
    views: number;
    streams: number;
    downloads: number;
  };
}

export default function Homepage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [genreFilter, setGenreFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200])
  const [bpmRange, setBpmRange] = useState<[number, number]>([60, 180])
  const [keyFilter, setKeyFilter] = useState("all")
  const [quickFilter, setQuickFilter] = useState("all")
  const [trendingProjects, setTrendingProjects] = useState<ProjectWithStats[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [errorProjects, setErrorProjects] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredProjects = trendingProjects.filter(project => {
    const matchesSearch = project.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          project.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          project.creator_username?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = genreFilter === "all" || project.profiles?.professional_title?.toLowerCase().includes(genreFilter.toLowerCase());
    const matchesPrice = project.price ? (project.price >= priceRange[0] && project.price <= priceRange[1]) : true;
    const matchesBpm = true; // BPM filtering not available for projects directly

    let matchesQuickFilter = true;
    if (quickFilter === "popular") {
      matchesQuickFilter = project.stats ? project.stats.streams > 10 : false;
    } else if (quickFilter === "new") {
      const projectDate = new Date(project.created_at);
      const now = new Date();
      const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));
      matchesQuickFilter = projectDate > sevenDaysAgo;
    }

    return matchesSearch && matchesGenre && matchesPrice && matchesBpm && matchesQuickFilter;
  });

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">

      {/* Quick Filters Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold tracking-tight">Trending Now</h2>
          <Badge variant="secondary" className="animate-pulse">
            <TrendingUp className="h-3 w-3 mr-1" />
            Live
          </Badge>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Label htmlFor="price-range-input" className="text-sm text-muted-foreground">Price:</Label>
            <Input
              id="price-range-input"
              type="text"
              placeholder="50-150"
              value={priceRange[0] === 0 && priceRange[1] === 200 ? "" : `${priceRange[0]}-${priceRange[1]}`}
              onChange={(e) => {
                const [min, max] = e.target.value.split('-').map(Number);
                setPriceRange([isNaN(min) ? 0 : min, isNaN(max) ? 200 : max]);
              }}
              className="w-[120px] h-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="bpm-range-input" className="text-sm text-muted-foreground">BPM:</Label>
            <Input
              id="bpm-range-input"
              type="text"
              placeholder="80-120"
              value={bpmRange[0] === 60 && bpmRange[1] === 180 ? "" : `${bpmRange[0]}-${bpmRange[1]}`}
              onChange={(e) => {
                const [min, max] = e.target.value.split('-').map(Number);
                setBpmRange([isNaN(min) ? 60 : min, isNaN(max) ? 180 : max]);
              }}
              className="w-[120px] h-9"
            />
          </div>
          <Select value={genreFilter} onValueChange={setGenreFilter}>
            <SelectTrigger className="w-[180px]">
              <SlidersHorizontal className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter by Genre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genres</SelectItem>
              <SelectItem value="lo-fi">Lo-Fi</SelectItem>
              <SelectItem value="orchestral">Orchestral</SelectItem>
              <SelectItem value="trap">Trap</SelectItem>
              <SelectItem value="jazz">Jazz</SelectItem>
              <SelectItem value="folk">Folk</SelectItem>
              <SelectItem value="cinematic">Cinematic</SelectItem>
              <SelectItem value="pop">Pop</SelectItem>
            </SelectContent>
          </Select>
          <Select value={keyFilter} onValueChange={setKeyFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Key" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Keys</SelectItem>
              <SelectItem value="C Major">C Major</SelectItem>
              <SelectItem value="C Minor">C Minor</SelectItem>
              <SelectItem value="C# Major">C# Major</SelectItem>
              <SelectItem value="C# Minor">C# Minor</SelectItem>
              <SelectItem value="D Major">D Major</SelectItem>
              <SelectItem value="D Minor">D Minor</SelectItem>
              <SelectItem value="D# Major">D# Major</SelectItem>
              <SelectItem value="D# Minor">D# Minor</SelectItem>
              <SelectItem value="E Major">E Major</SelectItem>
              <SelectItem value="E Minor">E Minor</SelectItem>
              <SelectItem value="F Major">F Major</SelectItem>
              <SelectItem value="F Minor">F Minor</SelectItem>
              <SelectItem value="F# Major">F# Major</SelectItem>
              <SelectItem value="F# Minor">F# Minor</SelectItem>
              <SelectItem value="G Major">G Major</SelectItem>
              <SelectItem value="G Minor">G Minor</SelectItem>
              <SelectItem value="G# Major">G# Major</SelectItem>
              <SelectItem value="G# Minor">G# Minor</SelectItem>
              <SelectItem value="A Major">A Major</SelectItem>
              <SelectItem value="A Minor">A Minor</SelectItem>
              <SelectItem value="A# Major">A# Major</SelectItem>
              <SelectItem value="A# Minor">A# Minor</SelectItem>
              <SelectItem value="B Major">B Major</SelectItem>
              <SelectItem value="B Minor">B Minor</SelectItem>
            </SelectContent>
          </Select>
          <Select value={quickFilter} onValueChange={setQuickFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Quick Filters" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="popular">Popular</SelectItem>
              <SelectItem value="new">New Arrivals</SelectItem>
            </SelectContent>
          </Select>
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
                    <SelectItem value="producer">Producer</SelectItem>
                    <SelectItem value="composer">Composer</SelectItem>
                    <SelectItem value="artist">Artist</SelectItem>
                    <SelectItem value="musician">Musician</SelectItem>
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

      {/* Search Bar */}
      <div className="relative w-full mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search projects, producers..."
          className="pl-9 pr-4 py-2 w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Projects Display */}
      {loadingProjects ? (
        <PageLoading />
      ) : errorProjects ? (
        <div className="text-center text-red-500 py-8">{errorProjects}</div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <Music className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No projects found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your filters or be the first to upload a project!
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
  );
}
