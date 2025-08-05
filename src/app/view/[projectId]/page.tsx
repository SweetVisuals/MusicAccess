"use client";

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Project, Profile, UserProfile } from "@/lib/types";
import RecommendedProjectCard from "@/components/view/RecommendedProjectCard";
import ProjectCard from "@/components/profile/music/ProjectCard";
import UserInfoCard from "@/components/view/UserInfoCard";
import ProjectActionsCard from "@/components/view/ProjectActionsCard";
import ProjectView from "@/components/view/ProjectView";
import { useCart } from "@/contexts/cart-context";
import { toast } from "sonner";

export default function ViewPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [recommendedProjects, setRecommendedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    if (projectId) {
      const fetchData = async () => {
        setLoading(true);

        // Step 1: Resolve the full project ID
        const { data: fullIdData, error: rpcError } = await supabase.rpc(
          "get_full_project_id",
          { short_id: projectId }
        );

        if (rpcError || !fullIdData) {
          console.error("Error resolving full project ID:", rpcError);
          setProject(null);
          setLoading(false);
          return;
        }

        const fullProjectId = fullIdData;

        // Step 2: Fetch project details using the full ID
        const { data: projectData, error: projectError } = await supabase
          .from("projects")
          .select(
            `
            *,
            profiles (
              *,
              avatarUrl:avatar_url
            ),
            audio_tracks (
              *,
              price
            )
          `
          )
          .eq("id", fullProjectId)
          .single();

        if (projectError) {
          console.error("Error fetching project:", projectError);
          setProject(null);
        } else {
          setProject(projectData);

          // Fetch recommendations after project is fetched
          const fetchRecommendedProjects = supabase
            .from("projects")
            .select(
              `
              *,
              profiles (
                *,
                avatarUrl:avatar_url
              ),
              audio_tracks (*)
            `
            )
            .neq("id", fullProjectId)
            .limit(3);

          // Fetch recommended projects data
          const { data: recommendedProjectsData, error: recommendedProjectsError } = await fetchRecommendedProjects;
          
          if (recommendedProjectsError) {
            console.error("Error fetching recommended projects:", recommendedProjectsError);
          } else {
            setRecommendedProjects(recommendedProjectsData);
          }
        }
        setLoading(false);
      };
      fetchData();
    }
  }, [projectId]);

  const handleAddToCart = () => {
    if (project) {
      addToCart(project.id, "project");
      toast.success(`${project.title} added to cart`);
    }
  };

  const handleDownload = () => {
    if (project) {
      // Add download logic here
      toast.info(`Downloading project: ${project.title}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen">
        Project not found
      </div>
    );
  }

  return (
    <main className="flex-1 p-8 pt-16 overflow-y-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            <ProjectView
              project={project}
              onAddToCart={handleAddToCart}
              onDownload={handleDownload}
              allowDownloads={project.allow_downloads || false}
            />
            <div className="space-y-4">
              {project.profiles && (
                <UserInfoCard user={project.profiles as UserProfile} project={project} />
              )}
              {/* Comments Section */}
              <div className="mt-8 p-4 bg-card border rounded-lg shadow-sm">
                <h3 className="text-xl font-bold mb-4">Comments</h3>
                <div className="space-y-4">
                  <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
                  {/* Future: Add comment input and list */}
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-1 space-y-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-4">
                Recommended Projects
              </h2>
              <div className="space-y-4">
                {recommendedProjects.map((p) => (
                  <ProjectCard key={p.id} id={p.id} project={p} />
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>
  );
}
