import * as React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SidebarProvider } from "@/components/ui/sidebar";
import { SettingsSidebar } from "./settings/SettingsSidebar";
import { ProfileSettingsForm } from "./settings/ProfileSettingsForm";
import { AccountSettings } from "./settings/AccountSettings";

interface SettingsDialogProps {
  children?: React.ReactNode;
  onProfileUpdate?: () => void;
  profile?: any;
}

export function SettingsDialog({ children, onProfileUpdate, profile }: SettingsDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("Profile");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children || (
        <DialogTrigger asChild>
          <Button size="sm">Open Dialog</Button>
        </DialogTrigger>
      )}
      <DialogContent className="overflow-hidden p-0 md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <DialogDescription className="sr-only">
          Customize your settings here.
        </DialogDescription>
        <SidebarProvider className="items-start">
          <SettingsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
          <main className="flex h-[480px] flex-1 flex-col overflow-hidden">
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="#">Settings</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{activeTab}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0 sidebar-scrollbar">
              {activeTab === "Profile" && <ProfileSettingsForm setOpen={setOpen} onProfileUpdate={onProfileUpdate} profile={profile} />}
              {activeTab === "Appearance" && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Appearance settings coming soon</p>
                </div>
              )}
              {activeTab === "Privacy" && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Privacy settings coming soon</p>
                </div>
              )}
              {activeTab === "Account" && <AccountSettings setOpen={setOpen} />}
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  );
}
