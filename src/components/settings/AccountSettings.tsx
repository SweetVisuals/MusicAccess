import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";

interface AccountSettingsProps {
  setOpen: (open: boolean) => void;
}

export function AccountSettings({ setOpen }: AccountSettingsProps) {
  const { user, signOut } = useAuth();

  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.functions.invoke('delete-user');

      if (error) {
        throw error;
      }

      await signOut();
      setOpen(false);
      // You might want to redirect the user to the homepage or a "goodbye" page here
    } catch (error) {
      console.error('Failed to delete account:', error);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-medium">Account</h3>
      <p className="text-sm text-muted-foreground">
        Manage your account settings.
      </p>
      <div className="mt-6">
        <h4 className="text-md font-medium">Delete Account</h4>
        <p className="text-sm text-muted-foreground mt-1">
          Permanently delete your account and all of your content. This action is not reversible.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="mt-4">
              Delete Profile
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                account and remove your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAccount}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
