import React, { useState, useRef, useCallback } from 'react';
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
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ProjectCard from '../music/ProjectCard';
import ProjectListView from '../music/ProjectListView';
import useProfile from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProjectsTabProps {
  viewMode: 'grid' | 'list';
  sortBy: 'latest' | 'popular' | 'oldest';
}

const ProjectsTab = ({ viewMode, sortBy }: ProjectsTabProps) => {
  const { stats } = useProfile();
  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 8;
  const [projects, setProjects] = useState<Array<{
    id: string;
    title: string;
    artworkUrl: string;
    tracks: Array<{
      id: string;
      title: string;
      duration: string;
    }>;
    totalTracks: number;
    isPopular: boolean;
  }>>(() => {
    return generateAllProjects();
  });

  function generateAllProjects() {
    // Sample project data
    return [
      {
        id: "1",
        title: "Summer Vibes EP",
        artworkUrl: "https://images.pexels.com/photos/1626481/pexels-photo-1626481.jpeg",
        tracks: [
          { id: "1-1", title: "Summer Breeze", duration: "3:45" },
          { id: "1-2", title: "Ocean Waves", duration: "4:12" },
          { id: "1-3", title: "Sunset Dreams", duration: "3:56" }
        ],
        totalTracks: 3,
        isPopular: true
      },
      {
        id: "2",
        title: "Late Night Beats",
        artworkUrl: "https://images.pexels.com/photos/1389429/pexels-photo-1389429.jpeg",
        tracks: [
          { id: "2-1", title: "Midnight Groove", duration: "3:22" },
          { id: "2-2", title: "City Lights", duration: "4:05" },
          { id: "2-3", title: "Urban Flow", duration: "3:48" }
        ],
        totalTracks: 3,
        isPopular: true
      },
      {
        id: "3",
        title: "Soul Sessions",
        artworkUrl: "https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg",
        tracks: [
          { id: "3-1", title: "Soulful Morning", duration: "4:15" },
          { id: "3-2", title: "Rhythm & Blues", duration: "3:58" },
          { id: "3-3", title: "Heart & Soul", duration: "4:22" }
        ],
        totalTracks: 3,
        isPopular: false
      },
      {
        id: "4",
        title: "Electronic Dreams",
        artworkUrl: "https://images.pexels.com/photos/1694900/pexels-photo-1694900.jpeg",
        tracks: [
          { id: "4-1", title: "Digital Love", duration: "3:35" },
          { id: "4-2", title: "Cyber Space", duration: "4:18" },
          { id: "4-3", title: "Future Beats", duration: "3:42" }
        ],
        totalTracks: 3,
        isPopular: true
      },
      {
        id: "5",
        title: "Urban Nights",
        artworkUrl: "https://images.pexels.com/photos/1537638/pexels-photo-1537638.jpeg",
        tracks: [
          { id: "5-1", title: "Street Life", duration: "3:52" },
          { id: "5-2", title: "City Dreams", duration: "4:08" },
          { id: "5-3", title: "Night Rider", duration: "3:45" }
        ],
        totalTracks: 3,
        isPopular: false
      },
      {
        id: "6",
        title: "Acoustic Stories",
        artworkUrl: "https://images.pexels.com/photos/1751731/pexels-photo-1751731.jpeg",
        tracks: [
          { id: "6-1", title: "Wooden Heart", duration: "3:28" },
          { id: "6-2", title: "Simple Times", duration: "4:02" },
          { id: "6-3", title: "Pure Sound", duration: "3:38" }
        ],
        totalTracks: 3,
        isPopular: true
      },
      {
        id: "7",
        title: "Jazz Fusion",
        artworkUrl: "https://images.pexels.com/photos/1644616/pexels-photo-1644616.jpeg",
        tracks: [
          { id: "7-1", title: "Smooth Jazz", duration: "4:25" },
          { id: "7-2", title: "Fusion Flow", duration: "3:55" },
          { id: "7-3", title: "Jazz Life", duration: "4:15" }
        ],
        totalTracks: 3,
        isPopular: false
      },
      {
        id: "8",
        title: "Future Bass",
        artworkUrl: "https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg",
        tracks: [
          { id: "8-1", title: "Bass Drop", duration: "3:32" },
          { id: "8-2", title: "Future Sound", duration: "4:12" },
          { id: "8-3", title: "Electronic Vibes", duration: "3:48" }
        ],
        totalTracks: 3,
        isPopular: true
      }
    ];
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const {active, over} = event;
    
    if (active.id !== over?.id) {
      setProjects((currentProjects) => {
        const oldIndex = currentProjects.findIndex(project => project.id === active.id);
        const newIndex = currentProjects.findIndex(project => project.id === over?.id);
        return arrayMove(currentProjects, oldIndex, newIndex);
      });
    }
  }

  // Apply sorting
  const sortedProjects = [...projects].sort((a, b) => {
    if (sortBy === 'popular') {
      return a.isPopular === b.isPopular ? 0 : a.isPopular ? -1 : 1;
    } else if (sortBy === 'oldest') {
      return parseInt(a.id) - parseInt(b.id);
    } else {
      // latest
      return parseInt(b.id) - parseInt(a.id);
    }
  });

  // Pagination
  const paginatedProjects = sortedProjects.slice(
    (currentPage - 1) * projectsPerPage,
    currentPage * projectsPerPage
  );
  
  const totalPages = Math.ceil(sortedProjects.length / projectsPerPage);

  return (
    <div className="space-y-4">
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={paginatedProjects.map(p => p.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            : "flex flex-col gap-4"
          }>
            {paginatedProjects.map((project) => (
              <SortableItem key={project.id} id={project.id}>
                {viewMode === 'grid' ? (
                  <ProjectCard project={project} variant="grid" id={project.id} />
                ) : (
                  <ProjectListView project={project} id={project.id} />
                )}
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    zIndex: isDragging ? 1 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

export default ProjectsTab;