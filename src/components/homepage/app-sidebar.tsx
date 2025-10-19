import * as React from "react";
import { useAuth } from "@/contexts/auth-context";
import { Sidebar } from "@/components/@/ui/sidebar";
import { SidebarHeader } from "../sidebar/SidebarHeader";
import { SidebarContent } from "../sidebar/SidebarContent";
import { SidebarFooter } from "../sidebar/SidebarFooter";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isLoading } = useAuth();

  if (isLoading) return null;

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader />
      <SidebarContent />
      <SidebarFooter />
    </Sidebar>
  );
}
