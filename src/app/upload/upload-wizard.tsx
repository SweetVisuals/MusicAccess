import { useCallback } from 'react';
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
import { DashboardLayout } from '@/components/layout/DashboardLayout';

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
    folders,
    isLoading,
    sortOrder,
    sortDirection,
    draggedFile,
    setDraggedFile,
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
    if (draggedFile) return;
    setDragCounter(prev => prev + 1);
  }, [draggedFile, setDragCounter]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedFile) return;
    setDragCounter(prev => Math.max(prev - 1, 0));
  }, [draggedFile, setDragCounter]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(0);

    if (draggedFile) {
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
  }, [draggedFile, handleUpload, setDragCounter]);

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

  return (
    <DashboardLayout show_header={false}>
      <div className="flex flex-col h-full w-full" style={{ maxWidth: 'none', width: '100%' }}>
        <div className="p-6 space-y-4">
          <UploadHeader
            currentFolder={currentFolder}
            folders={folders}
            navigateToFolder={setCurrentFolder}
            setShowNewFolderDialog={setShowNewFolderDialog}
            openFilePicker={open}
          />
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
          className="flex-1 overflow-hidden px-6 pb-6"
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
            dropTarget={dropTarget}
            draggedFile={draggedFile}
            selectedItems={selectedItems}
            isDragging={isDragging}
            handleFileDoubleClick={handleFileDoubleClick}
            handleDeleteFile={handleDeleteFile}
            handleDeleteFolder={handleDeleteFolder}
            navigateToFolder={setCurrentFolder}
            setDraggedFile={setDraggedFile}
            setDropTarget={setDropTarget}
            setSelectedItems={setSelectedItems}
            openFilePicker={open}
            setShowNewFolderDialog={setShowNewFolderDialog}
            handleRefresh={handleRefresh}
            handleDownloadSelected={handleDownloadSelected}
            handleDeleteSelected={handleDeleteSelected}
            supabase={supabase}
            fetchFiles={fetchFiles}
            toast={toast}
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
    </DashboardLayout>
  );
}
