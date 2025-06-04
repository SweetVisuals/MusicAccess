import React, { useState, useRef, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TrackCard from '../music/TrackCard';
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
      streams: number;
      artworkUrl: string;
      isPopular: boolean;
    }>;
    totalTracks: number;
    isPopular: boolean;
  }>>(() => {
    const allProjects = generateAllProjects();
    return allProjects.slice(
      (currentPage - 1) * projectsPerPage,
      currentPage * projectsPerPage
    );
  });

  function generateAllProjects() {
    // Sample track data - would normally come from API
    const allTracks = Array.from({ length: stats.tracks }, (_, i) => ({
      id: `track-${i + 1}`,
      title: `Track ${i + 1}`,
      duration: `${Math.floor(Math.random() * 4) + 2}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
      streams: Math.floor(Math.random() * 10000),
      artworkUrl: 'https://images.pexels.com/photos/5077069/pexels-photo-5077069.jpeg',
      isPopular: Math.random() > 0.7,
    }));

    // Group all tracks into projects (10 tracks per project)
    const allProjects = [];
    for (let i = 0; i < allTracks.length; i += 10) {
      const projectTracks = allTracks.slice(i, i + 10);
      allProjects.push({
        id: `project-${Math.floor(i / 10) + 1}`,
        title: `Project ${Math.floor(i / 10) + 1}`,
        artworkUrl: projectTracks[0].artworkUrl,
        tracks: projectTracks,
        totalTracks: projectTracks.length,
        isPopular: projectTracks.some(track => track.isPopular),
      });
    }
    return allProjects;
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

  const totalPages = Math.ceil(stats.tracks / projectsPerPage);

  return (
    <div className="space-y-4">
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={projects}
          strategy={horizontalListSortingStrategy}
        >
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            : "flex flex-col gap-4"
          }>
            {projects.map((project) => (
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