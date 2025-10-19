import { useState, useEffect } from 'react';
import { UserProfile, UserStats, Project } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/@/ui/tabs';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableTabTrigger } from '@/components/profile/SortableTabTrigger';
import { Disc3, ListMusic, Album, User, LayoutGrid, List, Music, Settings } from 'lucide-react';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/@/ui/toggle-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/@/ui/dropdown-menu';
import { Button } from '@/components/@/ui/button';
import ProjectsTab from './tabs/ProjectsTab';
import ServicesTab from './tabs/ServicesTab';
import SoundPacksTab from './tabs/SoundPacksTab';
import TracksTab from './tabs/TracksTab';
import AboutTab from './tabs/AboutTab';

interface ProfileContentProps {
  user: UserProfile;
  projects: Project[];
  playlists: any[]; // TODO: Replace 'any' with specific types (Playlist[])
  albums: any[]; // TODO: Replace 'any' with specific types (Album[])
  showCreateProjectDialog?: boolean;
  setShowCreateProjectDialog?: (show: boolean) => void;
  showCreateSoundpackDialog?: boolean;
  setShowCreateSoundpackDialog?: (show: boolean) => void;
  onProjectCreated: () => void;
  isOwner?: boolean;
  projectsLoading?: boolean;
  projectsError?: string | null;
  isPreviewMode?: boolean;
}

const ProfileContent = ({
  user,
  projects,
  playlists,
  albums,
  showCreateProjectDialog = false,
  setShowCreateProjectDialog = () => {},
  showCreateSoundpackDialog = false,
  setShowCreateSoundpackDialog = () => {},
  onProjectCreated,
  isOwner = false,
  isPreviewMode = false
}: ProfileContentProps) => {
  if (!user) return null;
  const { disabledTabs = [] } = (user as any);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'oldest'>('latest');
  const [tabOrder, setTabOrder] = useState<Array<'projects' | 'tracks' | 'services' | 'albums' | 'about'>>([]);

  useEffect(() => {
    // Load saved tab order from localStorage or use default
    const savedOrder = localStorage.getItem('profileTabOrder');
    let tabOrderToUse = ["projects", "tracks", "services", "albums", "about"];

    if (savedOrder) {
      const parsedOrder = JSON.parse(savedOrder);
      // Handle migration: replace "playlists" with "services" if it exists
      const migratedOrder = parsedOrder.map((tab: string) =>
        tab === "playlists" ? "services" : tab
      );
      // Add "services" if it's not already there
      if (!migratedOrder.includes("services")) {
        migratedOrder.splice(2, 0, "services"); // Insert at position 2 (after tracks)
      }
      tabOrderToUse = migratedOrder;
    }

    setTabOrder(tabOrderToUse as Array<'projects' | 'tracks' | 'services' | 'albums' | 'about'>);
    localStorage.setItem('profileTabOrder', JSON.stringify(tabOrderToUse));
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const {active, over} = event;

    if (!over || active.id === over.id) return;
      setTabOrder((items) => {
        const oldIndex = items.indexOf(active.id as 'projects' | 'tracks' | 'services' | 'albums' | 'about');
        const newIndex = items.indexOf(over.id as 'projects' | 'tracks' | 'services' | 'albums' | 'about');
        const newOrder = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem('profileTabOrder', JSON.stringify(newOrder));
        return newOrder;
      });
    };

  const enabledTabs = tabOrder.filter(
    tab => !disabledTabs.includes(tab)
  );

  if (enabledTabs.length === 0) {
    return <div className="mt-8 text-center text-muted-foreground">No tabs enabled</div>;
  }

  return (
    <Tabs defaultValue={(user as any).defaultTab || "projects"} className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={enabledTabs}
            strategy={verticalListSortingStrategy}
          >
            <TabsList className="justify-start gap-1 bg-transparent p-0">
              {enabledTabs.map((tab) => {
                const iconMap: Record<string, JSX.Element> = {
                  projects: <Disc3 className="h-4 w-4 mr-2" />,
                  services: <ListMusic className="h-4 w-4 mr-2" />,
                  albums: <Album className="h-4 w-4 mr-2" />,
                  tracks: <Music className="h-4 w-4 mr-2" />,
                    about: <User className="h-4 w-4 mr-2" />,
                };

                const labelMap: Record<string, string> = {
                  projects: "Projects",
                  services: "Services",
                  albums: "Sound Packs",
                  tracks: "Tracks",
                  about: "About",
                };

                return (
                  <SortableTabTrigger
                    key={tab}
                    id={tab}
                    value={tab}
                    className="px-4 py-2 transition-all duration-300 ease-in-out
                      hover:bg-accent/50 hover:scale-[1.02]
                      data-[state=active]:bg-primary/10 data-[state=active]:text-primary
                      data-[state=active]:shadow-sm data-[state=active]:border-b-2
                      data-[state=active]:border-primary rounded-lg
                      cursor-grab active:cursor-grabbing"
                  >
                    {iconMap[tab]}
                    {labelMap[tab]}
                  </SortableTabTrigger>
                );
              })}
            </TabsList>
          </SortableContext>
        </DndContext>

        <div className="flex items-center gap-4">
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => {
              if (value) setViewMode(value as 'grid' | 'list');
            }}
            className="bg-muted p-1 rounded-lg"
          >
            <ToggleGroupItem
              value="grid"
              aria-label="Grid view"
              className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="list"
              aria-label="List view"
              className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Sort by: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSortBy('latest')}>
                Latest
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('popular')}>
                Most popular
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('oldest')}>
                Oldest
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <TabsContent value="projects" className="animate-fade-in">
        <ProjectsTab
          user={user}
          projects={projects}
          viewMode={viewMode}
          sortBy={sortBy}
          showCreateDialog={showCreateProjectDialog}
          setShowCreateDialog={setShowCreateProjectDialog}
          onProjectCreated={onProjectCreated}
          isOwner={isOwner}
        />
      </TabsContent>
       <TabsContent value="tracks" className="animate-fade-in">
         <TracksTab
           user={user}
           projects={projects}
           viewMode={viewMode}
           sortBy={sortBy}
           showCreateDialog={showCreateProjectDialog}
           setShowCreateDialog={setShowCreateProjectDialog}
           onProjectCreated={onProjectCreated}
         />
       </TabsContent>
      <TabsContent value="services" className="animate-fade-in">
        <ServicesTab
          showCreateDialog={showCreateSoundpackDialog}
          setShowCreateDialog={setShowCreateSoundpackDialog}
          user={user}
          isPreviewMode={isPreviewMode}
          viewMode={viewMode}
        />
      </TabsContent>
      <TabsContent value="albums" className="animate-fade-in">
        <SoundPacksTab user={user} isPreviewMode={isPreviewMode} viewMode={viewMode} />
      </TabsContent>
      <TabsContent value="about" className="animate-fade-in">
        <AboutTab user={user} />
      </TabsContent>
    </Tabs>
  );
};

export default ProfileContent;
