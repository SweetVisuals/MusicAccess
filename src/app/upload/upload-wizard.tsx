import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from "sonner";
import { useUploadWizard } from '@/hooks/useUploadWizard';
import { DeleteConfirmationDialog } from '@/components/upload/DeleteConfirmationDialog';
import { NewFolderDialog } from '@/components/upload/NewFolderDialog';
import { UploadProgress } from '@/components/upload/UploadProgress';
import { FileBrowser } from '@/components/upload/FileBrowser';
import { UploadHeader } from '@/components/upload/UploadHeader';
import { FilterControls } from '@/components/upload/FilterControls';
import { supabase } from '@/lib/supabase';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Upload,
  FolderPlus,
  RefreshCw,
  Download,
  Trash2,
} from 'lucide-react';

export default function UploadWizard() {
  const {
    files,
    setFiles,
    isUploading,
    uploadProgress,
    searchQuery,
    setSearchQuery,
    showNewFolderDialog,
    setShowNewFolderDialog,
    currentFolder,
    currentFolderName,
    currentFolderPath,
    folders,
    isLoading,
    sortOrder,
    sortDirection,
    draggedFile,
    setDraggedFile,
    draggedFolder,
    setDraggedFolder,
    dropTarget,
    setDropTarget,
    dragCounter,
    setDragCounter,
    selectedItems,
    setSelectedItems,
    showDeleteDialog,
    setShowDeleteDialog,
    deleteItemType,
    deleteItemName,
    handleRefresh,
    handleUpload,
    handleCreateFolder,
    handleDeleteFile,
    confirmDeleteFile,
    handleDeleteFolder,
    confirmDeleteFolder,
    handleFileDoubleClick,
    sortedFilesInView,
    filteredFolders,
    handleChangeSortOrder,
    handleDownloadSelected,
    handleDeleteSelected,
    confirmDeleteSelected,
    fetchFiles,
    setCurrentFolder,
    uploadedFiles,
  } = useUploadWizard();


  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) {
      toast.warning('No valid audio files selected.');
      return;
    }
    const audioFiles = acceptedFiles.filter(file => file.type.startsWith('audio/')).slice(0, 10);
    setFiles(audioFiles);
    if (acceptedFiles.length > 10) {
      toast.warning('Only up to 10 files are allowed at once.');
    }
    if (audioFiles.length < acceptedFiles.length) {
      toast.warning('Only audio files are accepted.');
    }
    if (audioFiles.length > 0) {
      handleUpload(audioFiles);
    }
  }, [handleUpload, setFiles]);

  const { open } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.flac', '.aac', '.ogg'],
    },
    maxFiles: 10,
    multiple: true,
    noClick: true,
    noKeyboard: true,
    preventDropOnDocument: true,
  });

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedFile || draggedFolder) return;
    setDragCounter(prev => prev + 1);
  }, [draggedFile, draggedFolder, setDragCounter]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedFile || draggedFolder) return;
    setDragCounter(prev => Math.max(prev - 1, 0));
  }, [draggedFile, draggedFolder, setDragCounter]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(0);

    if (draggedFile || draggedFolder) {
      // Internal drag-and-drop
      return;
    }

    if (e.dataTransfer.items) {
      processDroppedItems(e.dataTransfer.items);
    } else if (e.dataTransfer.files) {
      const audioFiles = Array.from(e.dataTransfer.files)
        .filter(file => file.type.startsWith('audio/'))
        .slice(0, 10);
      if (audioFiles.length > 0) {
        handleUpload(audioFiles);
      } else {
        toast.warning('No valid audio files found in the dropped items.');
      }
    }
  }, [draggedFile, draggedFolder, handleUpload, setDragCounter]);

  const processDroppedItems = async (items: DataTransferItemList) => {
    const audioFiles: File[] = [];
    const promises: Promise<void>[] = [];

    const processEntry = async (entry: FileSystemEntry) => {
      if (entry.isFile) {
        const fileEntry = entry as FileSystemFileEntry;
        promises.push(new Promise<void>((resolve) => {
          fileEntry.file((file) => {
            if (file.type.startsWith('audio/')) {
              audioFiles.push(file);
            }
            resolve();
          }, () => resolve());
        }));
      } else if (entry.isDirectory) {
        const dirEntry = entry as FileSystemDirectoryEntry;
        promises.push(new Promise<void>((resolve) => {
          const reader = dirEntry.createReader();
          const readEntries = () => {
            reader.readEntries(async (entries) => {
              if (entries.length > 0) {
                await Promise.all(entries.map(processEntry));
                readEntries();
              } else {
                resolve();
              }
            }, () => resolve());
          };
          readEntries();
        }));
      }
    };

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry();
        if (entry) {
          await processEntry(entry);
        }
      }
    }

    await Promise.all(promises);

    if (audioFiles.length > 0) {
      const filesToUpload = audioFiles.slice(0, 10);
      if (audioFiles.length > 10) {
        toast.warning('Only up to 10 files are allowed at once.');
      }
      handleUpload(filesToUpload);
    } else {
      toast.warning('No valid audio files found in the dropped items.');
    }
  };

  const isDragging = dragCounter > 0;

  const handleFilesDroppedOnFolder = useCallback((files: File[], folderId: string) => {
    // Filter for supported file types
    const supportedFiles = files.filter(file =>
      file.type.startsWith('audio/') ||
      file.type.startsWith('image/') ||
      file.type.startsWith('video/') ||
      file.type.includes('pdf')
    );

    if (supportedFiles.length === 0) {
      toast.warning('No supported file types found. Only audio, image, video, and PDF files are accepted.');
      return;
    }

    // Limit to 10 files
    const filesToUpload = supportedFiles.slice(0, 10);
    if (supportedFiles.length > 10) {
      toast.warning('Only up to 10 files are allowed at once.');
    }

    // Upload files to the specific folder
    handleUpload(filesToUpload, folderId);
  }, [handleUpload, toast]);

  return (
    <div className="flex flex-1 flex-col px-6 pt-6">
      <UploadHeader
        currentFolder={currentFolder}
        currentFolderName={currentFolderName}
        currentFolderPath={currentFolderPath}
        folders={folders}
        navigateToFolder={setCurrentFolder}
        setShowNewFolderDialog={setShowNewFolderDialog}
        openFilePicker={open}
      />
      <div className="space-y-4 px-1">
        <FilterControls
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortOrder={sortOrder}
          sortDirection={sortDirection}
          handleChangeSortOrder={handleChangeSortOrder}
        />
        <UploadProgress
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          fileCount={files.length}
        />
      </div>
      <div
        className="flex-1 h-full px-1"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <FileBrowser
          isLoading={isLoading}
          folders={filteredFolders}
          files={sortedFilesInView}
          currentFolder={currentFolder}
          currentFolderName={currentFolderName}
          dropTarget={dropTarget}
          draggedFile={draggedFile}
          draggedFolder={draggedFolder}
          selectedItems={selectedItems}
          isDragging={isDragging}
          handleFileDoubleClick={handleFileDoubleClick}
          handleDeleteFile={handleDeleteFile}
          handleDeleteFolder={handleDeleteFolder}
          navigateToFolder={setCurrentFolder}
          setDraggedFile={setDraggedFile}
          setDraggedFolder={setDraggedFolder}
          setDropTarget={setDropTarget}
          setSelectedItems={setSelectedItems}
          openFilePicker={open}
          setShowNewFolderDialog={setShowNewFolderDialog}
          handleRefresh={handleRefresh}
          handleDownloadSelected={handleDownloadSelected}
          handleDeleteSelected={handleDeleteSelected}
          supabase={supabase}
          toast={toast}
          uploadedFiles={uploadedFiles}
          onFilesDroppedOnFolder={handleFilesDroppedOnFolder}
          onContextMenuOpen={(open) => {
            if (open) {
              setSelectedItems([]);
            }
          }}
          contextMenuItems={
            <>
              <ContextMenuItem onClick={open}>
                <Upload className="h-4 w-4 mr-2" /> Upload Files
              </ContextMenuItem>
              <ContextMenuItem onClick={() => setShowNewFolderDialog(true)}>
                <FolderPlus className="h-4 w-4 mr-2" /> New Folder
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" /> Refresh
              </ContextMenuItem>
              <ContextMenuSeparator />
              {selectedItems.length > 0 && (
                <>
                  <ContextMenuItem onClick={handleDownloadSelected}>
                    <Download className="h-4 w-4 mr-2" /> Download Selected
                  </ContextMenuItem>
                  <ContextMenuItem onClick={handleDeleteSelected} className="text-red-500">
                    <Trash2 className="h-4 w-4 mr-2" /> Delete Selected
                  </ContextMenuItem>
                </>
              )}
            </>
          }
        />
      </div>
      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={() => {
          if (deleteItemType === 'file') {
            confirmDeleteFile();
          } else if (deleteItemType === 'folder') {
            confirmDeleteFolder();
          } else {
            confirmDeleteSelected();
          }
        }}
        itemType={deleteItemType}
        itemName={deleteItemName}
      />
      <NewFolderDialog
        isOpen={showNewFolderDialog}
        onOpenChange={setShowNewFolderDialog}
        onCreateFolder={handleCreateFolder}
      />
    </div>
  );
}