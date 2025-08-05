import React from 'react';
import { Button } from '@/components/@/ui/button';
import { ShoppingCart, MessageSquare, Download } from 'lucide-react';

interface ProjectActionsCardProps {
  onAddToCart: () => void;
  onDownload: () => void;
  allowDownloads: boolean;
}

const ProjectActionsCard: React.FC<ProjectActionsCardProps> = ({ onAddToCart, onDownload, allowDownloads }) => {
  return (
    <div className="p-4 bg-card border rounded-lg shadow-sm">
      <div className="space-y-2">
        <Button className="w-full" onClick={onAddToCart}>
          <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
        </Button>
        {allowDownloads && (
          <Button variant="outline" className="w-full" onClick={onDownload}>
            <Download className="mr-2 h-4 w-4" /> Download Project
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProjectActionsCard;
