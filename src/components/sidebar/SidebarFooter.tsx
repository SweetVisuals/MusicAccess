import * as React from "react";
import { NavUser } from "@/components/homepage/nav-user";
import { SidebarFooter as BaseSidebarFooter } from "@/components/@/ui/sidebar";

export function SidebarFooter() {
  return (
    <BaseSidebarFooter>
      <NavUser />
    </BaseSidebarFooter>
  );
}
