import * as React from "react";
import {
  Bell,
  Link,
  Lock,
  Paintbrush,
  User
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const data = {
  nav: [
    { name: "Profile", icon: Paintbrush },
    { name: "Appearance", icon: Paintbrush },
    { name: "Privacy", icon: Lock },
    { name: "Notifications", icon: Bell },
    { name: "Connected accounts", icon: Link },
    { name: "Account", icon: User },
  ],
};

interface SettingsSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function SettingsSidebar({ activeTab, setActiveTab }: SettingsSidebarProps) {
  return (
    <Sidebar collapsible="none" className="hidden md:flex">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.nav.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    asChild
                    isActive={activeTab === item.name}
                    onClick={() => setActiveTab(item.name)}
                  >
                    <button type="button">
                      <item.icon />
                      <span>{item.name}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
