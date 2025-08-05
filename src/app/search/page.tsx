import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Input } from "@/components/@/ui/input";
import { Button } from "@/components/@/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/@/ui/tabs";
import { Search } from "lucide-react";
import { Separator } from "@/components/@/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/@/ui/avatar";
import ProjectCard from "@/components/profile/music/ProjectCard"; // Import ProjectCard
import { Project, Profile, SearchResultItem } from "@/lib/types";
import { supabase } from "@/lib/supabase"; // Import Supabase client

export default function SearchPage() {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSearchTerm, setCurrentSearchTerm] = useState('');
  const [profileResults, setProfileResults] = useState<SearchResultItem[]>([]);
  const [projectResults, setProjectResults] = useState<Project[]>([]); // Changed to Project[]
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('q');
    console.log('useEffect: location.search changed, query param:', query);
    if (query) {
      const decodedQuery = decodeURIComponent(query);
      setSearchQuery(decodedQuery);
      setCurrentSearchTerm(decodedQuery);
      // Trigger search when component mounts with a query
      console.log('useEffect: Triggering search with decodedQuery:', decodedQuery);
      handleSearch(decodedQuery);
    } else {
      // Clear results if no query is present
      setProfileResults([]);
      setProjectResults([]);
      setCurrentSearchTerm('');
    }
  }, [location.search]);

  const handleSearch = async (query: string) => {
    console.log('handleSearch called with query:', query);
    if (!query.trim()) {
      console.log('Search query is empty or just whitespace, returning.');
      setProfileResults([]);
      setProjectResults([]);
      return;
    }

    setLoading(true);
    setCurrentSearchTerm(query.trim());
    console.log(`Searching for: ${query.trim()}`);

    try {
      console.log('Calling Supabase RPC search_profiles_and_projects with search_term:', query.trim());
      const { data, error } = await supabase.rpc('search_profiles_and_projects', { search_term: query.trim() });

      if (error) {
        console.error('Supabase RPC Error searching:', error);
        // Optionally, show a toast notification
        // toast.error('Failed to perform search.');
        setProfileResults([]);
        setProjectResults([]);
        return;
      }
      console.log('Supabase RPC Data received:', data);

      const profiles: SearchResultItem[] = [];
      const projects: SearchResultItem[] = [];

      data.forEach((item: SearchResultItem) => {
        if (item.type === 'profile') {
          profiles.push(item);
        } else if (item.type === 'project') {
          projects.push(item);
        }
      });

      setProfileResults(profiles);
      // Initialize projectResults with basic Project structure from SearchResultItem
      const initialProjects: Project[] = projects.map(p => ({
        id: p.id,
        user_id: '', // Placeholder
        title: p.title,
        description: p.description,
        cover_image_url: p.cover_image_url,
        cover_art_url: p.cover_image_url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        creator_username: p.username,
        profiles: {
          id: '',
          full_name: p.full_name,
          username: p.username,
          bio: p.bio,
          avatarUrl: p.cover_image_url,
          location: null, website_url: null, bannerUrl: '', createdAt: '', updatedAt: ''
        },
        audio_tracks: [], // Initially empty
        allow_downloads: false,
        isPopular: false,
        tags: [],
        price: 0,
        gems: 0,
      }));
      setProjectResults(initialProjects);

      // Fetch audio tracks for each project
      await fetchAudioTracksForProjects(initialProjects);

    } catch (error) {
      console.error('Unexpected error during search:', error);
      // toast.error('An unexpected error occurred.');
      setProfileResults([]);
      setProjectResults([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAudioTracksForProjects = async (projects: Project[]) => { // Changed parameter type to Project[]
    if (projects.length === 0) return;

    const projectIds = projects.map(p => p.id);
    console.log('Fetching audio tracks for project IDs:', projectIds);

    try {
      const { data: tracksData, error } = await supabase
        .from('audio_tracks')
        .select('*')
        .in('project_id', projectIds);

      if (error) {
        console.error('Error fetching audio tracks:', error);
        return;
      }

      console.log('Audio tracks data received:', tracksData);

      const updatedProjects = projects.map(project => {
        const tracks = tracksData.filter(track => track.project_id === project.id);
        // Create a full Project object from Project and fetched tracks
        const fullProject: Project = {
          ...project, // Spread existing project properties
          audio_tracks: tracks, // Assign fetched tracks
        };
        return fullProject;
      });

      setProjectResults(updatedProjects); // Update state with full Project objects
      console.log('Updated project results with audio tracks:', updatedProjects);

    } catch (error) {
      console.error('Unexpected error fetching audio tracks:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery);
    }
  };

  return (
    <div className="container mx-auto pl-4 pr-4 py-8">
      <div className="flex items-baseline mb-6">
        <h1 className="text-xl font-bold">Search Results</h1>
        {loading ? (
          <div className="text-center text-muted-foreground ml-4">Loading results...</div>
        ) : (
          <>
            {currentSearchTerm && (
              <p className="text-sm text-muted-foreground ml-2">
                Showing results for "<span className="font-semibold text-foreground">{currentSearchTerm}</span>"
              </p>
            )}
          </>
        )}
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground"></div>
      ) : (
        <>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3 md:w-[400px] mb-6">
              <TabsTrigger value="all">All ({profileResults.length + projectResults.length})</TabsTrigger>
              <TabsTrigger value="profiles">Profiles ({profileResults.length})</TabsTrigger>
              <TabsTrigger value="projects">Projects ({projectResults.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <h2 className="text-2xl font-semibold mb-4">Profiles</h2>
              <Separator className="mb-4" />
              {profileResults.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profileResults.map((profile) => (
                    <div key={profile.id} className="border rounded-lg p-4 flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={profile.cover_image_url || ''} alt={profile.full_name} />
                        <AvatarFallback>{profile.full_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{profile.full_name}</h3>
                        <p className="text-sm text-muted-foreground">@{profile.username}</p>
                        <p className="text-xs text-muted-foreground">{profile.bio}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No profiles found.</p>
              )}

              <h2 className="text-2xl font-semibold mt-8 mb-4">Projects</h2>
              <Separator className="mb-4" />
              {projectResults.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projectResults.map((project) => (
                    <ProjectCard key={project.id} project={project} id={project.id} />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No projects found.</p>
              )}
            </TabsContent>

            <TabsContent value="profiles">
              <h2 className="text-2xl font-semibold mb-4">Profiles</h2>
              <Separator className="mb-4" />
              {profileResults.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profileResults.map((profile) => (
                    <div key={profile.id} className="border rounded-lg p-4 flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={profile.cover_image_url || ''} alt={profile.full_name} />
                        <AvatarFallback>{profile.full_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{profile.full_name}</h3>
                        <p className="text-sm text-muted-foreground">@{profile.username}</p>
                        <p className="text-xs text-muted-foreground">{profile.bio}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No profiles found.</p>
              )}
            </TabsContent>

            <TabsContent value="projects">
              <h2 className="text-2xl font-semibold mb-4">Projects</h2>
              <Separator className="mb-4" />
              {projectResults.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projectResults.map((project) => (
                    <ProjectCard key={project.id} project={project} id={project.id} />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No projects found.</p>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
