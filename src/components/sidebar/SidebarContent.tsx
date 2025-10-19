import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Users,
  MessageSquare,
  FileText,
  Settings,
  HelpCircle,
  TrendingUp,
  Mic2,
  Headphones,
  Upload,
  PlusCircle,
  Library,
} from "lucide-react";
import { NavDocuments } from "@/components/homepage/nav-documents";
import { NavMain } from "@/components/dashboard/layout/nav-main";
import { NavSecondary } from "@/components/dashboard/layout/nav-secondary";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { SidebarContent as BaseSidebarContent } from "@/components/@/ui/sidebar";
import { Button } from "@/components/@/ui/button";
import { Badge } from "@/components/@/ui/badge";

const data = {
  navMain: [
    {
      title: "Discover",
      url: "/",
      icon: Search,
      description: "Find new music and creators",
    },
    {
      title: "Browse Talent",
      url: "/browse",
      icon: Users,
      description: "Connect with professionals",
    },
    {
      title: "Collaborate",
      url: "/collaborate",
      icon: MessageSquare,
      description: "Work on projects together",
    },
    {
      title: "My Studio",
      url: "/dashboard/studio",
      icon: Headphones,
      description: "Your creative workspace",
    },
    {
      title: "Analytics",
      url: "/dashboard/analytics",
      icon: TrendingUp,
      description: "Track your performance",
    },
  ],
  navSecondary: [
    {
      title: "Tutorials",
      url: "/tutorials",
      icon: FileText,
      description: "Learn production techniques",
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
      description: "Customize your experience",
    },
    {
      title: "Help Center",
      url: "/help",
      icon: HelpCircle,
      description: "Get support and guidance",
    },
  ],
  quickActions: [
    {
      title: "Upload Track",
      url: "/upload",
      icon: Upload,
      variant: "secondary" as const,
    },
    {
      title: "New Project",
      url: "/projects/new",
      icon: PlusCircle,
      variant: "outline" as const,
    },
  ],
  library: [
    {
      title: "My Library",
      url: "/home/library",
      icon: Library,
      description: "Your saved projects and bookmarks",
    },
  ],
};

export function SidebarContent() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCreateNewProject = () => {
    // Special case: navigate with state to show create dialog
    navigate("/dashboard/studio", { state: { showCreateDialog: true } });
  };

  const filteredNavMain = user
    ? data.navMain
    : data.navMain.filter(
        item => item.title === "Discover" || item.title === "Browse Talent"
      );

  return (
    <BaseSidebarContent className="flex flex-col gap-4 py-4 sidebar-scrollbar">
      {/* Quick Actions for logged-in users */}
      {user && (
        <div className="px-3">
          <div className="flex flex-col gap-2">
            <h4 className="text-[11px] font-semibold text-sidebar-foreground/70 uppercase tracking-wider mb-1">
              Quick Actions
            </h4>
            <div className="flex flex-col gap-1.5">
              {data.quickActions.map((action) => {
                if (action.title === "New Project") {
                  return (
                    <Button
                      key={action.title}
                      variant={action.variant}
                      size="sm"
                      className="w-full justify-start gap-2 h-8 text-xs font-medium transition-colors duration-150 ease-out hover:bg-sidebar-accent/60"
                      onClick={handleCreateNewProject}
                    >
                      <action.icon className="h-3.5 w-3.5" />
                      {action.title}
                    </Button>
                  );
                }
                return (
                  <Button
                    key={action.title}
                    variant={action.variant}
                    size="sm"
                    className="w-full justify-start gap-2 h-8 text-xs font-medium transition-colors duration-150 ease-out hover:bg-sidebar-accent/60"
                    onClick={() => navigate(action.url)}
                  >
                    <action.icon className="h-3.5 w-3.5" />
                    {action.title}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <NavMain 
        items={filteredNavMain} 
        showQuickActions={!!user}
        title="Navigation"
      />

      {/* Following Section for logged-in users */}
      {user && (
        <NavDocuments />
      )}

      {/* Library Section for logged-in users */}
      {user && (
        <div className="px-3">
          <div className="flex flex-col gap-2">
            <h4 className="text-[11px] font-semibold text-sidebar-foreground/70 uppercase tracking-wider mb-1">
              Library
            </h4>
            <div className="flex flex-col gap-1.5">
              {data.library.map((item) => (
                <Button
                  key={item.title}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 h-8 text-xs font-medium transition-colors duration-150 ease-out hover:bg-sidebar-accent/60"
                  onClick={() => navigate(item.url)}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.title}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Secondary Navigation */}
      <NavSecondary 
        items={data.navSecondary} 
        className="mt-auto border-t border-sidebar-border/40 pt-4"
        title="Resources"
      />
    </BaseSidebarContent>
  );
}
