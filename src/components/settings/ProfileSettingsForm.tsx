import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useProfile from "@/hooks/useProfile";
import { Profile } from "@/lib/types";

const profileFormSchema = z.object({
  full_name: z.string({
    required_error: "Name is required",
    invalid_type_error: "Name must be a string",
  }).min(2, {
    message: "Name must be at least 2 characters.",
  }),
  username: z.string({
    invalid_type_error: "Username must be a string",
  }).optional(),
  bio: z.string({
    invalid_type_error: "Bio must be a string",
  }).max(500, {
    message: "Bio must not exceed 500 characters.",
  }).optional(),
  location: z.string({
    invalid_type_error: "Location must be a string",
  }).nullable().optional(),
  website_url: z.string({
    invalid_type_error: "Website must be a string",
  }).nullable().optional(),
  professional_title: z.string({
    invalid_type_error: "Producer badge must be a string",
  }).nullable().optional(),
  genres: z.string({
    invalid_type_error: "Genres must be a string",
  }).nullable().optional(),
  instruments: z.string({
    invalid_type_error: "Instruments must be a string",
  }).nullable().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileSettingsFormProps {
  setOpen: (open: boolean) => void;
  onProfileUpdate?: () => void;
  profile?: any;
}

export function ProfileSettingsForm({ setOpen, onProfileUpdate, profile: passedProfile }: ProfileSettingsFormProps) {
  const { profile: hookProfile, updateProfile, fetchProfile } = useProfile();
  const profile = passedProfile || hookProfile;

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      full_name: profile?.full_name || "",
      username: profile?.username || "",
      bio: profile?.bio || "",
      location: profile?.location || "",
      website_url: profile?.website_url || "",
      professional_title: profile?.professional_title || "",
      genres: profile?.genres?.join(", ") || "",
      instruments: profile?.instruments?.join(", ") || "",
    },
  });

  React.useEffect(() => {
    if (profile) {
      form.reset({
        full_name: profile.full_name || "",
        username: profile.username || "",
        bio: profile.bio || "",
        location: profile.location || "",
        website_url: profile.website_url || "",
        professional_title: profile.professional_title || "",
        genres: profile.genres?.join(", ") || "",
        instruments: profile.instruments?.join(", ") || "",
      });
    }
  }, [profile, form]);

  async function onSubmit(data: ProfileFormValues) {
    try {
      const payload: Partial<Profile> = { id: profile?.id };

      if (data.full_name !== profile?.full_name) {
        payload.full_name = data.full_name || undefined;
      }
      if (data.bio !== profile?.bio) {
        payload.bio = data.bio || undefined;
      }
      if (data.location !== profile?.location) {
        payload.location = data.location === '' ? null : data.location;
      }
      if (data.website_url !== profile?.website_url) {
        payload.website_url = data.website_url === '' ? null : data.website_url;
      }
      if (data.professional_title !== profile?.professional_title) {
        payload.professional_title = data.professional_title || undefined;
      }
      if (data.genres !== profile?.genres?.join(', ')) {
        payload.genres = data.genres 
          ? data.genres.split(",").map(g => g.trim()).filter(Boolean) 
          : undefined;
      }
      if (data.instruments !== profile?.instruments?.join(', ')) {
        payload.instruments = data.instruments 
          ? data.instruments.split(",").map(i => i.trim()).filter(Boolean) 
          : undefined;
      }

      await updateProfile(payload);
      
      // Refresh the profile data to ensure UI updates
      if (profile?.id) {
        await fetchProfile(profile.id);
      }
      
      // Reset the form with the updated profile data
      if (profile) {
        form.reset({
          full_name: data.full_name || "",
          username: profile.username || "",
          bio: data.bio || "",
          location: data.location || "",
          website_url: data.website_url || "",
          professional_title: data.professional_title || "",
          genres: data.genres || "",
          instruments: data.instruments || "",
        });
      }
      
      // Call the profile update callback if provided
      if (onProfileUpdate) {
        onProfileUpdate();
      }
      
      setOpen(false);
    } catch (error: any) {
      if (error && error.message) {
        console.error("Failed to update profile (Supabase):", error.message);
      } else {
        console.error("Failed to update profile:", error);
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Your name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Your username" 
                  {...field} 
                  disabled
                  className="opacity-70 cursor-not-allowed"
                />
              </FormControl>
              <FormDescription className="text-xs">
                Username cannot be changed
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us about yourself"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Your location" 
                  {...field} 
                  value={String(field.value ?? '')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="website_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website</FormLabel>
              <FormControl>
                <Input 
                  placeholder="https://example.com" 
                  {...field} 
                  value={String(field.value ?? '')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="professional_title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Producer Badge</FormLabel>
              <FormControl>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value ?? ''}
                  value={field.value ?? ''}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a badge" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Producer Badges</SelectLabel>
                      <SelectItem value="Producer">Producer</SelectItem>
                      <SelectItem value="Engineer">Engineer</SelectItem>
                      <SelectItem value="Artist">Artist</SelectItem>
                      <SelectItem value="DJ">DJ</SelectItem>
                      <SelectItem value="Songwriter">Songwriter</SelectItem>
                      <SelectItem value="Composer">Composer</SelectItem>
                      <SelectItem value="Beatmaker">Beatmaker</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormDescription>
                This badge will appear on your profile
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="genres"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Genres</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Hip Hop, Electronic, etc." 
                  {...field} 
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormDescription>
                Separate multiple genres with commas
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="instruments"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instruments</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Guitar, Piano, etc." 
                  {...field} 
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormDescription>
                Separate multiple instruments with commas
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            type="button"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button type="submit">Save changes</Button>
        </div>
      </form>
    </Form>
  );
}
