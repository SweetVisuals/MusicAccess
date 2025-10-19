import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  SidebarHeader as BaseSidebarHeader,
  useSidebar,
} from "@/components/@/ui/sidebar";
import { Logo } from "@/components/ui/logo";

export function SidebarHeader() {
  const { state } = useSidebar()
  const isSidebarCollapsed = state === "collapsed"
  const navigate = useNavigate()

  return (
    <BaseSidebarHeader className="pt-1 pb-0 pl-10">
      <div onClick={() => navigate("/")} className="flex items-center cursor-pointer">
        <Logo
          showText={!isSidebarCollapsed}
          size="lg"
          variant="default"
          className="text-sidebar-foreground -mt-1"
        />
      </div>
    </BaseSidebarHeader>
  );
}
