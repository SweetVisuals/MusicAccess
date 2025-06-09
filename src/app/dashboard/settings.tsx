import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { toast } from '@/hooks/use-toast';
import { AppSidebar } from "@/components/dashboard/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/@/ui/sidebar";
import { SiteHeader } from "@/components/dashboard/layout/site-header";

export default function SettingsPage() {
  const { user } = useAuth();
  const [fileCount, setFileCount] = useState(0);

  useEffect(() => {
    if (user) {
      const fetchFileCount = async () => {
        const { count, error } = await supabase
          .from('files')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching file count:', error);
        } else {
          setFileCount(count || 0);
        }
      };

      fetchFileCount();
    }
  }, [user]);

  const handleDeleteProfile = async () => {
    if (fileCount > 0) {
      toast({
        title: 'Error',
        description: `You must delete all your files before you can delete your profile. You currently have ${fileCount} files.`,
        variant: 'destructive',
      });
      return;
    }

    if (window.confirm('Are you sure you want to delete your profile? This action cannot be undone.')) {
      if(user){
        const { error } = await supabase.rpc('delete_user_profile', { user_id_to_delete: user.id });
        if (error) {
          toast({
            title: 'Error deleting profile',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Profile deleted',
            description: 'Your profile has been successfully deleted.',
          });
          // Log out the user after profile deletion
          await supabase.auth.signOut();
          window.location.href = '/';
        }
      }
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-4 animate-fade-in p-6">
            <div className="space-y-4">
              <h1 className="text-2xl font-bold">Settings</h1>
              <Card>
                <CardHeader>
                  <CardTitle>User Settings</CardTitle>
                  <CardDescription>Manage your account settings.</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Add user settings form here */}
                  <p>User settings will be available here in a future update.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Delete Profile</CardTitle>
                  <CardDescription>Permanently delete your account and all associated data.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Before deleting your profile, you must delete all of your uploaded files. You currently have {fileCount} files.
                  </p>
                  <Button variant="destructive" onClick={handleDeleteProfile} disabled={fileCount > 0}>
                    Delete Profile
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
