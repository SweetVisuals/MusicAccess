import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/@/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from 'lucide-react';

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: () => void;
  itemType: 'file' | 'folder' | 'selected' | null;
  itemName: string;
}

export function DeleteConfirmationDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  itemType,
  itemName,
}: DeleteConfirmationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Confirm Deletion
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-center text-muted-foreground">
            {itemType === 'file' ? (
              <>Are you sure you want to delete the file <span className="font-medium text-foreground">{itemName}</span>?</>
            ) : itemType === 'folder' ? (
              <>Are you sure you want to delete the folder <span className="font-medium text-foreground">{itemName}</span> and all its contents?</>
            ) : itemType === 'selected' ? (
              <>Are you sure you want to delete <span className="font-medium text-foreground">{itemName}</span>?</>
            ) : (
              <>Are you sure you want to delete this item?</>
            )}
          </p>
        </div>
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            className="gap-1"
          >
            <Trash2 className="h-4 w-4" />
            Delete {itemType === 'selected' ? 'Selected' : itemType}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
