"use client"

import { useState } from "react"
import {
  Globe,
  Link,
  ListMusic,
  MapPin,
  Plus,
  Settings,
  Tag,
  Trash,
  User,
  X,
  Briefcase,
  Share2,
  Palette,
  Lock,
  Music,
  DollarSign,
  Clock,
  Mail,
  BarChart2,
  ArrowUp,
  ArrowDown,
  GripVertical
} from "lucide-react"
import useProfile from "@/hooks/useProfile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/@/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"

const navItems = [
  { name: "Basic Info", icon: User },
  { name: "Professional Info", icon: Briefcase },
  { name: "Social Media", icon: Share2 },
  { name: "Links", icon: Link },
  { name: "Tags", icon: Tag },
  { name: "Appearance", icon: Palette },
  { name: "Privacy", icon: Lock },
  { name: "Tab Settings", icon: ListMusic },
]

export function SettingsDialogContent() {
  const { profile, updateProfile } = useProfile()
  const [activeSection, setActiveSection] = useState("Basic Info")

  const renderContent = () => {
    const [newLink, setNewLink] = useState("")
    const [newTag, setNewTag] = useState("")

    const handleAddLink = () => {
      if (!newLink.trim()) return;
      updateProfile({
        links: [...(profile.links || []), newLink.trim()]
      });
      setNewLink("");
    };

    const handleRemoveLink = (index: number) => {
      const updatedLinks = [...(profile.links || [])];
      updatedLinks.splice(index, 1);
      updateProfile({ links: updatedLinks });
    };

    const handleAddTag = () => {
      if (!newTag.trim()) return;
      updateProfile({
        tags: [...(profile.tags || []), newTag.trim()]
      });
      setNewTag("");
    };

    const handleRemoveTag = (index: number) => {
      const updatedTags = [...(profile.tags || [])];
      updatedTags.splice(index, 1);
      updateProfile({ tags: updatedTags });
    };

    const [newSocialPlatform, setNewSocialPlatform] = useState("")
    const [newSocialUrl, setNewSocialUrl] = useState("")
    const [newGenre, setNewGenre] = useState("")
    const [newInstrument, setNewInstrument] = useState("")

    const handleAddSocialLink = () => {
      if (!newSocialPlatform.trim() || !newSocialUrl.trim()) return;
      updateProfile({
        socialLinks: [...(profile.socialLinks || []), {
          platform: newSocialPlatform.trim(),
          url: newSocialUrl.trim()
        }]
      });
      setNewSocialPlatform("");
      setNewSocialUrl("");
    };

    const handleRemoveSocialLink = (index: number) => {
      const updatedSocialLinks = [...(profile.socialLinks || [])];
      updatedSocialLinks.splice(index, 1);
      updateProfile({ socialLinks: updatedSocialLinks });
    };

    const handleAddGenre = () => {
      if (!newGenre.trim()) return;
      updateProfile({
        genres: [...(profile.genres || []), newGenre.trim()]
      });
      setNewGenre("");
    };

    const handleAddInstrument = () => {
      if (!newInstrument.trim()) return;
      updateProfile({
        instruments: [...(profile.instruments || []), newInstrument.trim()]
      });
      setNewInstrument("");
    };

    switch(activeSection) {
      case "Basic Info":
        return (
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={profile.name || ""}
                onChange={(e) => updateProfile({ name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profile.bio || ""}
                onChange={(e) => updateProfile({ bio: e.target.value })}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <div className="flex gap-2">
                <Input
                  id="location"
                  value={profile.location || ""}
                  onChange={(e) => updateProfile({ location: e.target.value })}
                />
                <Button variant="outline" size="icon">
                  <MapPin className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        );
      case "Professional Info":
        return (
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <Label htmlFor="professionalTitle">Professional Title</Label>
              <Input
                id="professionalTitle"
                value={profile.professionalTitle || ""}
                onChange={(e) => updateProfile({ professionalTitle: e.target.value })}
                placeholder="e.g. Music Producer, Sound Engineer"
              />
            </div>

            <div className="space-y-2">
              <Label>Genres</Label>
              <div className="flex gap-2">
                <Input
                  value={newGenre}
                  onChange={(e) => setNewGenre(e.target.value)}
                  placeholder="Add a genre"
                />
                <Button onClick={handleAddGenre}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.genres?.map((genre, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    <Music className="h-3 w-3" />
                    {genre}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const updatedGenres = [...(profile.genres || [])];
                        updatedGenres.splice(index, 1);
                        updateProfile({ genres: updatedGenres });
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Instruments</Label>
              <div className="flex gap-2">
                <Input
                  value={newInstrument}
                  onChange={(e) => setNewInstrument(e.target.value)}
                  placeholder="Add an instrument"
                />
                <Button onClick={handleAddInstrument}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.instruments?.map((instrument, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    {instrument}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const updatedInstruments = [...(profile.instruments || [])];
                        updatedInstruments.splice(index, 1);
                        updateProfile({ instruments: updatedInstruments });
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="yearsOfExperience">Years of Experience</Label>
              <Input
                id="yearsOfExperience"
                type="number"
                value={profile.yearsOfExperience || ""}
                onChange={(e) => updateProfile({ yearsOfExperience: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label>Rates</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    value={profile.rates?.hourly || ""}
                    onChange={(e) => updateProfile({ 
                      rates: { 
                        ...profile.rates,
                        hourly: parseInt(e.target.value)
                      }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="projectRate">Project Rate ($)</Label>
                  <Input
                    id="projectRate"
                    type="number"
                    value={profile.rates?.project || ""}
                    onChange={(e) => updateProfile({ 
                      rates: {
                        ...profile.rates,
                        project: parseInt(e.target.value)
                      }
                    })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="availability">Availability</Label>
              <select
                id="availability"
                className="w-full bg-background border rounded-md px-3 py-2"
                value={profile.availability || "available"}
                onChange={(e) => updateProfile({ 
                  availability: e.target.value as 'available' | 'busy' | 'not_available'
                })}
              >
                <option value="available">Available for Work</option>
                <option value="busy">Currently Busy</option>
                <option value="not_available">Not Available</option>
              </select>
            </div>
          </div>
        );

      case "Social Media":
        return (
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <Label>Add Social Media</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={newSocialPlatform}
                  onChange={(e) => setNewSocialPlatform(e.target.value)}
                  placeholder="Platform (e.g. Instagram)"
                />
                <Input
                  value={newSocialUrl}
                  onChange={(e) => setNewSocialUrl(e.target.value)}
                  placeholder="URL"
                />
              </div>
              <Button onClick={handleAddSocialLink} className="w-full mt-2">
                <Plus className="h-4 w-4 mr-2" />
                Add Social Link
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Your Social Media</Label>
              {profile.socialLinks?.length ? (
                <div className="space-y-2">
                  {profile.socialLinks?.map((link, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Share2 className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="font-medium">{link.platform}</div>
                        <div className="text-sm text-muted-foreground truncate">{link.url}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSocialLink(index)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No social media links added yet
                </div>
              )}
            </div>
          </div>
        );

      case "Appearance":
        return (
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <select
                id="theme"
                className="w-full bg-background border rounded-md px-3 py-2"
                value={profile.theme || "system"}
                onChange={(e) => updateProfile({ 
                  theme: e.target.value as 'light' | 'dark' | 'system'
                })}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accentColor">Accent Color</Label>
              <div className="flex gap-2">
                <Input
                  id="accentColor"
                  type="color"
                  value={profile.accentColor || "#000000"}
                  onChange={(e) => updateProfile({ accentColor: e.target.value })}
                  className="w-12 h-12 p-1"
                />
                <div className="flex-1">
                  <Input
                    value={profile.accentColor || "#000000"}
                    onChange={(e) => updateProfile({ accentColor: e.target.value })}
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayLayout">Display Layout</Label>
              <select
                id="displayLayout"
                className="w-full bg-background border rounded-md px-3 py-2"
                value={profile.displayLayout || "grid"}
                onChange={(e) => updateProfile({ 
                  displayLayout: e.target.value as 'grid' | 'list'
                })}
              >
                <option value="grid">Grid</option>
                <option value="list">List</option>
              </select>
            </div>
          </div>
        );

      case "Privacy":
        return (
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <Label htmlFor="profileVisibility">Profile Visibility</Label>
              <select
                id="profileVisibility"
                className="w-full bg-background border rounded-md px-3 py-2"
                value={profile.privacySettings?.profileVisibility || "public"}
                onChange={(e) => {
                  const currentSettings = profile.privacySettings || {
                    showEmail: true,
                    showLocation: true,
                    showRates: true,
                    showStats: true,
                    profileVisibility: 'public' as const
                  };
                  updateProfile({
                    privacySettings: {
                      ...currentSettings,
                      profileVisibility: e.target.value as 'public' | 'private' | 'connections_only'
                    }
                  });
                }}
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="connections_only">Connections Only</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Show on Profile</Label>
              <div className="space-y-2">
                {[
                  { key: 'showEmail', label: 'Email Address', icon: Mail },
                  { key: 'showLocation', label: 'Location', icon: MapPin },
                  { key: 'showRates', label: 'Rates', icon: DollarSign },
                  { key: 'showStats', label: 'Profile Stats', icon: BarChart2 }
                ].map(({ key, label, icon: Icon }) => (
                  <div key={key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={key}
                      checked={profile.privacySettings?.[key as 'showEmail' | 'showLocation' | 'showRates' | 'showStats'] ?? true}
                      onChange={(e) => {
                        const currentSettings = profile.privacySettings || {
                          showEmail: true,
                          showLocation: true,
                          showRates: true,
                          showStats: true,
                          profileVisibility: 'public' as const
                        };
                        updateProfile({
                          privacySettings: {
                            ...currentSettings,
                            [key as 'showEmail' | 'showLocation' | 'showRates' | 'showStats']: e.target.checked
                          }
                        });
                      }}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor={key} className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "Links":
        return (
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <Label>Add New Link</Label>
              <div className="flex gap-2">
                <Input
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  placeholder="https://example.com"
                />
                <Button onClick={handleAddLink}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Your Links</Label>
              {profile.links?.length ? (
                <div className="space-y-2">
                  {profile.links?.map((link: string, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 truncate">{link}</div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveLink(index)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No links added yet
                </div>
              )}
            </div>
          </div>
        );
      case "Tags":
        return (
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <Label>Add New Tag</Label>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Producer, Mixing, etc."
                />
                <Button onClick={handleAddTag}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Your Tags</Label>
              {profile.tags?.length ? (
                <div className="flex flex-wrap gap-2">
                  {profile.tags?.map((tag: string, index: number) => (
                    <Badge 
                      key={index} 
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      {tag}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTag(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No tags added yet
                </div>
              )}
            </div>
          </div>
        );
      case "Tab Settings":
        const defaultTabs = ["tracks", "playlists", "albums", "about"];
        const enabledTabs = defaultTabs.filter(tab => !profile.disabledTabs?.includes(tab));
        const orderedTabs = profile.tabOrder || enabledTabs;

        const moveTab = (index: number, direction: 'up' | 'down') => {
          const newIndex = direction === 'up' ? index - 1 : index + 1;
          if (newIndex < 0 || newIndex >= orderedTabs.length) return;
          
          const newOrder = [...orderedTabs];
          [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
          updateProfile({ tabOrder: newOrder });
        };

        return (
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <Label>Profile Tab Settings</Label>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Default Tab</Label>
                  <select 
                    className="bg-background border rounded-md px-3 py-2 text-sm"
                    value={profile.defaultTab || "tracks"}
                    onChange={(e) => updateProfile({ defaultTab: e.target.value })}
                  >
                    {orderedTabs.map(tab => (
                      <option key={tab} value={tab}>
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Tab Order & Visibility</Label>
                  <div className="space-y-2">
                    {orderedTabs.map((tab, index) => (
                      <div key={tab} className="flex items-center gap-2 bg-background/50 p-2 rounded-md">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <input
                          type="checkbox"
                          id={`tab-${tab}`}
                          checked={!profile.disabledTabs?.includes(tab)}
                          onChange={(e) => {
                            const disabledTabs = profile.disabledTabs || [];
                            if (e.target.checked) {
                              updateProfile({
                                disabledTabs: disabledTabs.filter(t => t !== tab)
                              });
                            } else {
                              updateProfile({
                                disabledTabs: [...disabledTabs, tab]
                              });
                            }
                          }}
                        />
                        <Label htmlFor={`tab-${tab}`} className="flex-1">
                          {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </Label>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => moveTab(index, 'up')}
                            disabled={index === 0}
                            className="h-8 w-8"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => moveTab(index, 'down')}
                            disabled={index === orderedTabs.length - 1}
                            className="h-8 w-8"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {defaultTabs.some(tab => !orderedTabs.includes(tab)) && (
                  <div className="space-y-2">
                    <Label>Available Tabs</Label>
                    <div className="space-y-2">
                      {defaultTabs.filter(tab => !orderedTabs.includes(tab)).map(tab => (
                        <div key={tab} className="flex items-center gap-2 bg-background/50 p-2 rounded-md">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateProfile({ tabOrder: [...orderedTabs, tab] })}
                            className="w-full"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add {tab.charAt(0).toUpperCase() + tab.slice(1)}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <DialogContent className="overflow-hidden p-0 md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]">
      <DialogTitle className="sr-only">Edit Profile</DialogTitle>
      <SidebarProvider className="items-start">
        <Sidebar collapsible="none" className="hidden md:flex">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton
                        isActive={activeSection === item.name}
                        onClick={() => setActiveSection(item.name)}
                      >
                        <item.icon />
                        <span>{item.name}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <main className="flex h-[480px] flex-1 flex-col overflow-hidden">
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <Settings className="h-5 w-5" />
              <span className="font-semibold">Edit Profile</span>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto">
            {renderContent()}
          </div>
        </main>
      </SidebarProvider>
    </DialogContent>
  )
}
