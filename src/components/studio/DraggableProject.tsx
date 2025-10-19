'use client'

import { useRef } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import { type Project } from '@/lib/types'
import { ProjectOverviewCard } from '@/components/studio/ProjectOverviewCard'

interface DraggableProjectProps {
  project: Project
  index: number
  onMoveProject: (fromIndex: number, toIndex: number) => void
  onDelete?: () => void
  onViewDetails?: (project: Project | null | undefined) => void
  onEdit?: (project: Project) => void
  isSelected?: boolean
  variant?: 'grid' | 'list'
}

interface DragItem {
  index: number
  id: string
  type: string
}

export function DraggableProject({
  project,
  index,
  onMoveProject,
  onDelete,
  onViewDetails,
  onEdit,
  isSelected,
  variant = 'grid'
}: DraggableProjectProps) {
  const ref = useRef<HTMLDivElement>(null)

  const [{ isDragging }, drag] = useDrag({
    type: 'project',
    item: () => {
      return { id: project.id, index }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const [, drop] = useDrop({
    accept: 'project',
    hover(item: DragItem) {
      if (!ref.current) {
        return
      }
      const dragIndex = item.index
      const hoverIndex = index

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect()

      // Get vertical middle
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2

      // Determine mouse position
      const clientOffset = {
        x: 0,
        y: (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
      }

      // Get pixels to the top
      const hoverClientY = clientOffset.y - hoverBoundingRect.top

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return
      }

      // Time to actually perform the action
      onMoveProject(dragIndex, hoverIndex)

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex
    },
  })

  drag(drop(ref))

  const opacity = isDragging ? 0.4 : 1

  return (
    <div ref={ref} style={{ opacity }} className="cursor-move">
      <ProjectOverviewCard
        project={project}
        onDelete={onDelete}
        onViewDetails={onViewDetails}
        onEdit={onEdit}
        isSelected={isSelected}
        variant={variant}
      />
    </div>
  )
}
