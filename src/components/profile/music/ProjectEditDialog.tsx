import { useState, useEffect } from 'react';
import { Button } from '@/components/@/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/@/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/@/ui/checkbox';
import { ScrollArea } from '@/components/@/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/@/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/@/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/@/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { type Project, type Contract as BaseContract } from '@/lib/types';
import { ChevronRight, Search, File, Check, FileMusic, Image, FileVideo, FileText, Download, Folder, Trash2, FileSignature, Plus, X, Music } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Badge } from '@/components/@/ui/badge';

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

interface Contract extends BaseContract {
  isSelected: boolean;
  isCurrentlyAttached?: boolean;
}

interface ProjectEditDialogProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectUpdated: () => void;
}

const ProjectEditDialog = ({ project, open, onOpenChange, onProjectUpdated }: ProjectEditDialogProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: project.title || '',
    description: project.description || '',
    price: project.price ? project.price.toString() : '',
    visibility: project.visibility || 'private' as 'private' | 'unlisted' | 'public',
    genre: project.genre || '',
    sub_genre: (project.sub_genre as string[]) || [],
  });

  // State for user files
  const [userFiles, setUserFiles] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [trackPrices, setTrackPrices] = useState<Record<string, string>>({});
  const [trackAllowDownloads, setTrackAllowDownloads] = useState<Record<string, boolean>>({});
  const [contractFile, setContractFile] = useState<File | null>(null);

  // State for contracts
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(false);

  // State for file browser
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [folders, setFolders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // State for track groups
  const [trackGroups, setTrackGroups] = useState<any[]>([]);
  const [showCreateTrackGroup, setShowCreateTrackGroup] = useState(false);
  const [editingTrackGroupIndex, setEditingTrackGroupIndex] = useState<number | null>(null);
  const [newTrackName, setNewTrackName] = useState('');
  const [trackGroupVariantTypes, setTrackGroupVariantTypes] = useState<Record<string, string>>({});
  const [trackGroupPrices, setTrackGroupPrices] = useState<Record<string, string>>({});
  const [trackGroupSelectedFiles, setTrackGroupSelectedFiles] = useState<string[]>([]);
  const [trackGroupId, setTrackGroupId] = useState<string | null>(null);

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'border-green-500 text-green-500';
      case 'pending':
        return 'border-yellow-500 text-yellow-500';
      case 'expired':
        return 'border-red-500 text-red-500';
      default:
        return 'border-gray-500 text-gray-500';
    }
  };

  const isValidUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  // Reset form data when project changes
  useEffect(() => {
    setFormData({
      title: project.title || '',
      description: project.description || '',
      price: project.price ? project.price.toString() : '',
      visibility: project.visibility || 'private',
      genre: project.genre || '',
      sub_genre: (project.sub_genre as string[]) || [],
    });
  }, [project]);

  // Fetch user's files from the 'files' table
  const fetchUserFiles = async (): Promise<any[]> => {
    if (!user?.id) return [];

    setLoadingFiles(true);
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const fetchedFiles = data.map(file => ({
        id: file.id,
        name: file.name,
        type: getMimeTypeFromName(file.name),
        size: file.size || 0,
        sizeFormatted: formatBytes(file.size || 0),
        created_at: file.created_at,
        path: file.file_path,
        url: file.file_url,
        description: file.description || '',
        folder_id: file.folder_id,
      }));

      setUserFiles(fetchedFiles);
      return fetchedFiles;
    } catch (err) {
      console.error('Error fetching user files:', err);
      toast.error('Error fetching your files');
      return [];
    } finally {
      setLoadingFiles(false);
    }
  };

  const fetchFolders = async () => {
    if (!user?.id) return;

    try {
      // Always fetch all folders to build proper breadcrumb trails
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;

      setFolders(data || []);
    } catch (error) {
      console.error('Error fetching folders:', error);
      toast.error('Failed to load folders');
    }
  };

  // Fetch user's contracts
  const fetchUserContracts = async () => {
    if (!user?.id) return;

    setLoadingContracts(true);
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Add isSelected property to each contract
      const contractsWithSelection = (data || []).map(contract => ({
        ...contract,
        isSelected: false,
        isCurrentlyAttached: false
      }));

      setContracts(contractsWithSelection);
    } catch (err) {
      console.error('Error fetching user contracts:', err);
      toast.error('Error fetching your contracts');
    } finally {
      setLoadingContracts(false);
    }
  };

  // Initialize data when dialog opens
  useEffect(() => {
    if (open && user?.id) {
      const initializeData = async () => {
        const files = await fetchUserFiles();
        fetchFolders();
        fetchUserContracts();
        // Load current project data
        loadCurrentProjectData(files);
      };
      initializeData();
    }
  }, [open, user?.id, project.id]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setContractFile(null);
      setTrackGroups([]);
      setNewTrackName('');
      setTrackGroupVariantTypes({});
      setTrackGroupPrices({});
      setTrackGroupSelectedFiles([]);
      setEditingTrackGroupIndex(null);
    }
  }, [open]);

  // Load current project data (files, tracks, contracts)
  const loadCurrentProjectData = async (files: any[]) => {
    if (!project.id) return;

    const userFilesMap = new Map(files.map(f => [f.id, f]));

    try {
      // First try to load track groups from track_variants (new system)
      const { data: audioTracksData, error: tracksError } = await supabase
        .from('audio_tracks')
        .select('id, title, audio_url, price, allow_download')
        .eq('project_id', project.id);

      if (tracksError) throw tracksError;

      const trackIds = (audioTracksData || []).map(track => track.id);
      const { data: trackVariantsData, error: variantsError } = await supabase
        .from('track_variants')
        .select(`
          id,
          track_id,
          variant_type,
          variant_name,
          file_id,
          files (
            id,
            name,
            file_url,
            file_path
          )
        `)
        .in('track_id', trackIds);

      if (variantsError) throw variantsError;

      const attachedFileIds = new Set<string>();
      const prices: Record<string, string> = {};
      const downloads: Record<string, boolean> = {};

      if (trackVariantsData && trackVariantsData.length > 0) {
        // Use track_variants data (new system)
        const trackGroupsMap = new Map<string, any>();

        trackVariantsData.forEach(tv => {
          if (!tv.files) return;

          const track = audioTracksData?.find(t => t.id === tv.track_id);
          if (!track) return;

          const trackName = track.title;
          const file = tv.files;

          attachedFileIds.add(file.id);
          // Get price from project_files
          const projectFilePrice = prices[file.id];

          if (!trackGroupsMap.has(trackName)) {
            trackGroupsMap.set(trackName, {
              trackName: trackName,
              files: [],
              variantTypes: [],
              prices: {},
              id: track.id,
            });
          }

          const group = trackGroupsMap.get(trackName);
          // Prevent duplicate files in the same track group
          if (!group.files.some((f: any) => f.id === file.id)) {
            group.files.push({
              id: file.id,
              name: file.name,
              type: getMimeTypeFromName(file.file_path || file.name),
              url: file.file_url,
              path: file.file_path,
              size: 0, // Will be set from userFilesMap if available
              sizeFormatted: '0 Bytes',
            });
            // Strip the suffix for display (e.g., "stems_1" becomes "stems")
            const displayVariantType = tv.variant_type.replace(/_[0-9]+$/, '');
            group.variantTypes.push(displayVariantType);
            if (projectFilePrice) group.prices[file.id] = projectFilePrice;
          }
        });

        // Get project_files data for prices and downloads
        const { data: projectFilesData, error: projectFilesError } = await supabase
          .from('project_files')
          .select('file_id, price, allow_downloads')
          .eq('project_id', project.id);

        if (!projectFilesError && projectFilesData) {
          projectFilesData.forEach((pf: any) => {
            if (pf.price) prices[pf.file_id] = pf.price.toString();
            downloads[pf.file_id] = pf.allow_downloads || false;
          });
        }

        // Update files with size info from userFilesMap
        trackGroupsMap.forEach(group => {
          group.files.forEach((file: any) => {
            const fullFile = userFilesMap.get(file.id);
            if (fullFile) {
              file.size = fullFile.size || 0;
              file.sizeFormatted = formatBytes(fullFile.size || 0);
            }
          });
        });

        // Convert map back to array for state
        const reconstructedTrackGroups = Array.from(trackGroupsMap.values()).map(group => ({
          ...group,
          prices: group.files.reduce((acc: Record<string, number>, file: any) => {
            const price = group.prices[file.id];
            if (price) acc[file.id] = price;
            return acc;
          }, {}),
        }));

        setTrackGroups(reconstructedTrackGroups);
      }

      if (!trackVariantsData || trackVariantsData.length === 0) {
        // Fallback to old system: reconstruct from project_files and audio_tracks
        const { data: projectFilesData, error: projectFilesError } = await supabase
          .from('project_files')
          .select(`
            file_id,
            position,
            price,
            allow_downloads
          `)
          .eq('project_id', project.id)
          .order('position', { ascending: true });

        if (projectFilesError) throw projectFilesError;

        const audioTracksMap = new Map(audioTracksData.map(track => [track.audio_url, track]));

        // Group tracks by title to reconstruct track groups
        const trackGroupsMap = new Map<string, any>();

        projectFilesData.forEach((pf: any) => {
          // Use the pre-fetched userFiles map to get file details, avoiding potential RLS issues with nested selects on 'files'
          const file = userFilesMap.get(pf.file_id);
          if (!file) return;

          attachedFileIds.add(file.id);
          if (pf.price) prices[file.id] = pf.price.toString();
          downloads[file.id] = pf.allow_downloads || false;

          if (file.type?.startsWith('audio/') || file.type === 'audio') {
            const track = audioTracksMap.get(file.url); // Use file.url which is file.file_url
            if (track) {
              const trackName = track.title;
              const variantType = getDefaultVariantType(file.name);

              if (!trackGroupsMap.has(trackName)) {
                trackGroupsMap.set(trackName, {
                  trackName: trackName,
                  files: [],
                  variantTypes: [],
                  prices: {},
                  id: track.id,
                });
              }

              const group = trackGroupsMap.get(trackName);
              // Prevent duplicate files in the same track group
              if (!group.files.some((f: any) => f.id === file.id)) {
                group.files.push({
                  id: file.id,
                  name: file.name,
                  type: file.type,
                  url: file.url,
                  path: file.path,
                  size: file.size || 0, // Use file size from the fetched file data
                  sizeFormatted: formatBytes(file.size || 0),
                });
                // Strip the suffix for display (e.g., "stems_1" becomes "stems")
                const displayVariantType = variantType.replace(/_[0-9]+$/, '');
                group.variantTypes.push(displayVariantType);
                if (pf.price) group.prices[file.id] = pf.price;
              }
            }
          }
        });

        // Convert map back to array for state
        const reconstructedTrackGroups = Array.from(trackGroupsMap.values()).map(group => ({
          ...group,
          prices: group.files.reduce((acc: Record<string, number>, file: any) => {
            const price = group.prices[file.id];
            if (price) acc[file.id] = price;
            return acc;
          }, {}),
        }));

        setTrackGroups(reconstructedTrackGroups);
      }

      // Always load all project files for selectedFiles to ensure all files in the project are shown as selected
      const { data: allProjectFilesData, error: allProjectFilesError } = await supabase
        .from('project_files')
        .select('file_id')
        .eq('project_id', project.id);

      if (!allProjectFilesError && allProjectFilesData) {
        allProjectFilesData.forEach(pf => attachedFileIds.add(pf.file_id));
      }

      // Update userFiles state with correct prices/downloads for individual files
      // This ensures selected files are highlighted in the 'Add Files' tab.
      setSelectedFiles(Array.from(attachedFileIds));
      setTrackPrices(prices);
      setTrackAllowDownloads(downloads);

      // Load attached contracts
      const { data: projectContractsData, error: projectContractsError } = await supabase
        .from('project_contracts')
        .select(`
          *,
          contracts (*)
        `)
        .eq('project_id', project.id);

      if (!projectContractsError && projectContractsData) {
        const attachedContractsData = projectContractsData.map((pc: any) => pc.contracts).filter(Boolean);
        // Mark attached contracts in the contracts list
        setContracts(prev => prev.map(contract => ({
          ...contract,
          isCurrentlyAttached: attachedContractsData.some(attached => attached.id === contract.id)
        })));
      }
    } catch (error) {
      console.error('Error loading current project data:', error);
    }
  };


  // Helper functions
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

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string | undefined) => {
    if (!mimeType) return <FileMusic className="h-5 w-5 text-green-500" />; // Default to green music icon for unknown types

    if (mimeType.startsWith('audio/') || mimeType === 'audio' || mimeType.includes('audio')) {
      return <FileMusic className="h-5 w-5 text-green-500" />;
    } else if (mimeType.startsWith('image/')) {
      return <Image className="h-5 w-5 text-green-500" />;
    } else if (mimeType.startsWith('video/')) {
      return <FileVideo className="h-5 w-5 text-purple-500" />;
    } else if (mimeType.includes('pdf') || mimeType.includes('text')) {
      return <FileText className="h-5 w-5 text-orange-500" />;
    }

    // Default to green music icon for any other type (to ensure consistency)
    return <FileMusic className="h-5 w-5 text-green-500" />;
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

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => {
      if (prev.includes(fileId)) {
        return prev.filter(id => id !== fileId);
      } else {
        return [...prev, fileId];
      }
    });
  };

  const navigateToFolder = (folderId: string | null) => {
    setCurrentFolder(folderId);
  };

  const handleCreateTrackGroup = () => {
    if (!newTrackName.trim() || trackGroupSelectedFiles.length === 0) {
      toast.error("Please enter a track name and select at least one file");
      return;
    }

    // Validation removed - duplicates are now handled by appending indices in the database

    const selectedFileData = userFiles.filter(file => trackGroupSelectedFiles.includes(file.id));
    const variantTypes = trackGroupSelectedFiles.map(fileId => trackGroupVariantTypes[fileId] || 'mp3');
    const prices = trackGroupSelectedFiles.reduce((acc, fileId) => {
      const price = trackGroupPrices[fileId];
      if (price && !isNaN(parseFloat(price))) {
        const file = selectedFileData.find((f: any) => f.id === fileId);
        if (file) {
          acc[file.id] = parseFloat(price);
        }
      }
      return acc;
    }, {} as Record<string, number>);

    const trackGroupData = {
      trackName: newTrackName,
      files: selectedFileData,
      variantTypes: variantTypes,
      prices,
      id: trackGroupId || Date.now().toString() // Use existing ID if editing, otherwise new ID
    };

    if (editingTrackGroupIndex !== null) {
      // Edit existing track group
      setTrackGroups(prev => prev.map((group, index) =>
        index === editingTrackGroupIndex ? trackGroupData : group
      ));
      toast.success("Track group updated successfully!");
    } else {
      // Create new track group
      setTrackGroups(prev => [...prev, trackGroupData]);
      toast.success("Track group created successfully!");
    }

    // Reset form
    setNewTrackName('');
    setTrackGroupSelectedFiles([]);
    setTrackGroupVariantTypes({});
    setTrackGroupPrices({});
    setTrackGroupId(null);
    setShowCreateTrackGroup(false);
    setEditingTrackGroupIndex(null);
  };

  const handleVariantTypeChange = (fileId: string, variantType: string) => {
    setTrackGroupVariantTypes(prev => ({ ...prev, [fileId]: variantType }));
  };

  const handleVariantPriceChange = (fileId: string, price: string) => {
    setTrackGroupPrices(prev => ({ ...prev, [fileId]: price }));
  };

  const handleEditTrackGroup = (groupIndex: number) => {
    const group = trackGroups[groupIndex];
    setNewTrackName(group.trackName);
    setTrackGroupSelectedFiles(group.files.map((f: any) => f.id));
    setTrackGroupVariantTypes(
      group.files.reduce((acc: Record<string, string>, file: any, index: number) => {
        // Use stored variant type, or default to mp3 if not available
        acc[file.id] = group.variantTypes[index] || getDefaultVariantType(file.name);
        return acc;
      }, {})
    );
    setTrackGroupPrices(group.prices || {});
    setEditingTrackGroupIndex(groupIndex);
    setShowCreateTrackGroup(true);
    // Preserve the original track ID for editing
    setTrackGroupId(group.id);
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

  const handleUpdateProject = async () => {
    if (!formData.title.trim()) {
      toast.error("Please enter a title for your project");
      return;
    }

    setIsSubmitting(true);

    try {
      // Update project basic info
      const updateData: any = {
        title: formData.title,
        description: formData.description,
        visibility: formData.visibility,
        genre: formData.genre || null,
        sub_genre: formData.sub_genre.length > 0 ? formData.sub_genre : null,
      };

      if (formData.price) {
        updateData.price = parseFloat(formData.price);
      } else {
        updateData.price = null;
      }

      const { error: projectError } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', project.id);

      if (projectError) throw projectError;

      // Handle contract changes
      const selectedContracts = contracts.filter(contract => contract.isSelected);
      if (selectedContracts.length > 0) {
        const contractAttachments = selectedContracts.map(contract => ({
          project_id: project.id,
          contract_id: contract.id,
          user_id: user?.id
        }));

        const { error: contractsError } = await supabase
          .from('project_contracts')
          .insert(contractAttachments);

        if (contractsError) {
          console.error('Error attaching contracts:', contractsError);
          toast.warning('Project updated but failed to attach some contracts');
        }
      } else if (contractFile) {
        // Upload new contract
        const contractFileName = `${user?.id}/${project.id}/${contractFile.name}`;
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
              .eq('id', project.id);
          }
        }
      }


      // Handle file changes - incremental approach: remove deselected, add new, update existing
      if (selectedFiles.length >= 0) { // Always process to handle removals
        try {
          // Get current project files
          const { data: currentProjectFiles, error: fetchError } = await supabase
            .from('project_files')
            .select('file_id, position, price, allow_downloads')
            .eq('project_id', project.id);

          if (fetchError) {
            console.error('Error fetching current project files:', fetchError);
            throw fetchError;
          }

          const currentFileIds = new Set(currentProjectFiles?.map(pf => pf.file_id) || []);
          const newFileIds = new Set(selectedFiles);

          // Find files to remove (in current but not in new selection)
          const filesToRemove = currentProjectFiles?.filter(pf => !newFileIds.has(pf.file_id)) || [];

          // Find files to add (in new selection but not in current)
          const filesToAdd = selectedFiles.filter(fileId => !currentFileIds.has(fileId));

          // Find files to update (in both, but might have changed price/download settings)
          const filesToUpdate = currentProjectFiles?.filter(pf => newFileIds.has(pf.file_id)) || [];

          // Remove deselected files
          if (filesToRemove.length > 0) {
            const removeFileIds = filesToRemove.map(pf => pf.file_id);
            const { error: deleteError } = await supabase
              .from('project_files')
              .delete()
              .eq('project_id', project.id)
              .in('file_id', removeFileIds);

            if (deleteError) {
              console.error('Error removing deselected files:', deleteError);
              toast.error('Failed to remove some files from the project.');
            }

            // Also remove corresponding audio tracks
            const { error: deleteTracksError } = await supabase
              .from('audio_tracks')
              .delete()
              .eq('project_id', project.id)
              .in('audio_url', filesToRemove.map(pf => {
                const file = userFiles.find(f => f.id === pf.file_id);
                return file?.url;
              }).filter(Boolean));

            if (deleteTracksError) {
              console.error('Error removing corresponding tracks:', deleteTracksError);
            }
          }

          // Add newly selected files
          if (filesToAdd.length > 0) {
            const filesToAddData = userFiles.filter(file => filesToAdd.includes(file.id));
            const usedTitles = new Set<string>();

            // Get the next position
            const maxPosition = Math.max(...(currentProjectFiles?.map(pf => pf.position) || []), 0);

            for (let i = 0; i < filesToAddData.length; i++) {
              const file = filesToAddData[i];
              const rawPrice = trackPrices[file.id];
              const trackPrice = (rawPrice && !isNaN(parseFloat(rawPrice))) ? parseFloat(rawPrice) : null;
              const allowDownloads = trackAllowDownloads[file.id] || false;

              const { error: projectFileError } = await supabase.from('project_files').insert({
                project_id: project.id,
                file_id: file.id,
                position: maxPosition + i + 1,
                price: trackPrice,
                allow_downloads: allowDownloads,
              });

              if (projectFileError) {
                console.error('Error inserting project file:', projectFileError);
                toast.error(`Failed to add file ${file.name} to the project.`);
                continue;
              }

              // If it's an audio file, add it to tracks
              if (file.type && file.type.startsWith('audio/')) {
                let title = file.name;
                let counter = 1;
                while (usedTitles.has(title)) {
                  title = `${file.name} (${counter})`;
                  counter++;
                }
                usedTitles.add(title);

                const { error: trackError } = await supabase.from('audio_tracks').insert({
                  project_id: project.id,
                  user_id: user?.id,
                  title: title,
                  audio_url: file.url,
                  allow_download: allowDownloads,
                  price: trackPrice,
                });

                if (trackError) {
                  console.error('Error inserting track:', trackError);
                  toast.error(`Failed to add track ${file.name} to the project.`);
                }
              }
            }
          }

          // Update existing files (price and download settings)
          for (const projectFile of filesToUpdate) {
            const fileId = projectFile.file_id;
            const rawPrice = trackPrices[fileId];
            const newPrice = (rawPrice && !isNaN(parseFloat(rawPrice))) ? parseFloat(rawPrice) : null;
            const newAllowDownloads = trackAllowDownloads[fileId] || false;

            // Only update if something changed
            if (projectFile.price !== newPrice || projectFile.allow_downloads !== newAllowDownloads) {
              const { error: updateError } = await supabase
                .from('project_files')
                .update({
                  price: newPrice,
                  allow_downloads: newAllowDownloads,
                })
                .eq('project_id', project.id)
                .eq('file_id', fileId);

              if (updateError) {
                console.error('Error updating project file:', updateError);
                toast.error(`Failed to update settings for file.`);
              }

              // Also update corresponding audio track
              if (newPrice !== projectFile.price || newAllowDownloads !== projectFile.allow_downloads) {
                const file = userFiles.find(f => f.id === fileId);
                if (file && file.type?.startsWith('audio/')) {
                  const { error: trackUpdateError } = await supabase
                    .from('audio_tracks')
                    .update({
                      price: newPrice,
                      allow_download: newAllowDownloads,
                    })
                    .eq('project_id', project.id)
                    .eq('audio_url', file.url);

                  if (trackUpdateError) {
                    console.error('Error updating audio track:', trackUpdateError);
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('Error in incremental file update:', error);
          toast.error('Failed to update project files');
        }
      }

      // Handle track groups
      if (trackGroups.length > 0) {
        let currentPosition = 1;

        // First, clean up old track variants for tracks that are being updated or removed
        const existingTrackIds = trackGroups
          .map(group => group.id)
          .filter(id => id && !id.startsWith('temp-') && isValidUUID(id)); // Only clean up tracks that have real UUID IDs

        if (existingTrackIds.length > 0) {
          // Delete old track variants for existing tracks
          const { error: deleteVariantsError } = await supabase
            .from('track_variants')
            .delete()
            .in('track_id', existingTrackIds);

          if (deleteVariantsError) {
            console.error('Error deleting old track variants:', deleteVariantsError);
          }

          // Update existing tracks instead of creating new ones
          for (const trackId of existingTrackIds) {
            const group = trackGroups.find(g => g.id === trackId);
            if (group && group.files.length > 0) {
              const firstFile = group.files[0];
              const { error: updateTrackError } = await supabase
                .from('audio_tracks')
                .update({
                  title: group.trackName || firstFile.name,
                  audio_url: firstFile.url,
                  allow_download: trackAllowDownloads[firstFile.id] || false,
                  price: group.prices[firstFile.id] || null,
                })
                .eq('id', trackId);

              if (updateTrackError) {
                console.error('Error updating track:', updateTrackError);
              }
            }
          }
        }

        for (let groupIndex = 0; groupIndex < trackGroups.length; groupIndex++) {
          const group = trackGroups[groupIndex];

          // Use existing track ID if available, otherwise create new track
          let mainTrackId: string | null = group.id && isValidUUID(group.id) ? group.id : null;

          if (!mainTrackId && group.files.length > 0) {
            const firstFile = group.files[0];
            const { data: trackData, error: trackError } = await supabase.from('audio_tracks').insert({
              project_id: project.id,
              user_id: user?.id,
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
          // First, collect all variant types and make duplicates unique
          const variantTypeCounts: Record<string, number> = {};
          const uniqueVariantTypes: string[] = [];

          for (let fileIndex = 0; fileIndex < group.files.length; fileIndex++) {
            const variantType = group.variantTypes[fileIndex] || 'mp3';
            if (!variantTypeCounts[variantType]) {
              variantTypeCounts[variantType] = 0;
            }
            variantTypeCounts[variantType]++;
            uniqueVariantTypes.push(variantType);
          }

          // Make duplicates unique by appending index for non-unique types
          const finalVariantTypes: string[] = [];
          const usedCounts: Record<string, number> = {};

          for (const variantType of uniqueVariantTypes) {
            if (variantTypeCounts[variantType] > 1) {
              // For types that appear multiple times, append an index
              if (!usedCounts[variantType]) {
                usedCounts[variantType] = 0;
              }
              usedCounts[variantType]++;
              finalVariantTypes.push(`${variantType}_${usedCounts[variantType]}`);
            } else {
              finalVariantTypes.push(variantType);
            }
          }

          for (let fileIndex = 0; fileIndex < group.files.length; fileIndex++) {
            const file = group.files[fileIndex];
            const variantType = finalVariantTypes[fileIndex];
            const filePrice = group.prices[file.id] || null;
            const allowDownloads = trackAllowDownloads[file.id] || false;

            // Add to project_files
            const { error: projectFileError } = await supabase.from('project_files').insert({
              project_id: project.id,
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

      toast.success("Project updated successfully!");
      onOpenChange(false);
      onProjectUpdated();
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error("Failed to update project");
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
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
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
              <Label htmlFor="edit-title">Project Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Enter a title for your project"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe your project"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-projectPrice">Project Price (optional)</Label>
              <Input
                id="edit-projectPrice"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                placeholder="e.g., 99.99"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-genre">Genre</Label>
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
                        <Label htmlFor={`sub-${sub}`} className="text-sm font-normal cursor-pointer">
                          {sub}
                        </Label>
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

            <ScrollArea className="h-[400px] border rounded-lg shadow-sm bg-card p-4">
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
                              <span>{getFileFormat(file.name, file.path)}</span>
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
                              {getFileFormat(file.name, file.path)}
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
                    <h4 className="text-lg font-semibold">
                      {editingTrackGroupIndex !== null ? 'Edit Track Group' : 'Create New Track Group'}
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowCreateTrackGroup(false);
                        setNewTrackName('');
                        setTrackGroupSelectedFiles([]);
                        setTrackGroupVariantTypes({});
                        setTrackGroupPrices({});
                        setEditingTrackGroupIndex(null);
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
                      <Label>Select Files for Track Group *</Label>
                      <p className="text-sm text-muted-foreground">
                        {editingTrackGroupIndex !== null
                          ? "Select files to include in this track group"
                          : "Select multiple audio files to create different variants (MP3, WAV, STEMS) of the same track"
                        }
                      </p>

                      <ScrollArea className="border rounded-lg p-4 h-60 custom-scroll">
                        <div className="grid grid-cols-2 gap-2">
                          {userFiles
                            .filter(file => selectedFiles.includes(file.id) || (editingTrackGroupIndex !== null && trackGroupSelectedFiles.includes(file.id)))
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
                        {userFiles.filter(file => selectedFiles.includes(file.id) || (editingTrackGroupIndex !== null && trackGroupSelectedFiles.includes(file.id))).length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <File className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No files available</p>
                            <p className="text-xs">
                              {editingTrackGroupIndex !== null
                                ? "This track group has no files"
                                : 'Go to the "Add Files" tab to select files first'
                              }
                            </p>
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
                                <Select
                                  value={trackGroupVariantTypes[fileId] || getDefaultVariantType(file.name)}
                                  onValueChange={(value) => handleVariantTypeChange(fileId, value)}
                                >
                                  <SelectTrigger className="w-24">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="mp3">MP3</SelectItem>
                                    <SelectItem value="wav">WAV</SelectItem>
                                    <SelectItem value="stems">STEMS</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
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
                          setTrackGroupId(null);
                          setEditingTrackGroupIndex(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateTrackGroup}
                        disabled={!newTrackName.trim() || trackGroupSelectedFiles.length === 0}
                      >
                        {editingTrackGroupIndex !== null ? 'Update Track Group' : 'Create Track Group'}
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
                            onClick={() => handleEditTrackGroup(groupIndex)}
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
                  <FileMusic className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No track groups created yet</p>
                  <p className="text-sm">Select audio files in the "Add Files" tab, then create track groups to group them as variants of the same track</p>
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
              ) : (
                <div className="space-y-4">

                  {/* Select Existing Contracts */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Select Existing Contracts</Label>
                    <p className="text-sm text-muted-foreground">
                      Choose from your existing contracts to attach to this project
                    </p>
                  </div>

                  {contracts.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm">No contracts found</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Create contracts in the Contracts page first
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {contracts
                        .filter(contract => !contract.isCurrentlyAttached)
                        .map((contract) => {
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
                                  <h4 className="font-medium truncate text-sm">{contract.title}</h4>
                                  <Badge variant="outline" className="text-xs">
                                    {contract.type}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${getStatusClass(contract.status)}`}
                                  >
                                    {contract.status}
                                  </Badge>
                                </div>

                                <div className="text-xs text-muted-foreground space-y-1">
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
                  )}

                  <div className="border-t pt-4 mt-6">
                    <div className="space-y-2">
                      <Label htmlFor="edit-contract">Or Upload New Contract</Label>
                      <Input
                        id="edit-contract"
                        type="file"
                        onChange={(e) => setContractFile(e.target.files ? e.target.files[0] : null)}
                        accept=".pdf,.doc,.docx"
                      />
                      {contractFile && (
                        <p className="text-sm text-muted-foreground">
                          Selected: {contractFile.name}
                        </p>
                      )}
                      {project.contract_url && !contractFile && (
                        <p className="text-sm text-muted-foreground">
                          Current contract: {project.contract_url.split('/').pop()}
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <div className="flex items-center gap-2">
            <Button onClick={handleUpdateProject} disabled={isSubmitting || !formData.title.trim()}>
              {isSubmitting ? 'Updating...' : 'Update Project'}
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
    </>
  );
};

export default ProjectEditDialog;
