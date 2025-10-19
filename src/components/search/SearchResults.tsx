"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ProfileCard from "@/components/profile/ProfileCard";
import ProjectCard from "@/components/profile/music/ProjectCard";

interface SearchResultsProps {
  query: string | null;
}

const SearchResults = ({ query }: SearchResultsProps) => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("search_all", {
        search_term: query,
      });

      if (error) {
        console.error("Error searching:", error);
      } else {
        setProfiles(data.filter((item: any) => item.type === "profile"));
        setProjects(data.filter((item: any) => item.type === "project"));
      }
      setLoading(false);
    };

    fetchResults();
  }, [query]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {profiles.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Profiles</h2>
          <div className="flex flex-col gap-4">
            {profiles.map((profile) => (
              <ProfileCard key={profile.id} profile={profile} id={profile.id} />
            ))}
          </div>
        </div>
      )}

      {projects.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Projects</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} id={project.id} />
            ))}
          </div>
        </div>
      )}

      {profiles.length === 0 && projects.length === 0 && (
        <div>No results found.</div>
      )}
    </div>
  );
};

export default SearchResults;