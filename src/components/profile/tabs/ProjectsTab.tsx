import { useState, useEffect, useMemo } from 'react';
import useProfile from '@/hooks/useProfile';
import { useAuth } from '@/contexts/auth-context';
import ProjectCard from '../music/ProjectCard';
import { Button } from '@/components/ui/button';
import { Plus, Music, File, Check, FileMusic, Image, FileVideo, FileText, Upload, Download, Folder, ChevronRight, Search, Trash2, X } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/@/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/@/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Select as SelectComponent,
  SelectContent as SelectComponentContent,
  SelectItem as SelectComponentItem,
  SelectTrigger as SelectComponentTrigger,
  SelectValue as SelectComponentValue,
} from '@/components/@/ui/select';
import { ScrollArea } from '@/components/@/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/@/ui/tabs';
import { Badge } from '@/components/@/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { type Project, type Profile as UserProfile, type Contract } from '@/lib/types';

interface ContractWithSelection extends Contract {
  isSelected: boolean;
}

const genres = ['Other', 'Lo-Fi', 'Trap', 'House', 'R&B', 'Electronic', 'Drill'];

const subGenres: Record<string, string[]> = {
  'Other': [
    'Experimental', 'Fusion', 'World', 'Classical', 'Jazz', 'Blues', 'Rock', 'Pop', 'Hip Hop',
    'Reggae', 'Funk', 'Soul', 'Gospel', 'Country', 'Folk', 'Indie', 'Alternative', 'Punk',
    'Metal', 'Electronic', 'Ambient', 'Soundtrack', 'Instrumental', 'Vocal', 'Acoustic',
    'Live', 'Remix', 'Cover', 'Original', 'Traditional'
  ],
  'Lo-Fi': [
    'Chill', 'Ambient', 'Study', 'Vaporwave', 'Jazz', 'Hip Hop', 'Instrumental', 'Dreamy',
    'Nostalgic', 'Relaxing', 'Melancholic', 'Smooth', 'Groovy', 'Retro', 'Soulful',
    'Tropical', 'Summer', 'Winter', 'Autumn', 'Spring', 'Night', 'Day', 'Morning', 'Evening',
    'Rainy', 'Sunny', 'Cloudy', 'Stormy', 'Peaceful', 'Calm'
  ],
  'Trap': [
    'Boom Bap', 'Southern', 'Atlanta', 'West Coast', 'East Coast', 'Hard', 'Melodic', 'Dark',
    'Heavy', 'Bass', '808s', 'Hi-Hats', 'Snappy', 'Aggressive', 'Intense', 'Trap Soul',
    'Trap Metal', 'Trap Rock', 'Trap Pop', 'Trap R&B', 'Trap Hip Hop', 'Trap Drill',
    'Trap House', 'Trap Electronic', 'Trap Lo-Fi'
  ],
  'House': [
    'Deep', 'Tech', 'Progressive', 'Minimal', 'Funky', 'Soulful', 'Chicago', 'Detroit', 'UK',
    'Italian', 'French', 'German', 'Dutch', 'Disco', 'Vocal', 'Garage', 'Speed', 'Hard',
    'Tropical', 'Future', 'Bass', 'Melodic', 'Organic', 'Synthetic', 'Analog', 'Digital'
  ],
  'R&B': [
    'Contemporary', 'Neo-Soul', 'Alternative', 'Pop', 'Hip Hop', 'Soul', 'Funk', 'Gospel',
    'Jazz', 'Blues', 'Reggae', 'Afrobeat', 'Smooth', 'Urban', 'Modern', 'Classic', 'Vintage',
    'Motown', 'Stax', 'Atlantic', 'Contemporary Christian', 'Gospel Hip Hop', 'Soul Jazz',
    'Funk Soul', 'Blue-Eyed Soul', 'White Soul'
  ],
  'Electronic': [
    'EDM', 'Techno', 'Trance', 'Dubstep', 'Drum and Bass', 'Ambient', 'Experimental', 'IDM',
    'Glitch', 'Noise', 'Synthwave', 'Vaporwave', 'Chillout', 'Psychedelic', 'Industrial',
    'Electro', 'Synth Pop', 'New Wave', 'Dark Wave', 'EBM', 'Future Bass', 'Trap',
    'Lo-Fi Hip Hop', 'Vapor Trap', 'Wave'
  ],
  'Drill': [
    'UK', 'Chicago', 'New York', 'Brooklyn', 'Harlem', 'South Side', 'West Side', 'East Side',
    'Dark', 'Melodic', 'Trap-influenced', 'Heavy', 'Aggressive', 'Raw', 'Street', 'Gangsta',
    'Horrorcore', 'Horror', 'Dark Trap', 'Drill Trap', 'Drill House', 'Drill Electronic',
    'Drill Lo-Fi', 'Drill Hip Hop', 'Drill R&B'
  ]
};

interface ProjectsTabProps {
  user: UserProfile;
  projects: Project[];
  viewMode?: 'grid' | 'list';
  sortBy?: 'latest' | 'popular' | 'oldest';
  showCreateDialog: boolean;
  setShowCreateDialog: (show: boolean) => void;
  onProjectCreated: () => void;
  isOwner?: boolean;
}

const ProjectsTab = ({ user, projects, viewMode = 'grid', sortBy = 'latest', showCreateDialog, setShowCreateDialog, onProjectCreated, isOwner = false }: ProjectsTabProps) => {
  const { profile } = useProfile();
  const { user: currentUser } = useAuth();
  const userId = user?.id;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    visibility: 'private' as 'private' | 'unlisted' | 'public',
    price: '', // New: Project price
    genre: '',
    sub_genre: [] as string[],
  });
  
  // State for user files
  const [userFiles, setUserFiles] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [trackPrices, setTrackPrices] = useState<Record<string, string>>({});
  const [trackAllowDownloads, setTrackAllowDownloads] = useState<Record<string, boolean>>({}); // New: Individual track download toggle
  const [contractFile, setContractFile] = useState<File | null>(null);

  // State for contracts
  const [contracts, setContracts] = useState<ContractWithSelection[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(false);
  
  // State for file browser
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [folders, setFolders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // State for track groups
  const [trackGroups, setTrackGroups] = useState<any[]>([]);
  const [showCreateTrackGroup, setShowCreateTrackGroup] = useState(false);
  const [newTrackName, setNewTrackName] = useState('');
  const [trackGroupVariantTypes, setTrackGroupVariantTypes] = useState<Record<string, string>>({});
  const [trackGroupPrices, setTrackGroupPrices] = useState<Record<string, string>>({});
  const [trackGroupSelectedFiles, setTrackGroupSelectedFiles] = useState<string[]>([]);
   
  const allGroupFileIds = useMemo(() => {
    const ids = new Set<string>();
    trackGroups.forEach(group => {
      group.files.forEach((file: any) => ids.add(file.id));
    });
    return ids;
  }, [trackGroups]);

  // Fetch user's files from the 'files' table
  const fetchUserFiles = async () => {
    if (!userId) return;
    
    setLoadingFiles(true);
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      const fetchedFiles = data.map(file => ({
        id: file.id,
        name: file.name,
        type: getMimeTypeFromName(file.file_path || file.name), // Use file_path for MIME type as it contains the extension
        size: file.size || 0,
        sizeFormatted: formatBytes(file.size || 0),
        created_at: file.created_at,
        path: file.file_path,
        url: file.file_url,
        description: file.description || '',
        folder_id: file.folder_id,
      }));
      
      setUserFiles(fetchedFiles);
    } catch (err) {
      console.error('Error fetching user files:', err);
      toast.error('Error fetching your files');
    } finally {
      setLoadingFiles(false);
    }
  };

  const fetchFolders = async () => {
    if (!userId) return;

    try {
      // Always fetch all folders to build proper breadcrumb trails
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', userId)
        .order('name');

      if (error) throw error;

      setFolders(data || []);
    } catch (error) {
      console.error('Error fetching folders:', error);
      toast.error('Failed to load folders');
    }
  };

  const navigateToFolder = (folderId: string | null) => {
    setCurrentFolder(folderId);
  };
  
  // Helper function to guess MIME type from filename
  const getMimeTypeFromName = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    
    if (!ext) return 'application/octet-stream';
    
    const mimeTypes: Record<string, string> = {
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg',
      'flac': 'audio/flac',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'mp4': 'video/mp4',
      'mov': 'video/quicktime',
      'pdf': 'application/pdf',
      'txt': 'text/plain'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  };
  
  // Format bytes to human-readable size
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Get file icon based on type
  const getFileIcon = (mimeType: string | undefined) => {
    // Use a consistent color (green, typically associated with audio/music in this context)
    const colorClass = "h-5 w-5 text-green-500"; // Retain variable definition for clarity

    // Use explicit class names to ensure Tailwind compilation
    if (!mimeType) return <File className="h-5 w-5 text-green-500" />;
    
    if (mimeType.startsWith('audio/')) {
      return <FileMusic className="h-5 w-5 text-green-500" />;
    } else if (mimeType.startsWith('image/')) {
      return <Image className="h-5 w-5 text-green-500" />;
    } else if (mimeType.startsWith('video/')) {
      return <FileVideo className="h-5 w-5 text-green-500" />;
    } else if (mimeType.includes('pdf') || mimeType.includes('text')) {
      return <FileText className="h-5 w-5 text-green-500" />;
    }
    
    return <File className="h-5 w-5 text-green-500" />;
  };
  
  // Toggle file selection
  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => {
      if (prev.includes(fileId)) {
        return prev.filter(id => id !== fileId);
      } else {
        return [...prev, fileId];
      }
    });
  };
  
  // Fetch contracts for the user
  const fetchUserContracts = async () => {
    if (!userId) return;

    setLoadingContracts(true);
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Add isSelected property to each contract
      const contractsWithSelection = (data || []).map(contract => ({
        ...contract,
        isSelected: false
      }));

      setContracts(contractsWithSelection);
    } catch (err) {
      console.error('Error fetching user contracts:', err);
      toast.error('Error fetching your contracts');
    } finally {
      setLoadingContracts(false);
    }
  };

  // Fetch user files and folders on component mount
  useEffect(() => {
    if (userId) {
      fetchUserFiles();
      fetchFolders();
      fetchUserContracts();
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchFolders();
    }
  }, [currentFolder, userId]);

  // Reset selected files and contracts when dialog is opened
  useEffect(() => {
    if (showCreateDialog) {
      // Don't reset selectedFiles and trackPrices as they should persist across tabs
      setTrackAllowDownloads({}); // Reset individual track download toggles
      setContractFile(null);
      // Reset contract selections
      setContracts(prev => prev.map(contract => ({ ...contract, isSelected: false })));
      // Reset form data
      setFormData({ title: '', description: '', visibility: 'private', price: '', genre: '', sub_genre: [] });
      // Reset track groups
      setTrackGroups([]);
      setNewTrackName('');
      setTrackGroupVariantTypes({});
      setTrackGroupPrices({});
      setTrackGroupSelectedFiles([]);
    }
  }, [showCreateDialog]);




  // Handle project creation
  const handleCreateProject = async () => {
    if (!userId) {
      toast.error("You must be logged in to create a project");
      return;
    }
    
    if (!formData.title.trim()) {
      toast.error("Please enter a title for your project");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create a new project
      const projectId = uuidv4();
      const { error: projectError } = await supabase
        .from('projects')
        .insert({
          id: projectId,
          user_id: userId,
          title: formData.title,
          description: formData.description,
          visibility: formData.visibility,
          price: formData.price ? parseFloat(formData.price) : null, // Save project price
          genre: formData.genre || null,
          sub_genre: formData.sub_genre.length > 0 ? formData.sub_genre : null,
          type: 'audio'
        });
      
      if (projectError) throw projectError;
      
      // Handle contract attachment
      const selectedContracts = contracts.filter(contract => contract.isSelected);
      if (selectedContracts.length > 0) {
        const contractAttachments = selectedContracts.map(contract => ({
          project_id: projectId,
          contract_id: contract.id,
          user_id: userId
        }));

        const { error: contractsError } = await supabase
          .from('project_contracts')
          .insert(contractAttachments);

        if (contractsError) {
          console.error('Error attaching contracts:', contractsError);
          toast.warning('Project created but failed to attach some contracts');
        }
      } else if (contractFile) {
        // Upload new contract
        const contractFileName = `${userId}/${projectId}/${contractFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('contracts')
          .upload(contractFileName, contractFile);

        if (uploadError) {
          console.error('Error uploading contract:', uploadError);
          toast.error('Failed to upload contract.');
        } else {
          const { data: publicUrlData } = supabase.storage
            .from('contracts')
            .getPublicUrl(contractFileName);
          const contractUrl = publicUrlData?.publicUrl;

          if (contractUrl) {
            await supabase
              .from('projects')
              .update({ contract_url: contractUrl })
              .eq('id', projectId);
          }
        }
      }

      // Handle track groups first
      if (trackGroups.length > 0) {
        let currentPosition = 1;

        for (let groupIndex = 0; groupIndex < trackGroups.length; groupIndex++) {
          const group = trackGroups[groupIndex];

          // Create the main audio track first
          let mainTrackId: string | null = null;
          if (group.files.length > 0) {
            const firstFile = group.files[0];
            const { data: trackData, error: trackError } = await supabase.from('audio_tracks').insert({
              project_id: projectId,
              user_id: userId,
              title: group.trackName || firstFile.name,
              audio_url: firstFile.url,
              allow_download: trackAllowDownloads[firstFile.id] || false,
              price: group.prices[firstFile.id] || null,
            }).select('id').single();

            if (trackError) {
              console.error('Error inserting main track for track group:', trackError);
              toast.error(`Failed to add track ${group.trackName} to the project.`);
              continue;
            }
            mainTrackId = trackData.id;
          }

          // Process each file in the track group
          // Ensure unique variant types within the group
          const usedVariantTypes = new Set<string>();
          for (let fileIndex = 0; fileIndex < group.files.length; fileIndex++) {
            const file = group.files[fileIndex];
            let variantType = group.variantTypes[fileIndex] || getDefaultVariantType(file.name);

            // Ensure variant type is unique within this track group
            let counter = 1;
            let originalVariantType = variantType;
            while (usedVariantTypes.has(variantType)) {
              variantType = `${originalVariantType}_${counter}`;
              counter++;
            }
            usedVariantTypes.add(variantType);

            const filePrice = group.prices[file.id] || null;
            const allowDownloads = trackAllowDownloads[file.id] || false;

            // Add to project_files
            const { error: projectFileError } = await supabase.from('project_files').insert({
              project_id: projectId,
              file_id: file.id,
              position: currentPosition,
              price: filePrice,
              allow_downloads: allowDownloads,
            });

            if (projectFileError) {
              console.error('Error inserting project file for track group:', projectFileError);
              toast.error(`Failed to add file ${file.name} from track group to the project.`);
              continue;
            }

            // Add variant to track_variants table
            if (mainTrackId) {
              const { error: variantError } = await supabase.from('track_variants').insert({
                track_id: mainTrackId,
                variant_type: variantType,
                file_id: file.id,
              });

              if (variantError) {
                console.error('Error inserting track variant:', variantError);
                toast.error(`Failed to add variant for ${file.name}.`);
              }
            }

            currentPosition++;
          }
        }
      }

      // Handle individual files (excluding those already in track groups)
      if (selectedFiles.length > 0) {
        // Get all file IDs that are already in track groups
        const trackGroupFileIds = new Set();
        trackGroups.forEach(group => {
          group.files.forEach((file: any) => {
            trackGroupFileIds.add(file.id);
          });
        });

        // Filter out files that are already in track groups
        const individualFiles = userFiles.filter(file =>
          selectedFiles.includes(file.id) && !trackGroupFileIds.has(file.id)
        );

        const usedTitles = new Set<string>();

        for (let i = 0; i < individualFiles.length; i++) {
          const file = individualFiles[i];

          const rawPrice = trackPrices[file.id];
          const trackPrice = (rawPrice && !isNaN(parseFloat(rawPrice))) ? parseFloat(rawPrice) : null;
          const allowDownloads = trackAllowDownloads[file.id] || false;

          // Add to project_files with price and download permission
          const { error: projectFileError } = await supabase.from('project_files').insert({
            project_id: projectId,
            file_id: file.id,
            position: i + 1, // Simple position for individual files
            price: trackPrice,
            allow_downloads: allowDownloads,
          });

          if (projectFileError) {
            console.error('Error inserting project file:', projectFileError);
            toast.error(`Failed to add file ${file.name} to the project.`);
            continue; // Skip this file and continue with the next
          }

          // If it's an audio file, add it to tracks as well
          if (file.type && file.type.startsWith('audio/')) {
            let title = file.name;
            let counter = 1;
            while (usedTitles.has(title)) {
              title = `${file.name} (${counter})`;
              counter++;
            }
            usedTitles.add(title);

            const allowDownloads = trackAllowDownloads[file.id] || false; // Get the download status
            const trackPrice = trackPrices[file.id] ? parseFloat(trackPrices[file.id]) : null;

            const { error: trackError } = await supabase.from('audio_tracks').insert({
              project_id: projectId,
              user_id: userId,
              title: title,
              audio_url: file.url,
              allow_download: allowDownloads,
              price: trackPrice, // Include price field
            });

            if (trackError) {
              console.error('Error inserting track:', trackError);
              toast.error(`Failed to add track ${file.name} to the project.`);
            }
          }
        }
      }
      
      toast.success("Project created successfully!");
      setShowCreateDialog(false);
      setFormData({ title: '', description: '', visibility: 'private', price: '', genre: '', sub_genre: [] }); // Reset form
      setSelectedFiles([]);
      setTrackPrices({});
      setTrackAllowDownloads({});
      setContractFile(null);
      // Reset contract selections
      setContracts(prev => prev.map(contract => ({ ...contract, isSelected: false })));

      // Refresh projects
      onProjectCreated();
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error("Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  };

  const searchedUserFiles = userFiles.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filesInView = searchedUserFiles.filter(file => 
    (file.folder_id || null) === currentFolder
  );

  const filteredFolders = folders.filter(folder => {
    // Show folders that are children of the current folder (or root folders if no current folder)
    const isChildOfCurrent = currentFolder ? folder.parent_id === currentFolder : !folder.parent_id;
    const matchesSearch = folder.name.toLowerCase().includes(searchQuery.toLowerCase());
    return isChildOfCurrent && matchesSearch;
  });

  const handleCreateTrackGroup = () => {
    if (!newTrackName.trim() || trackGroupSelectedFiles.length === 0) {
      toast.error("Please enter a track name and select at least one file");
      return;
    }

    const selectedFileData = userFiles.filter(file => trackGroupSelectedFiles.includes(file.id));
    const variantTypes = trackGroupSelectedFiles.map(fileId => trackGroupVariantTypes[fileId] || 'mp3');
    const prices = trackGroupSelectedFiles.reduce((acc, fileId) => {
      const price = trackGroupPrices[fileId];
      if (price && !isNaN(parseFloat(price))) {
        const file = selectedFileData.find(f => f.id === fileId);
        if (file) {
          acc[file.id] = parseFloat(price);
        }
      }
      return acc;
    }, {} as Record<string, number>);

    const newTrackGroup = {
      trackName: newTrackName,
      files: selectedFileData,
      variantTypes,
      prices,
      id: Date.now().toString()
    };

    setTrackGroups(prev => [...prev, newTrackGroup]);

    // Add files from the new track group to the main selectedFiles list
    setSelectedFiles(prev => {
      const newFiles = selectedFileData.map(f => f.id).filter(id => !prev.includes(id));
      return [...prev, ...newFiles];
    });

    // Reset form
    setNewTrackName('');
    setTrackGroupSelectedFiles([]);
    setTrackGroupVariantTypes({});
    setTrackGroupPrices({});
    setShowCreateTrackGroup(false);

    toast.success("Track group created successfully!");
  };

  const handleVariantTypeChange = (fileId: string, variantType: string) => {
    setTrackGroupVariantTypes(prev => ({ ...prev, [fileId]: variantType }));
  };

  const handleVariantPriceChange = (fileId: string, price: string) => {
    setTrackGroupPrices(prev => ({ ...prev, [fileId]: price }));
  };

  const getFileFormat = (fileName: string, filePath?: string | null): string => {
    // First try to get extension from filePath if available (more reliable)
    if (filePath && filePath.includes('.')) {
      const pathExtension = filePath.split('.').pop()?.toLowerCase();
      if (pathExtension) {
        const formatMap: { [key: string]: string } = {
          'mp3': 'MP3', 'wav': 'WAV', 'flac': 'FLAC', 'aac': 'AAC', 'ogg': 'OGG',
          'wma': 'WMA', 'm4a': 'M4A', 'aiff': 'AIFF', 'au': 'AU', 'ra': 'RA',
          'mp4': 'MP4', 'avi': 'AVI', 'mov': 'MOV', 'wmv': 'WMV', 'flv': 'FLV',
          'webm': 'WEBM', 'mkv': 'MKV', 'jpg': 'JPG', 'jpeg': 'JPEG', 'png': 'PNG',
          'gif': 'GIF', 'bmp': 'BMP', 'tiff': 'TIFF', 'webp': 'WEBP', 'svg': 'SVG',
          'pdf': 'PDF', 'doc': 'DOC', 'docx': 'DOCX', 'txt': 'TXT', 'rtf': 'RTF',
          'odt': 'ODT', 'zip': 'ZIP', 'rar': 'RAR', '7z': '7Z', 'tar': 'TAR', 'gz': 'GZ'
        };
        return formatMap[pathExtension] || pathExtension.toUpperCase();
      }
    }

    // Fallback to filename if filePath doesn't work
    if (fileName && fileName.includes('.')) {
      const nameExtension = fileName.split('.').pop()?.toLowerCase();
      if (nameExtension) {
        const formatMap: { [key: string]: string } = {
          'mp3': 'MP3', 'wav': 'WAV', 'flac': 'FLAC', 'aac': 'AAC', 'ogg': 'OGG',
          'wma': 'WMA', 'm4a': 'M4A', 'aiff': 'AIFF', 'au': 'AU', 'ra': 'RA',
          'mp4': 'MP4', 'avi': 'AVI', 'mov': 'MOV', 'wmv': 'WMV', 'flv': 'FLV',
          'webm': 'WEBM', 'mkv': 'MKV', 'jpg': 'JPG', 'jpeg': 'JPEG', 'png': 'PNG',
          'gif': 'GIF', 'bmp': 'BMP', 'tiff': 'TIFF', 'webp': 'WEBP', 'svg': 'SVG',
          'pdf': 'PDF', 'doc': 'DOC', 'docx': 'DOCX', 'txt': 'TXT', 'rtf': 'RTF',
          'odt': 'ODT', 'zip': 'ZIP', 'rar': 'RAR', '7z': '7Z', 'tar': 'TAR', 'gz': 'GZ'
        };
        return formatMap[nameExtension] || nameExtension.toUpperCase();
      }
    }

    return 'Unknown';
  };

  const getDefaultVariantType = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const filename = fileName.toLowerCase();

    // Check for stems in filename first (case insensitive)
    if (filename.includes('stem')) {
      return 'stems';
    }

    // Map file extensions to variant types
    const variantMap: { [key: string]: string } = {
      'mp3': 'mp3',
      'wav': 'wav',
      'flac': 'other',
      'aac': 'other',
      'ogg': 'other',
      'wma': 'other',
      'm4a': 'other',
      'aiff': 'other',
      'au': 'other',
      'ra': 'other'
    };

    return variantMap[extension || ''] || 'mp3';
  };

  const buildBreadcrumbTrail = (targetFolderId: string | null) => {
    if (!targetFolderId) {
      return [
        <Button
          key="all-files"
          variant="ghost"
          className="h-8 px-2"
          onClick={() => navigateToFolder(null)}
        >
          All Files
        </Button>
      ];
    }

    const trail = [];
    let currentId: string | null = targetFolderId;

    // Build the trail by going up the hierarchy
    const folderMap = new Map(folders.map(f => [f.id, f]));

    while (currentId) {
      const folder = folderMap.get(currentId);
      if (!folder) break;

      trail.unshift(
        <Button
          key={folder.id}
          variant="ghost"
          className="h-8 px-2"
          onClick={() => navigateToFolder(folder.id)}
        >
          {folder.name}
        </Button>
      );
      currentId = folder.parent_id;
    }

    // Add "All Files" at the beginning
    trail.unshift(
      <Button
        key="all-files"
        variant="ghost"
        className="h-8 px-2"
        onClick={() => navigateToFolder(null)}
      >
        All Files
      </Button>
    );

    // Add chevrons between items
    const breadcrumbWithChevrons: React.ReactNode[] = [];
    trail.forEach((item, index) => {
      if (index > 0) {
        breadcrumbWithChevrons.push(
          <ChevronRight key={`chevron-${index}`} className="h-4 w-4 text-muted-foreground" />
        );
      }
      breadcrumbWithChevrons.push(item);
    });

    return breadcrumbWithChevrons;
  };

  if (!userId) return <div className="p-4">Please log in to view your projects.</div>;
  
  // Sort projects based on sortBy parameter
  let sortedProjects = [...projects];
  if (sortBy === 'latest') sortedProjects.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  if (sortBy === 'oldest') sortedProjects.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  // Add 'popular' sorting if you have a metric

  return (
    <>
      <style>
        {`
          .custom-scroll::-webkit-scrollbar {
            width: 1px;
          }
          .custom-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scroll::-webkit-scrollbar-thumb {
            background: rgb(156 163 175);
            border-radius: 0.5px;
          }
          .custom-scroll::-webkit-scrollbar-thumb:hover {
            background: rgb(107 114 128);
          }
        `}
      </style>
      <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Projects</h2>
      </div>
      
      {!sortedProjects.length ? (
        isOwner ? (
          <div
            className="group relative overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer flex items-center justify-center min-h-[200px]"
            onClick={() => setShowCreateDialog(true)}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Plus className="h-12 w-12 mx-auto text-muted-foreground mb-4 group-hover:text-primary transition-colors" />
                <h3 className="text-lg font-medium">Create your first project</h3>
                <p className="text-muted-foreground mt-2">Click to get started</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No projects found</h3>
            <p className="text-muted-foreground mt-2 mb-4">
              No projects found
            </p>
          </div>
        )
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}>
          {isOwner && viewMode === 'grid' && (
            <div
              className="group relative overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer flex items-center justify-center min-h-[200px]"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-12 w-12 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="sr-only">Create new project</span>
            </div>
          )}
          {isOwner && viewMode === 'list' && (
            <div
              className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => setShowCreateDialog(true)}
            >
              <div className="flex items-center gap-3">
                <Plus className="h-6 w-6 text-muted-foreground" />
                <span className="font-medium">Create New Project</span>
              </div>
              <Button variant="ghost" size="sm">
                Create
              </Button>
            </div>
          )}
          {sortedProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              variant={viewMode}
              id={project.id}
              onDelete={onProjectCreated}
              showTracks={true}
            />
          ))}
        </div>
      )}

      {/* Create Project Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="details">Project Details</TabsTrigger>
              <TabsTrigger value="files">Add Files</TabsTrigger>
              <TabsTrigger value="track-groups">Track Groups</TabsTrigger>
              <TabsTrigger value="contracts">Contracts</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title</Label>
                <Input 
                  id="title" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Enter a title for your project"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe your project"
                  rows={4}
                />
              </div>

              {/* New input for project price */}
              <div className="space-y-2">
                <Label htmlFor="projectPrice">Project Price (optional)</Label>
                <Input
                  id="projectPrice"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  placeholder="e.g., 99.99"
                />
              </div>

              {/* Genre selection */}
              <div className="space-y-2">
                <Label htmlFor="genre">Genre</Label>
                <Select value={formData.genre} onValueChange={(value) => {
                  setFormData({...formData, genre: value, sub_genre: []});
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a genre" />
                  </SelectTrigger>
                  <SelectContent>
                    {genres.map(genre => <SelectItem key={genre} value={genre}>{genre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Sub-genre selection */}
              <div className="space-y-2">
                <Label>Sub-Genres (select multiple)</Label>
                {formData.genre ? (
                  <ScrollArea className="h-32 border rounded p-2">
                    <div className="space-y-2">
                      {subGenres[formData.genre]?.map(sub => (
                        <div key={sub} className="flex items-center space-x-2">
                          <Checkbox
                            id={`sub-${sub}`}
                            checked={formData.sub_genre.includes(sub)}
                            disabled={!formData.sub_genre.includes(sub) && formData.sub_genre.length >= 5}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                if (formData.sub_genre.length < 5) {
                                  setFormData({...formData, sub_genre: [...formData.sub_genre, sub]});
                                }
                              } else {
                                setFormData({...formData, sub_genre: formData.sub_genre.filter(s => s !== sub)});
                              }
                            }}
                          />
                          <Label htmlFor={`sub-${sub}`} className="text-sm">{sub}</Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-sm text-muted-foreground">Select a genre first</p>
                )}

                {/* Selected Sub-Genres Display */}
                {formData.sub_genre.length > 0 && (
                  <div className="mt-2">
                    <Label className="text-sm">Selected Sub-Genres:</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {formData.sub_genre.map(sub => (
                        <Badge key={sub} variant="secondary" className="text-xs">
                          {sub}
                          <button
                            onClick={() => setFormData({...formData, sub_genre: formData.sub_genre.filter(s => s !== sub)})}
                            className="ml-1 text-xs hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </TabsContent>
            
            <TabsContent value="files" className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  {buildBreadcrumbTrail(currentFolder)}
                </div>
                <div className="relative w-full max-w-xs">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search files..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <ScrollArea className="h-[400px] border rounded-lg shadow-sm bg-card p-4 custom-scroll">
                {loadingFiles ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-3">
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-8 w-8 rounded-full border-2 border-primary border-opacity-20"></div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-8 w-8 rounded-full border-t-2 border-primary animate-spin"></div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground animate-pulse">Loading your files...</p>
                  </div>
                ) : (
                  <>
                    {/* Folders */}
                    {filteredFolders.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-base font-medium mb-3">Folders</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {filteredFolders.map(folder => (
                            <div 
                              key={folder.id}
                              className="border rounded-lg p-4 hover:bg-muted/50 transition-all duration-200 cursor-pointer flex items-center gap-3"
                              onClick={() => navigateToFolder(folder.id)}
                            >
                              <Folder className="h-6 w-6 text-primary" />
                              <span className="font-medium truncate" title={folder.name}>{folder.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Files */}
                    <div>
                      <h3 className="text-base font-medium mb-3">
                        {currentFolder ? folders.find(f => f.id === currentFolder)?.name || 'Files' : 'Files'}
                      </h3>
                      {filesInView.length === 0 ? (
                        <div className="text-center py-12">
                          <File className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <h4 className="text-lg font-medium">No files found</h4>
                          <p className="text-muted-foreground mt-2">
                            {currentFolder ? 'This folder is empty.' : 'You haven\'t uploaded any files yet.'}
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {filesInView.map(file => {
                            const isSelected = selectedFiles.includes(file.id);
                            return (
                              <div
                                key={file.id}
                                className={`border rounded-lg p-2 transition-all duration-200 cursor-pointer flex flex-col overflow-hidden ${isSelected ? 'bg-primary/5 border-primary shadow-md' : 'hover:bg-muted/50'}`}
                                onClick={() => toggleFileSelection(file.id)}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <div className="flex-shrink-0">{getFileIcon(file.type)}</div>
                                    <span className="font-medium text-sm truncate" title={file.name}>{file.name}</span>
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    {isSelected && trackPrices[file.id] && (
                                      <span className="text-xs font-medium">${trackPrices[file.id]}</span>
                                    )}
                                    {isSelected && trackAllowDownloads[file.id] && (
                                      <Download className="h-4 w-4 text-green-500" />
                                    )}
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 ml-1 ${isSelected ? 'bg-primary text-primary-foreground' : 'border border-muted-foreground/30'}`}>
                                      {isSelected && <Check className="h-3 w-3" />}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-xs text-muted-foreground mt-auto space-y-0.5">
                                  <div className="flex justify-between">
                                    <span>Size:</span>
                                    <span>{file.sizeFormatted}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Type:</span>
                                    <span>{file.type?.startsWith('audio/') ? 'MP3' : getFileFormat(file.name, file.path)}</span>
                                  </div>
                                </div>
                                {isSelected && (
                                  <div className="flex items-center space-x-2 mt-2 pt-2 border-t">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className={`h-8 w-8 ${trackAllowDownloads[file.id] ? 'text-green-500' : ''}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const newState = !trackAllowDownloads[file.id];
                                        setTrackAllowDownloads(prev => ({ ...prev, [file.id]: newState }));
                                        toast.success(`Downloads ${newState ? 'enabled' : 'disabled'} for ${file.name}`);
                                      }}
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                    <div className="flex-1">
                                      <Input
                                        id={`price-${file.id}`}
                                        type="number"
                                        value={trackPrices[file.id] || ''}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          setTrackPrices(prev => ({ ...prev, [file.id]: e.target.value }))
                                        }}
                                        placeholder="Price"
                                        className="h-8"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </ScrollArea>

              {/* Selected Files Summary */}
              {selectedFiles.length > 0 && (
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Selected Files ({selectedFiles.length})</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedFiles([])}
                    >
                      Clear All
                    </Button>
                  </div>
                  <ScrollArea className="h-32 custom-scroll">
                    <div className="grid grid-cols-4 gap-2">
                    {selectedFiles.map((fileId) => {
                      const file = userFiles.find(f => f.id === fileId);
                      if (!file) return null;

                      return (
                        <div key={fileId} className="flex flex-col p-2 bg-muted/50 rounded border min-h-[60px]">
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center gap-1 flex-1 min-w-0">
                              <div className="flex-shrink-0">{getFileIcon(file.type)}</div>
                              <span className="text-xs truncate" title={file.name}>{file.name}</span>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {trackPrices[fileId] && (
                                <span className="text-xs font-medium">${trackPrices[fileId]}</span>
                              )}
                              {trackAllowDownloads[fileId] && (
                                <Download className="h-3 w-3 text-green-500" />
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 flex-shrink-0"
                                onClick={() => setSelectedFiles(prev => prev.filter(id => id !== fileId))}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground mt-auto">
                            <div className="text-center">
                              <Badge variant="outline" className="text-xs">
                                {file.type?.startsWith('audio/') ? 'MP3' : getFileFormat(file.name, file.path)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </TabsContent>

            <TabsContent value="track-groups" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Track Groups</h3>
                    <p className="text-sm text-muted-foreground">Group multiple files as variants of the same track</p>
                  </div>
                  {!showCreateTrackGroup && (
                    <Button
                      onClick={() => setShowCreateTrackGroup(true)}
                      className="flex items-center gap-2"
                      disabled={userFiles.filter(f => f.type?.startsWith('audio/')).length === 0}
                    >
                      <Plus className="h-4 w-4" />
                      Create Track Group
                    </Button>
                  )}
                </div>

                {/* Create Track Group Form */}
                {showCreateTrackGroup && (
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold">Create New Track Group</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowCreateTrackGroup(false);
                          setNewTrackName('');
                          setTrackGroupSelectedFiles([]);
                          setTrackGroupVariantTypes({});
                          setTrackGroupPrices({});
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="track-name">Track Name *</Label>
                        <Input
                          id="track-name"
                          placeholder="Enter track name (e.g., Beat 1)"
                          value={newTrackName}
                          onChange={(e) => setNewTrackName(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">* Required field</p>
                      </div>

                      <div className="space-y-2">
                        <Label>Select Audio Files for Track Variants *</Label>
                        <p className="text-sm text-muted-foreground">
                          Select multiple audio files to create different variants (MP3, WAV, STEMS) of the same track
                        </p>

                        <ScrollArea className="border rounded-lg p-4 h-60">
                          <div className="grid grid-cols-2 gap-2">
                            {userFiles
                              .filter(file =>
                                selectedFiles.includes(file.id) &&
                                (trackGroupSelectedFiles.includes(file.id) || !allGroupFileIds.has(file.id))
                              )
                              .map(file => {
                                const isSelected = trackGroupSelectedFiles.includes(file.id);
                                return (
                                  <div
                                    key={file.id}
                                    className={`border rounded p-2 cursor-pointer transition-all ${
                                      isSelected ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
                                    }`}
                                    onClick={() => {
                                      setTrackGroupSelectedFiles(prev => {
                                        if (prev.includes(file.id)) {
                                          return prev.filter(id => id !== file.id);
                                        } else {
                                          return [...prev, file.id];
                                        }
                                      });
                                    }}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="flex-shrink-0">{getFileIcon(file.type)}</div>
                                      <span className="text-sm truncate flex-1" title={file.name}>{file.name}</span>
                                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                        isSelected ? 'bg-primary text-primary-foreground' : 'border border-muted-foreground/30'
                                      }`}>
                                        {isSelected && <Check className="h-3 w-3" />}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                          {userFiles.filter(file => file.type && file.type.startsWith('audio/')).length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                              <Music className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">No audio files available</p>
                              <p className="text-xs">Go to the "Add Files" tab to select audio files first</p>
                            </div>
                          )}
                        </ScrollArea>
                      </div>

                      {trackGroupSelectedFiles.length > 0 && (
                        <div className="space-y-3">
                          <Label>Configure Variants ({trackGroupSelectedFiles.length} files selected)</Label>
                          <div className="space-y-2">
                            {trackGroupSelectedFiles.map((fileId, index) => {
                              const file = userFiles.find(f => f.id === fileId);
                              if (!file) return null;

                              return (
                                <div key={fileId} className="flex items-center gap-3 p-2 border rounded">
                                  <div className="flex items-center gap-2 flex-1">
                                    {getFileIcon(file.type)}
                                    <span className="text-sm truncate">{file.name}</span>
                                  </div>
                                  <SelectComponent
                                    value={trackGroupVariantTypes[fileId] || getDefaultVariantType(file.name)}
                                    onValueChange={(value) => handleVariantTypeChange(fileId, value)}
                                  >
                                    <SelectComponentTrigger className="w-24">
                                      <SelectComponentValue />
                                    </SelectComponentTrigger>
                                    <SelectComponentContent>
                                      <SelectComponentItem value="mp3">MP3</SelectComponentItem>
                                      <SelectComponentItem value="wav">WAV</SelectComponentItem>
                                      <SelectComponentItem value="stems">STEMS</SelectComponentItem>
                                      <SelectComponentItem value="other">Other</SelectComponentItem>
                                    </SelectComponentContent>
                                  </SelectComponent>
                                  <Input
                                    type="number"
                                    placeholder="Price (optional)"
                                    className="w-32"
                                    value={trackGroupPrices[fileId] || trackPrices[fileId] || ''}
                                    onChange={(e) => handleVariantPriceChange(fileId, e.target.value)}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowCreateTrackGroup(false);
                            setNewTrackName('');
                            setTrackGroupSelectedFiles([]);
                            setTrackGroupVariantTypes({});
                            setTrackGroupPrices({});
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleCreateTrackGroup}
                          disabled={!newTrackName.trim() || trackGroupSelectedFiles.length === 0}
                        >
                          Create Track Group
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {trackGroups.length > 0 && (
                  <div className="space-y-3">
                    {trackGroups.map((group, groupIndex) => (
                      <div key={groupIndex} className="border rounded-lg p-4 bg-muted/30">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{group.trackName || `Track ${groupIndex + 1}`}</h4>
                            <Badge variant="outline">{group.files.length} files</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setTrackGroups(prev => prev.filter((_, i) => i !== groupIndex));
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setTrackGroups(prev => prev.filter((_, i) => i !== groupIndex));
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {group.files.map((file: any, fileIndex: number) => (
                            <div key={fileIndex} className="flex items-center gap-2 p-2 bg-background rounded border">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {getFileIcon(file.type)}
                                <span className="text-sm truncate" title={file.name}>{file.name}</span>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {group.variantTypes[fileIndex] || 'MP3'}
                              </Badge>
                            </div>
                          ))}
                        </div>

                        {group.prices && Object.keys(group.prices).length > 0 && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            Prices set for {Object.keys(group.prices).length} variants
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {trackGroups.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No track groups created yet</p>
                    <p className="text-sm">First select audio files in the "Add Files" tab, then create track groups to group them as variants of the same track</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="contracts" className="space-y-4">
              <ScrollArea className="h-[400px] border rounded-lg shadow-sm bg-card p-4">
                {loadingContracts ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-3">
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-8 w-8 rounded-full border-2 border-primary border-opacity-20"></div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-8 w-8 rounded-full border-t-2 border-primary animate-spin"></div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground animate-pulse">Loading your contracts...</p>
                  </div>
                ) : contracts.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h4 className="text-lg font-medium">No contracts found</h4>
                    <p className="text-muted-foreground mt-2 mb-4">
                      You haven't created any contracts yet. Create contracts in the Contracts page first.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Select Existing Contracts</Label>
                      <p className="text-sm text-muted-foreground">
                        Choose from your existing contracts to attach to this project
                      </p>
                    </div>

                    <div className="grid gap-3">
                      {contracts.map((contract) => {
                        const isSelected = contract.isSelected;
                        return (
                          <div
                            key={contract.id}
                            className={`border rounded-lg p-4 transition-all duration-200 cursor-pointer flex items-start gap-3 ${isSelected ? 'bg-primary/5 border-primary shadow-md' : 'hover:bg-muted/50'}`}
                            onClick={() => {
                              setContracts(prev => prev.map(c =>
                                c.id === contract.id
                                  ? { ...c, isSelected: !c.isSelected }
                                  : c
                              ));
                            }}
                          >
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 mt-0.5 ${isSelected ? 'bg-primary text-primary-foreground' : 'border border-muted-foreground/30'}`}>
                              {isSelected && <Check className="h-3 w-3" />}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium truncate">{contract.title}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {contract.type}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    contract.status === 'active' ? 'border-green-500 text-green-500' :
                                    contract.status === 'pending' ? 'border-yellow-500 text-yellow-500' :
                                    contract.status === 'expired' ? 'border-red-500 text-red-500' :
                                    'border-gray-500 text-gray-500'
                                  }`}
                                >
                                  {contract.status}
                                </Badge>
                              </div>

                              <div className="text-sm text-muted-foreground space-y-1">
                                <div>Created: {new Date(contract.created_at).toLocaleDateString()}</div>
                                {contract.expires_at && (
                                  <div>Expires: {new Date(contract.expires_at).toLocaleDateString()}</div>
                                )}
                                {contract.royalty_split && (
                                  <div>Royalty Split: {contract.royalty_split}%</div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="border-t pt-4 mt-6">
                      <div className="space-y-2">
                        <Label htmlFor="contract">Or Upload New Contract</Label>
                        <Input
                          id="contract"
                          type="file"
                          onChange={(e) => setContractFile(e.target.files ? e.target.files[0] : null)}
                          accept=".pdf,.doc,.docx"
                        />
                        {contractFile && (
                          <p className="text-sm text-muted-foreground">
                            Selected: {contractFile.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <div className="flex items-center gap-2">
              <Button onClick={handleCreateProject} disabled={isSubmitting || !formData.title.trim()}>
                {isSubmitting ? 'Creating...' : 'Create Project'}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <span>{formData.visibility.charAt(0).toUpperCase() + formData.visibility.slice(1)}</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setFormData(prev => ({ ...prev, visibility: 'private' }))}>
                    Private
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFormData(prev => ({ ...prev, visibility: 'unlisted' }))}>
                    Unlisted
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFormData(prev => ({ ...prev, visibility: 'public' }))}>
                    Public
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      </div>
    </>
  );
};

export default ProjectsTab;
