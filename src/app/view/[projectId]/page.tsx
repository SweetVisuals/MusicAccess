"use client";

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Project } from "@/lib/types";
import ProjectView from "@/components/view/ProjectView";
import RecommendedProjectCard from "@/components/view/RecommendedProjectCard";
import { SiteHeader } from "@/components/homepage/site-header";
import { AppSidebar } from "@/components/homepage/app-sidebar";

export default function ViewPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [recommendations, setRecommendations] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      const fetchProject = async () => {
        const { data, error } = await supabase
          .from("projects")
          .select(
            `
            *,
            profiles (
              username,
              avatar_url
            )
          `
          )
          .eq("id", projectId)
          .single();

        if (error) {
          console.error("Error fetching project:", error);
        } else {
          setProject(data);
        }
      };

      const fetchRecommendations = async () => {
        const { data, error } = await supabase
          .from("projects")
          .select(
            `
            *,
            profiles (
              username,
              avatar_url
            )
          `
          )
          .neq("id", projectId)
          .limit(5);

        if (error) {
          console.error("Error fetching recommendations:", error);
        } else {
          setRecommendations(data);
        }
      };

      Promise.all([fetchProject(), fetchRecommendations()]).finally(() =>
        setLoading(false)
      );
    }
  }, [projectId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!project) {
    return <div>Project not found</div>;
  }

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <div className="flex flex-col flex-1">
        <SiteHeader />
        <main className="flex-1 p-4 overflow-y-auto">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            <div className="lg:col-span-3">
              <ProjectView project={project} />
            </div>
            <div className="space-y-6">
              <h2 className="text-2xl font-bold tracking-tight">
                Recommended Projects
              </h2>
              <div className="space-y-4">
                {recommendations.map((p) => (
                  <RecommendedProjectCard key={p.id} project={p} />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
