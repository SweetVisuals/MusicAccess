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
  const [folders, setFolders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'name' | 'date' | 'size'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [draggedFile, setDraggedFile] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [dragCounter, setDragCounter] = useState(0);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteItemType, setDeleteItemType] = useState<'file' | 'folder' | null>(null);
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

  useEffect(() => {
    if (user) {
      fetchFiles();
      fetchFolders();
    }
  }, [user, currentFolder, fetchFiles, fetchFolders]);

  const handleRefresh = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    await Promise.all([fetchFiles(), fetchFolders()]);
    setIsLoading(false);
    toast.success("Files and folders refreshed.");
  }, [user, fetchFiles, fetchFolders]);

  const handleUpload = async (filesToUpload: File[]) => {
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
        const fileData: Record<string, any> = {
          id: fileId,
          name: file.name,
          file_url: publicUrl,
          file_path: filePath,
          size: file.size,
          file_type: getFileType(file.type),
          user_id: user.id
        };
        if (currentFolder) {
          fileData.folder_id = currentFolder;
        }
        const { error: dbError } = await supabase.from('files').insert([fileData]);
        if (dbError) throw dbError;
        setUploadProgress(Math.round(((i + 1) / filesToUpload.length) * 100));
      }
      setUploadProgress(100);
      toast.success(`${filesToUpload.length} file${filesToUpload.length > 1 ? 's' : ''} uploaded successfully`);
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
      const { data: folderFiles, error: filesError } = await supabase.from('files').select('id, file_path').eq('folder_id', id);
      if (filesError) throw filesError;
      if (folderFiles && folderFiles.length > 0) {
        const filePaths = folderFiles.map(file => file.file_path).filter(Boolean);
        if (filePaths.length > 0) {
          const { error: storageError } = await supabase.storage.from('audio_files').remove(filePaths);
          if (storageError) throw storageError;
        }
        const { error: dbFilesError } = await supabase.from('files').delete().eq('folder_id', id);
        if (dbFilesError) throw dbFilesError;
      }
      const { error: folderError } = await supabase.from('folders').delete().eq('id', id);
      if (folderError) throw folderError;
      toast.success('Folder deleted successfully');
      fetchFolders();
      triggerStorageUpdate();
    } catch (error: unknown) {
      toast.error(`Failed to delete folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteFile = (id: string, filePath: string | null, fileName: string) => {
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
    const firstItem = selectedItems[0];
    const file = uploadedFiles.find(f => f.id === firstItem);
    const folder = folders.find(f => f.id === firstItem);
    if (file) {
      handleDeleteFile(file.id, file.file_path, file.name);
    } else if (folder) {
      handleDeleteFolder(folder.id, folder.name);
    }
  };

  const confirmDeleteSelected = async () => {
    if (!user) return;
    setShowDeleteDialog(false);
    for (const itemId of selectedItems) {
      const file = uploadedFiles.find(f => f.id === itemId);
      const folder = folders.find(f => f.id === itemId);
      if (file) {
        await deleteFile(file.id, file.file_path || '', file.name);
      } else if (folder) {
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
    setCurrentFolder,
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
