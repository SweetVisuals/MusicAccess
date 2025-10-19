import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useStorage } from '@/contexts/storage-context';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { useAudioPlayer } from '@/contexts/audio-player-context';
import { UploadedFile } from '@/lib/types';

export function useUploadWizard() {
  const { user } = useAuth();
  const { triggerStorageUpdate } = useStorage();
  const { playTrack } = useAudioPlayer();

  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [currentFolderName, setCurrentFolderName] = useState<string | null>(null);
  const [currentFolderPath, setCurrentFolderPath] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'name' | 'date' | 'size'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [draggedFile, setDraggedFile] = useState<string | null>(null);
  const [draggedFolder, setDraggedFolder] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [dragCounter, setDragCounter] = useState(0);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteItemType, setDeleteItemType] = useState<'file' | 'folder' | 'selected' | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [deleteItemPath, setDeleteItemPath] = useState<string | null>(null);
  const [deleteItemName, setDeleteItemName] = useState('');

  const fetchFiles = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setUploadedFiles(data || []);
    } catch (error: unknown) {
      toast.error(`Failed to load files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const fetchFolders = useCallback(async () => {
    if (!user) return;
    try {
      let query = supabase.from('folders').select('*').eq('user_id', user.id);
      if (currentFolder) {
        query = query.eq('parent_id', currentFolder);
      } else {
        query = query.is('parent_id', null);
      }
      const { data, error } = await query.order('name');
      if (error) throw error;
      setFolders(data || []);
    } catch (error: unknown) {
      toast.error(`Failed to load folders: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [user, currentFolder]);

  const fetchCurrentFolderName = useCallback(async () => {
    if (!user || !currentFolder) {
      setCurrentFolderName(null);
      setCurrentFolderPath([]);
      return;
    }
    try {
      // Build the path by traversing up from current folder
      const path: any[] = [];
      let folderId = currentFolder;

      while (folderId) {
        const { data, error } = await supabase
          .from('folders')
          .select('id, name, parent_id')
          .eq('id', folderId)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        if (data) {
          path.unshift(data); // Add to beginning to maintain root-to-current order
          folderId = data.parent_id;
        } else {
          break;
        }
      }

      setCurrentFolderName(path.length > 0 ? path[path.length - 1].name : null);
      setCurrentFolderPath(path);
    } catch (error: unknown) {
      console.error('Error fetching current folder name:', error);
      setCurrentFolderName(null);
      setCurrentFolderPath([]);
    }
  }, [user, currentFolder]);

  useEffect(() => {
    if (user) {
      fetchFiles();
      fetchFolders();
      fetchCurrentFolderName();
    }
  }, [user, currentFolder, fetchFiles, fetchFolders, fetchCurrentFolderName]);

  const handleRefresh = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    await Promise.all([fetchFiles(), fetchFolders()]);
    setIsLoading(false);
    toast.success("Files and folders refreshed.");
  }, [user, fetchFiles, fetchFolders]);

  const handleUpload = async (filesToUpload: File[], targetFolderId?: string) => {
    if (!user) {
      toast.error('You must be logged in to upload files');
      return;
    }
    if (filesToUpload.length === 0) {
      toast.error('No files to upload');
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);
    try {
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const fileId = uuidv4();
        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/${fileId}.${fileExt}`;
        const currentProgress = Math.round(((i + 0.5) / filesToUpload.length) * 100);
        setUploadProgress(currentProgress);
        const { error: storageError } = await supabase.storage
          .from('audio_files')
          .upload(filePath, file, { cacheControl: '3600', upsert: true, contentType: file.type });
        if (storageError) throw storageError;
        const { data: { publicUrl } } = supabase.storage.from('audio_files').getPublicUrl(filePath);

        // Calculate duration for audio files
        let durationSeconds = null;
        if (file.type.startsWith('audio/')) {
          try {
            const audio = new Audio();
            audio.src = URL.createObjectURL(file);
            await new Promise<void>((resolve, reject) => {
              audio.onloadedmetadata = () => {
                durationSeconds = Math.round(audio.duration);
                resolve();
              };
              audio.onerror = () => reject(new Error('Failed to load audio metadata'));
            });
          } catch (error) {
            console.warn(`Failed to calculate duration for ${file.name}:`, error);
            // Continue without duration if calculation fails
          }
        }

        const fileData: Record<string, any> = {
          id: fileId,
          name: file.name,
          file_url: publicUrl,
          file_path: filePath,
          size: file.size,
          file_type: getFileType(file.type),
          user_id: user.id,
          duration_seconds: durationSeconds
        };
        // Use targetFolderId if provided, otherwise use currentFolder
        const folderId = targetFolderId || currentFolder;
        if (folderId) {
          fileData.folder_id = folderId;
        }
        const { error: dbError } = await supabase.from('files').insert([fileData]);
        if (dbError) throw dbError;
        setUploadProgress(Math.round(((i + 1) / filesToUpload.length) * 100));
      }
      setUploadProgress(100);
      const folderName = targetFolderId ? folders.find(f => f.id === targetFolderId)?.name || 'folder' : 'current folder';
      toast.success(`${filesToUpload.length} file${filesToUpload.length > 1 ? 's' : ''} uploaded to ${folderName} successfully`);
      setFiles([]);
      fetchFiles();
      fetchFolders();
      triggerStorageUpdate();
    } catch (error: unknown) {
      toast.error(`Failed to upload files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1500);
    }
  };

  const handleCreateFolder = async (newFolderName: string) => {
    if (!user) {
      toast.error('You must be logged in to create folders');
      return;
    }
    if (!newFolderName.trim()) {
      toast.error('Please enter a folder name');
      return;
    }
    try {
      const { error } = await supabase
        .from('folders')
        .insert([{ name: newFolderName.trim(), user_id: user.id, parent_id: currentFolder }])
        .select();
      if (error) throw error;
      toast.success('Folder created successfully');
      setShowNewFolderDialog(false);
      fetchFolders();
    } catch (error: unknown) {
      toast.error(`Failed to create folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const deleteFile = async (id: string, filePath: string | null, fileName: string) => {
    try {
      if (filePath) {
        const { error: storageError } = await supabase.storage.from('audio_files').remove([filePath]);
        if (storageError) throw storageError;
      }
      const { error } = await supabase.from('files').delete().eq('id', id);
      if (error) throw error;
      toast.success('File deleted successfully');
      fetchFiles();
      triggerStorageUpdate();
    } catch (error: unknown) {
      toast.error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const deleteFolder = async (id: string, folderName: string) => {
    try {
      // Recursive function to collect all subfolders and files
      const collectAllFoldersAndFiles = async (folderId: string): Promise<{ folders: string[], files: { id: string, file_path: string | null }[] }> => {
        const result = { folders: [folderId], files: [] as { id: string, file_path: string | null }[] };

        // Get direct files in this folder
        const { data: folderFiles, error: filesError } = await supabase.from('files').select('id, file_path').eq('folder_id', folderId);
        if (filesError) throw filesError;
        if (folderFiles) {
          result.files.push(...folderFiles);
        }

        // Get subfolders and recursively collect their contents
        const { data: subfolders, error: subfoldersError } = await supabase.from('folders').select('id').eq('parent_id', folderId);
        if (subfoldersError) throw subfoldersError;
        if (subfolders) {
          for (const subfolder of subfolders) {
            const subResult = await collectAllFoldersAndFiles(subfolder.id);
            result.folders.push(...subResult.folders);
            result.files.push(...subResult.files);
          }
        }

        return result;
      };

      // Collect all folders and files to delete
      const { folders: foldersToDelete, files: filesToDelete } = await collectAllFoldersAndFiles(id);

      // Delete all files from storage
      if (filesToDelete.length > 0) {
        const filePaths = filesToDelete.map(file => file.file_path).filter((path): path is string => path !== null);
        if (filePaths.length > 0) {
          const { error: storageError } = await supabase.storage.from('audio_files').remove(filePaths);
          if (storageError) throw storageError;
        }
        // Delete all files from database
        const { error: dbFilesError } = await supabase.from('files').delete().in('id', filesToDelete.map(f => f.id));
        if (dbFilesError) throw dbFilesError;
      }

      // Delete all folders from database (in reverse order to handle parent-child relationships)
      for (const folderId of foldersToDelete.reverse()) {
        const { error: folderError } = await supabase.from('folders').delete().eq('id', folderId);
        if (folderError) throw folderError;
      }

      toast.success('Folder and all contents deleted successfully');
      fetchFolders();
      triggerStorageUpdate();
    } catch (error: unknown) {
      toast.error(`Failed to delete folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteFile = (id: string, filePath: string | null, fileName: string) => {
    // If multiple items are selected, delete all selected items instead
    if (selectedItems.length > 1) {
      handleDeleteSelected();
      return;
    }
    setDeleteItemType('file');
    setDeleteItemId(id);
    setDeleteItemPath(filePath);
    setDeleteItemName(fileName);
    setShowDeleteDialog(true);
  };

  const confirmDeleteFile = () => {
    if (!user || !deleteItemId || deleteItemType !== 'file') return;
    deleteFile(deleteItemId, deleteItemPath || '', deleteItemName);
    setShowDeleteDialog(false);
  };

  const handleDeleteFolder = (id: string, folderName: string) => {
    // If multiple items are selected, delete all selected items instead
    if (selectedItems.length > 1) {
      handleDeleteSelected();
      return;
    }
    setDeleteItemType('folder');
    setDeleteItemId(id);
    setDeleteItemName(folderName);
    setShowDeleteDialog(true);
  };

  const confirmDeleteFolder = () => {
    if (!user || !deleteItemId || deleteItemType !== 'folder') return;
    deleteFolder(deleteItemId, deleteItemName);
    setShowDeleteDialog(false);
  };

  const handleFileDoubleClick = async (file: UploadedFile) => {
    if (file.file_type === 'audio') {
      let duration = 0;
      try {
        const audio = new Audio(file.file_url);
        await new Promise<void>((resolve, reject) => {
          audio.onloadedmetadata = () => {
            duration = audio.duration;
            resolve();
          };
          audio.onerror = () => reject(new Error('Failed to load audio metadata.'));
        });
      } catch (error) {
        toast.error('Failed to load audio for playback.');
        return;
      }
      playTrack({
        id: file.id,
        title: file.name,
        artist: user?.user_metadata?.username || 'Unknown Artist',
        audioUrl: file.file_url,
        artworkUrl: undefined,
        duration: duration,
      });
      toast.info(`Playing: ${file.name}`);
    } else {
      toast.info(`Cannot play ${file.file_type} files in the audio player.`);
    }
  };

  const getFileType = (mimeType: string): string => {
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('word')) return 'document';
    return 'file';
  };

  const sortFiles = (filesToSort: any[]) => {
    return [...filesToSort].sort((a, b) => {
      let comparison = 0;
      switch (sortOrder) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          break;
        case 'size':
          comparison = b.size - a.size;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  const searchedFiles = uploadedFiles.filter(file => file.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filesInView = searchedFiles.filter(file => file.folder_id === currentFolder);
  const sortedFilesInView = sortFiles(filesInView);
  const filteredFolders = folders.filter(folder => folder.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleChangeSortOrder = (order: 'name' | 'date' | 'size') => {
    if (sortOrder === order) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortOrder(order);
      setSortDirection('desc');
    }
  };

  const handleDownloadSelected = async () => {
    if (selectedItems.length === 0) {
      toast.error("No items selected for download.");
      return;
    }
    for (const itemId of selectedItems) {
      const file = uploadedFiles.find(f => f.id === itemId);
      if (file && file.file_url) {
        const link = document.createElement('a');
        link.href = file.file_url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Downloading ${file.name}`);
      }
    }
    setSelectedItems([]);
  };

  const handleDeleteSelected = () => {
    if (selectedItems.length === 0) {
      toast.error("No items selected for deletion.");
      return;
    }
    setDeleteItemType('selected');
    setDeleteItemId(null); // Not used for selected items
    setDeleteItemName(`${selectedItems.length} selected item${selectedItems.length > 1 ? 's' : ''}`);
    setShowDeleteDialog(true);
  };

  const confirmDeleteSelected = async () => {
    if (!user) return;
    setShowDeleteDialog(false);

    // Separate files and folders
    const selectedFiles = selectedItems.filter(itemId => uploadedFiles.some(f => f.id === itemId));
    const selectedFolders = selectedItems.filter(itemId => folders.some(f => f.id === itemId));

    // Function to check if a folder is a descendant of another folder
    const isDescendantOf = async (folderId: string, potentialAncestorId: string): Promise<boolean> => {
      let currentId = folderId;
      while (currentId) {
        const { data: folder, error } = await supabase
          .from('folders')
          .select('parent_id')
          .eq('id', currentId)
          .eq('user_id', user.id)
          .single();

        if (error) return false;
        if (folder.parent_id === potentialAncestorId) return true;
        currentId = folder.parent_id;
      }
      return false;
    };

    // Filter out folders that are descendants of other selected folders
    const foldersToDelete: string[] = [];
    for (const folderId of selectedFolders) {
      const isDescendant = await Promise.all(
        selectedFolders
          .filter(id => id !== folderId)
          .map(ancestorId => isDescendantOf(folderId, ancestorId))
      );
      if (!isDescendant.some(Boolean)) {
        foldersToDelete.push(folderId);
      }
    }

    // Delete files
    for (const fileId of selectedFiles) {
      const file = uploadedFiles.find(f => f.id === fileId);
      if (file) {
        await deleteFile(file.id, file.file_path || '', file.name);
      }
    }

    // Delete folders (only top-level ones)
    for (const folderId of foldersToDelete) {
      const folder = folders.find(f => f.id === folderId);
      if (folder) {
        await deleteFolder(folder.id, folder.name);
      }
    }

    setSelectedItems([]);
    toast.success("Selected items deleted.");
    fetchFiles();
    fetchFolders();
    triggerStorageUpdate();
  };

  return {
    files,
    setFiles,
    isUploading,
    uploadProgress,
    searchQuery,
    setSearchQuery,
    showNewFolderDialog,
    setShowNewFolderDialog,
    uploadedFiles,
    currentFolder,
    currentFolderName,
    currentFolderPath,
    setCurrentFolder,
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
    deleteItemId,
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
    supabase,
    fetchFiles,
    toast,
  };
}
