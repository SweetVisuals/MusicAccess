import React, { useState, useEffect } from 'react';
import { HomeLayout } from "@/components/layout/HomeLayout";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import ProjectCard from "@/components/profile/music/ProjectCard";
import { Search, SlidersHorizontal, DollarSign, Music, Clock, ArrowLeft, Bookmark, Library } from "lucide-react";
import { Link } from "react-router-dom";
import { useBookmarks } from "@/hooks/useBookmarks";
import { supabase } from "@/lib/supabase";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/@/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/@/ui/tabs";

// Placeholder data for library projects
const libraryProjects = [
  {
    id: "lib-1",
    user_id: "user1",
    created_at: new Date("2025-06-15T10:00:00Z").toISOString(),
    updated_at: new Date().toISOString(),
    title: "Morning Chill Beats",
    artworkUrl: "https://images.pexels.com/photos/1779487/pexels-photo-1779487.jpeg",
    tracks: [{ id: "lib-1-1", title: "Sunrise Vibes", duration: "2:50" }],
    totalTracks: 1,
    isPopular: true,
    creator: {
      name: "BeatMaster",
      avatar: "https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg",
      tag: "Producer"
    },
    price: 25,
    bpm: 80,
    key: "C Major",
    genre: "Lo-Fi"
  },
  {
    id: "lib-2",
    user_id: "user2",
    created_at: new Date("2025-06-10T14:30:00Z").toISOString(),
    updated_at: new Date().toISOString(),
    title: "Cinematic Adventure",
    artworkUrl: "https://images.pexels.com/photos/1644616/pexels-photo-1644616.jpeg",
    tracks: [{ id: "lib-2-1", title: "Epic Journey", duration: "4:30" }],
    totalTracks: 1,
    isPopular: false,
    creator: {
      name: "FilmScorer",
      avatar: "https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg",
      tag: "Composer"
    },
    price: 150,
    bpm: 120,
    key: "D Minor",
    genre: "Cinematic"
  },
  {
    id: "lib-3",
    user_id: "user3",
    created_at: new Date("2025-06-18T09:15:00Z").toISOString(),
    updated_at: new Date().toISOString(),
    title: "Urban Trap Collection",
    artworkUrl: "https://images.pexels.com/photos/1389429/pexels-photo-1389429.jpeg",
    tracks: [{ id: "lib-3-1", title: "City Nights", duration: "3:10" }],
    totalTracks: 1,
    isPopular: true,
    creator: {
      name: "TrapKing",
      avatar: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg",
      tag: "Beat Maker"
    },
    price: 40,
    bpm: 140,
    key: "G Minor",
    genre: "Trap"
  },
  {
    id: "lib-4",
    user_id: "user4",
    created_at: new Date("2025-06-05T11:00:00Z").toISOString(),
    updated_at: new Date().toISOString(),
    title: "Jazz Fusion Sessions",
    artworkUrl: "https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg",
    tracks: [{ id: "lib-4-1", title: "Smooth Groove", duration: "3:55" }],
    totalTracks: 1,
    isPopular: false,
    creator: {
      name: "JazzFlow",
      avatar: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg",
      tag: "Musician"
    },
    price: 75,
    bpm: 95,
    key: "Bb Major",
    genre: "Jazz"
  }
];

// Placeholder data for bookmarked projects
const bookmarkedProjects = [
  {
    id: "bm-1",
    user_id: "user5",
    created_at: new Date("2025-06-19T16:00:00Z").toISOString(),
    updated_at: new Date().toISOString(),
    title: "Acoustic Folk Collection",
    artworkUrl: "https://images.pexels.com/photos/1751731/pexels-photo-1751731.jpeg",
    tracks: [{ id: "bm-1-1", title: "Forest Song", duration: "3:20" }],
    totalTracks: 1,
    isPopular: true,
    creator: {
      name: "NatureTunes",
      avatar: "https://images.pexels.com/photos/1587009/pexels-photo-1587009.jpeg",
      tag: "Acoustic Artist"
    },
    price: 30,
    bpm: 110,
    key: "E Major",
    genre: "Folk"
  },
  {
    id: "bm-2",
    user_id: "user6",
    created_at: new Date("2025-06-12T08:45:00Z").toISOString(),
    updated_at: new Date().toISOString(),
    title: "Orchestral Masterpiece",
    artworkUrl: "https://images.pexels.com/photos/1694900/pexels-photo-1694900.jpeg",
    tracks: [{ id: "bm-2-1", title: "Hero's Journey", duration: "5:10" }],
    totalTracks: 1,
    isPopular: true,
    creator: {
      name: "SymphonySounds",
      avatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg",
      tag: "Composer"
    },
    price: 200,
    bpm: 70,
    key: "A Minor",
    genre: "Orchestral"
  },
  {
    id: "bm-3",
    user_id: "user7",
    created_at: new Date("2025-06-01T13:00:00Z").toISOString(),
    updated_at: new Date().toISOString(),
    title: "Pop Instrumental Pack",
    artworkUrl: "https://images.pexels.com/photos/1537638/pexels-photo-1537638.jpeg",
    tracks: [{ id: "bm-3-1", title: "Sunny Day", duration: "2:40" }],
    totalTracks: 1,
    isPopular: false,
    creator: {
      name: "PopVibes",
      avatar: "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg",
      tag: "Producer"
    },
    price: 35,
    bpm: 128,
    key: "F Major",
    genre: "Pop"
  }
];

export default function LibraryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [genreFilter, setGenreFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);
  const [bpmRange, setBpmRange] = useState<[number, number]>([60, 180]);
  const [keyFilter, setKeyFilter] = useState("all");
  const [quickFilter, setQuickFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("library");
  const [bookmarkedProjects, setBookmarkedProjects] = useState<any[]>([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);

  const { bookmarkedProjectIds, loading: bookmarksLoading } = useBookmarks();

  const filterProjects = (projects: typeof libraryProjects) => {
    return projects.filter(project => {
      const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            project.creator.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGenre = genreFilter === "all" || project.genre?.toLowerCase().includes(genreFilter.toLowerCase());
      const matchesType = typeFilter === "all" || project.totalTracks === (typeFilter === "single" ? 1 : 3);
      const matchesPrice = project.price >= priceRange[0] && project.price <= priceRange[1];
      const matchesBpm = project.bpm >= bpmRange[0] && project.bpm <= bpmRange[1];
      const matchesKey = keyFilter === "all" || project.key === keyFilter;

      let matchesQuickFilter = true;
      if (quickFilter === "popular") {
        matchesQuickFilter = project.isPopular;
      } else if (quickFilter === "new") {
        const projectDate = new Date(project.created_at);
        const now = new Date();
        const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));
        matchesQuickFilter = projectDate > sevenDaysAgo;
      }

      return matchesSearch && matchesGenre && matchesType && matchesPrice && matchesBpm && matchesKey && matchesQuickFilter;
    });
  };

  // Helper function to check if string is a valid UUID
  const isValidUUID = (str: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  // Fetch bookmarked projects when bookmarkedProjectIds change
  useEffect(() => {
    const fetchBookmarkedProjects = async () => {
      console.log('Fetching bookmarked projects for IDs:', bookmarkedProjectIds);

      if (bookmarkedProjectIds.length === 0) {
        console.log('No bookmarked project IDs, setting empty array');
        setBookmarkedProjects([]);
        setLoadingBookmarks(false);
        return;
      }

      // Filter out invalid UUIDs
      const validProjectIds = bookmarkedProjectIds.filter(id => isValidUUID(id));
      console.log('Valid project IDs after filtering:', validProjectIds);

      if (validProjectIds.length === 0) {
        console.log('No valid project IDs, setting empty array');
        setBookmarkedProjects([]);
        setLoadingBookmarks(false);
        return;
      }

      try {
        setLoadingBookmarks(true);
        console.log('Querying database for projects:', validProjectIds);

        const { data, error } = await supabase
          .from('projects')
          .select(`
            *,
            profiles:user_id (
              full_name,
              username,
              avatar_url,
              professional_title
            ),
            audio_tracks (*)
          `)
          .in('id', validProjectIds)
          .order('created_at', { ascending: false });

        if (error) throw error;

        console.log('Database returned projects:', data);

        // Transform the data to match the expected format
        const transformedProjects = (data || []).map(project => ({
          id: project.id,
          user_id: project.user_id,
          created_at: project.created_at,
          updated_at: project.updated_at,
          title: project.title,
          cover_image_url: project.cover_image_url,
          artworkUrl: project.cover_image_url,
          tracks: project.audio_tracks || [],
          totalTracks: project.audio_tracks?.length || 0,
          isPopular: project.is_popular || false,
          profiles: project.profiles,
          creator_username: project.profiles?.username,
          project_files: [], // Will be populated by the component if needed
          audio_tracks: (project.audio_tracks || []).map(track => ({
            ...track,
            duration_seconds: track.duration_seconds || track.duration || 0
          })),
          allow_downloads: project.allow_downloads,
          contract_url: project.contract_url,
          creator: {
            name: project.profiles?.full_name || 'Creator',
            avatar: project.profiles?.avatar_url || '',
            tag: project.profiles?.professional_title || 'User'
          },
          price: project.price,
          bpm: project.bpm,
          key: project.key,
          genre: project.genre
        }));

        console.log('Transformed projects:', transformedProjects);
        setBookmarkedProjects(transformedProjects);
      } catch (error) {
        console.error('Error fetching bookmarked projects:', error);
        setBookmarkedProjects([]);
      } finally {
        setLoadingBookmarks(false);
      }
    };

    // Only fetch if bookmarks are not loading
    if (!bookmarksLoading) {
      fetchBookmarkedProjects();
    }
  }, [bookmarkedProjectIds, bookmarksLoading]);

  const filteredLibraryProjects = filterProjects(libraryProjects);
  // Don't apply filters to bookmarked projects - show all bookmarks
  const filteredBookmarkedProjects = bookmarkedProjects;

  const availableKeys = Array.from(new Set([
    ...libraryProjects.map(p => p.key),
    ...bookmarkedProjects.map(p => p.key)
  ])).sort();

  return (
    <HomeLayout>
      <div className="flex-1 space-y-8 p-8 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link to="/home/homepage" className="text-muted-foreground hover:text-primary transition-colors duration-300 ease-in-out">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <h2 className="text-2xl font-bold tracking-tight">My Library</h2>
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
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="single">Single Track</SelectItem>
                <SelectItem value="ep">EP (Multiple Tracks)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={keyFilter} onValueChange={setKeyFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Key" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Keys</SelectItem>
                {availableKeys.map(key => (
                  <SelectItem key={key} value={key}>{key}</SelectItem>
                ))}
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

        {/* Search Bar */}
        <div className="relative w-full mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search your library..."
            className="pl-9 pr-4 py-2 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Tabs for Library/Bookmarked */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="library" className="flex items-center gap-2">
              <Library className="h-4 w-4" />
              Library ({filteredLibraryProjects.length})
            </TabsTrigger>
            <TabsTrigger value="bookmarked" className="flex items-center gap-2">
              <Bookmark className="h-4 w-4" />
              Bookmarked ({bookmarksLoading || loadingBookmarks ? '...' : bookmarkedProjects.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredLibraryProjects.length > 0 ? (
                filteredLibraryProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    variant="grid"
                    id={project.id}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Library className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No library items found</h3>
                  <p className="text-sm text-muted-foreground">Try adjusting your search filters</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="bookmarked" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(bookmarksLoading || loadingBookmarks) ? (
                <div className="col-span-full text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-sm text-muted-foreground">Loading bookmarks...</p>
                </div>
              ) : bookmarkedProjects.length > 0 ? (
                bookmarkedProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    variant="grid"
                    id={project.id}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No bookmarked items found</h3>
                  <p className="text-sm text-muted-foreground">Try adjusting your search filters</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </HomeLayout>
  );
}