import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/@/ui/dialog';
import { Button } from '@/components/@/ui/button';
import { Checkbox } from '@/components/@/ui/checkbox';
import { Badge } from '@/components/@/ui/badge';
import { FileText, ShoppingCart } from 'lucide-react';
import { formatDuration } from '@/lib/utils';
import { type Project } from '@/lib/types';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Track {
  id: string;
  title: string;
  audio_url: string;
  price?: number;
  duration?: number;
}

interface TrackVariant {
  id: string;
  track_id: string;
  variant_type: string;
  variant_name: string;
  file_id: string;
  files?: {
    id: string;
    name: string;
    file_url: string;
    file_path: string;
  } | {
    id: string;
    name: string;
    file_url: string;
    file_path: string;
  }[];
}

interface ProjectCartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  audioTracks: Track[];
  onAddToCart: (entityId: string, entityType: 'track' | 'project' | 'service', quantity?: number, selectedFileTypes?: string[]) => Promise<void>;
}

const ProjectCartDialog = ({ open, onOpenChange, project, audioTracks, onAddToCart }: ProjectCartDialogProps) => {
  const [trackVariants, setTrackVariants] = useState<TrackVariant[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string[]>>({});
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [trackGroups, setTrackGroups] = useState<any[]>([]);
  const [variantsLoaded, setVariantsLoaded] = useState(false);
  const [projectFiles, setProjectFiles] = useState<any[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Fetch track variants when dialog opens or audioTracks change
  useEffect(() => {
    if (open) {
      setVariantsLoaded(false);
      setLoadingVariants(true);
      fetchTrackVariants();
    }
  }, [open, project.id, audioTracks]);

  // Update selectAll based on selectedVariants
  useEffect(() => {
    const totalSelected = Object.values(selectedVariants).reduce((sum, arr) => sum + arr.length, 0);
    // Count UI options: MP3 + other variants for each group
    const totalPossible = trackGroups.reduce((sum, group) => {
      const otherVariants = [...new Set(group.variants.map((v: any) => v.variant_type.replace(/_[0-9]+$/, '')))].filter(type => type !== 'mp3');
      return sum + 1 + otherVariants.length; // 1 for MP3 + other variants
    }, 0);
    setSelectAll(totalSelected === totalPossible && totalPossible > 0);
  }, [selectedVariants, trackGroups]);

  const fetchTrackVariants = async () => {
    setLoadingVariants(true);
    try {
      // Always fetch project files and audio tracks to ensure we have the data
      const { data: projectFilesData, error: projectFilesError } = await supabase
        .from('project_files')
        .select(`
          id,
          price,
          allow_downloads,
          files (
            id,
            name,
            file_url,
            file_path
          )
        `)
        .eq('project_id', project.id);

      if (projectFilesError) throw projectFilesError;

      const { data: audioTracksDataRaw, error: audioTracksError } = await supabase
        .from('audio_tracks')
        .select('*')
        .eq('project_id', project.id);

      if (audioTracksError) throw audioTracksError;

      const trackIds = (audioTracksDataRaw || []).map(track => track.id);
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

      const validTrackVariantsData = (trackVariantsData || []).filter(tv => tv.files);

      setProjectFiles(projectFilesData || []);

      // Use audioTracksDataRaw as audioTracksData
      const audioTracksData = audioTracksDataRaw || [];

      // Group by track_id from audio_tracks (proper track groups)
      const groups = new Map<string, any>();

      // First, create groups for each audio track
      audioTracksData.forEach(track => {
        const groupKey = track.id.toString();
        groups.set(groupKey, {
          id: groupKey,
          title: track.title,
          tracks: [track],
          variants: [],
          bestTrack: track
        });
      });

      // Add variants to their respective tracks
      validTrackVariantsData.forEach(tv => {
        const groupKey = tv.track_id.toString();
        if (groups.has(groupKey)) {
          const group = groups.get(groupKey);
          const baseVariantType = tv.variant_type.replace(/_[0-9]+$/, '');
          // Check if we already have this variant type in the group
          const existingVariant = group.variants.find((v: any) => v.variant_type === baseVariantType);
          if (!existingVariant) {
            group.variants.push({
              id: tv.id.toString(),
              track_id: tv.track_id,
              variant_type: baseVariantType, // Use base type for display
              variant_name: tv.variant_name,
              file_id: tv.file_id,
              files: tv.files
            });
          }
        }
      });

      // For tracks without variants, add the main file as MP3 variant
      audioTracksData.forEach(track => {
        const groupKey = track.id.toString();
        const group = groups.get(groupKey);
        if (group.variants.length === 0) {
          // Find the project file for this track
          const projectFile = (projectFilesData || []).find(pf =>
            pf.files && (Array.isArray(pf.files) ? pf.files[0]?.file_url : pf.files.file_url) === track.audio_url
          );
          if (projectFile) {
            const variantType = getFileType(projectFile.files.file_path || projectFile.files.name || projectFile.files.file_url || '');
            group.variants.push({
              id: projectFile.id.toString(),
              track_id: track.id.toString(),
              variant_type: variantType, // Keep original variant type for fallback
              variant_name: null,
              file_id: projectFile.files.id,
              files: projectFile.files
            });
          }
        }
      });

      const allVariants: TrackVariant[] = [];
      groups.forEach(group => {
        allVariants.push(...group.variants);
      });

      setTrackVariants(allVariants);
      setTrackGroups(Array.from(groups.values()));

      // Initialize selected variants for each group (MP3 selected by default if available)
      const initialSelections: Record<string, string[]> = {};
      Array.from(groups.values()).forEach((group: any) => {
        const hasMp3 = group.variants.some((v: any) => v.variant_type.replace(/_[0-9]+$/, '') === 'mp3');
        initialSelections[group.id] = hasMp3 ? ['mp3'] : [];
      });
      setSelectedVariants(initialSelections);
      setVariantsLoaded(true);
    } catch (error) {
      console.error('Error fetching track variants:', error);
    } finally {
      setLoadingVariants(false);
    }
  };

  // Helper function to get file type
  const getFileType = (input: string): string => {
    if (!input) return 'mp3'; // Default to mp3 instead of 'other'

    let extension = '';
    let filename = '';
    if (input.includes('.')) {
      const urlParts = input.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      filename = lastPart.toLowerCase();
      extension = lastPart.split('.').pop()?.toLowerCase() || '';
    }

    // Check for stems in filename first
    if (filename.includes('stem')) {
      return 'stems';
    }

    const formatMap: { [key: string]: string } = {
      'mp3': 'mp3',
      'wav': 'wav',
      'wave': 'wav',
      'zip': 'stems', // STEM files are often ZIP archives
      'rar': 'stems',
      '7z': 'stems',
      'tar': 'stems',
      'gz': 'stems',
      'stem': 'stems'
    };

    return formatMap[extension] || 'mp3'; // Default to mp3
  };

  // Helper function to format variant type for display
  const formatVariantType = (variantType: string): string => {
    // Strip suffix for display (e.g., "mp3_1" becomes "mp3")
    const baseType = variantType.replace(/_[0-9]+$/, '');
    const displayMap: { [key: string]: string } = {
      'mp3': 'MP3',
      'wav': 'WAV',
      'stems': 'STEMS',
      'other': 'OTHER'
    };

    return displayMap[baseType] || baseType.toUpperCase();
  };

  const handleAddToCart = async () => {
    if (selectAll) {
      await onAddToCart(project.id, 'project');
    } else {
      const promises: Promise<void>[] = [];
      Object.entries(selectedVariants).forEach(([groupId, selectedTypes]) => {
        const group = trackGroups.find(g => g.id === groupId);
        if (group && selectedTypes.length > 0) {
          // Calculate total price for all selected variants in this group
          let totalPrice = 0;
          selectedTypes.forEach(type => {
            const variant = group.variants.find((v: any) => v.variant_type.replace(/_[0-9]+$/, '') === type);
            if (variant) {
              const projectFile = projectFiles.find(pf => pf.files && pf.files.id === variant.file_id);
              if (projectFile && projectFile.price) {
                totalPrice += projectFile.price;
              }
            } else if (type === 'mp3' && group.bestTrack?.price) {
              // Fallback for MP3: use the track's price if no variant found
              totalPrice += group.bestTrack.price;
            }
          });

          // Create a single cart item representing the track group (folder)
          const trackGroupData = {
            id: group.bestTrack?.id || group.variants[0]?.track_id,
            title: group.title,
            price: totalPrice,
            producer_name: group.bestTrack?.producer_name,
            producer_avatar_url: group.bestTrack?.producer_avatar_url,
            quantity: 1, // One track group item
            selected_file_types: selectedTypes, // All selected variants for this group
            project_id: project.id, // Link back to project
            type: 'track_group' // Special type to indicate this is a folder
          };

          promises.push(onAddToCart(trackGroupData.id, 'track', trackGroupData.quantity, trackGroupData.selected_file_types));
        }
      });
      await Promise.all(promises);
    }
    onOpenChange(false);
  };

  const handlePreviewContract = () => {
    if (project.contract_url) {
      window.open(project.contract_url, '_blank');
    }
  };

  const handleVariantToggle = (trackId: string, variantType: string) => {
    setSelectedVariants(prev => {
      const currentSelections = prev[trackId] || [];
      const variantExists = currentSelections.includes(variantType);

      if (variantExists) {
        // Remove variant if it's already selected
        return {
          ...prev,
          [trackId]: currentSelections.filter(v => v !== variantType)
        };
      } else {
        // Add variant if it's not selected
        return {
          ...prev,
          [trackId]: [...currentSelections, variantType]
        };
      }
    });
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      const allSelections: Record<string, string[]> = {};
      trackGroups.forEach((group) => {
        const otherTypes = [...new Set(group.variants.map((v: any) => v.variant_type.replace(/_[0-9]+$/, '')))].filter((v): v is string => typeof v === 'string' && v !== 'mp3');
        allSelections[group.id] = ['mp3', ...otherTypes];
      });
      setSelectedVariants(allSelections);
    } else {
      const emptySelections: Record<string, string[]> = {};
      trackGroups.forEach((group) => {
        emptySelections[group.id] = [];
      });
      setSelectedVariants(emptySelections);
    }
  };

  const getTrackVariants = (trackId: string) => {
    return trackVariants.filter(variant => variant.track_id === trackId);
  };

  const getVariantTypesForTrack = (trackId: string) => {
    const variants = getTrackVariants(trackId);
    return [...new Set(variants.map(v => v.variant_type))];
  };

  const calculateTotal = () => {
    if (selectAll) {
      return project.price || 0;
    }

    let total = 0;
    Object.entries(selectedVariants).forEach(([groupId, selectedTypes]) => {
      const group = trackGroups.find(g => g.id === groupId);
      if (group) {
        selectedTypes.forEach(type => {
           const variant = group.variants.find((v: any) => v.variant_type.replace(/_[0-9]+$/, '') === type);
           if (variant) {
             const projectFile = projectFiles.find(pf => pf.files && pf.files.id === variant.file_id);
             if (projectFile && projectFile.price) {
               total += projectFile.price;
             }
           } else if (type === 'mp3' && group.bestTrack?.price) {
             // Fallback for MP3: use the track's price if no variant found
             total += group.bestTrack.price;
           }
         });
      }
    });
    return total;
  };


  if (audioTracks.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add to Cart</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-center py-4 text-sm text-muted-foreground">
              Loading tracks...
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Project to Cart</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Project Info */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">
                {trackGroups.length} track{trackGroups.length !== 1 ? 's' : ''}
              </p>
            </div>
            {project.price && (
              <Badge variant="secondary" className="text-lg font-semibold">
                ${project.price.toFixed(2)}
              </Badge>
            )}
          </div>

          {/* Select All */}
          <div className="flex items-center gap-2 p-4 border rounded-lg">
            <Checkbox checked={selectAll} onCheckedChange={handleSelectAll} />
            <span className="text-sm font-medium">Select All Variants</span>
          </div>

          {/* Tracks List */}
          <div className="space-y-3">
            <h4 className="font-medium">Available Tracks & Variants</h4>
            <div className="space-y-3 max-h-80 overflow-y-auto sidebar-scrollbar pr-2">
              {!variantsLoaded ? (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  Loading tracks...
                </div>
              ) : trackGroups.length > 0 ? (
                trackGroups.map((group) => {
                   const trackVariantTypes = [...new Set(group.variants.map((v: any) => v.variant_type.replace(/_[0-9]+$/, '')))].filter((v): v is string => typeof v === 'string');
                   const currentSelections = selectedVariants[group.id] || [];

                  return (
                    <div key={group.id} className="border rounded-lg p-4 space-y-3">
                      {/* Track Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">
                              {group.title}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {1 + [...new Set(group.variants.map((v: any) => v.variant_type.replace(/_[0-9]+$/, '')))].filter((v): v is string => typeof v === 'string' && v !== 'mp3').length} file{1 + [...new Set(group.variants.map((v: any) => v.variant_type.replace(/_[0-9]+$/, '')))].filter((v): v is string => typeof v === 'string' && v !== 'mp3').length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          {group.tracks[0]?.price && (
                            <p className="text-sm text-muted-foreground">
                              Base Price: ${group.tracks[0].price.toFixed(2)}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {1 + [...new Set(group.variants.map((v: any) => v.variant_type.replace(/_[0-9]+$/, '')))].filter((v): v is string => typeof v === 'string' && v !== 'mp3').length} file{1 + [...new Set(group.variants.map((v: any) => v.variant_type.replace(/_[0-9]+$/, '')))].filter((v): v is string => typeof v === 'string' && v !== 'mp3').length !== 1 ? 's' : ''}
                        </Badge>
                      </div>

                      {/* Variant Selection */}
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Select formats:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {/* Always show MP3 as an option */}
                          <div
                            className={`flex items-center gap-2 p-2 border rounded cursor-pointer transition-all ${
                              currentSelections.includes('mp3') ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
                            }`}
                            onClick={() => handleVariantToggle(group.id, 'mp3')}
                          >
                            <Checkbox checked={currentSelections.includes('mp3')} />
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-medium">MP3</span>
                              <p className="text-xs text-muted-foreground">Default format</p>
                            </div>
                          </div>
                          {/* Show other variants */}
                          {trackVariantTypes.filter(type => type !== 'mp3').map((variantType: string) => {
                            const isSelected = currentSelections.includes(variantType);
                            const variant = group.variants.find((v: any) => v.variant_type.replace(/_[0-9]+$/, '') === variantType);

                            return (
                              <div
                                key={variantType}
                                className={`flex items-center gap-2 p-2 border rounded cursor-pointer transition-all ${
                                  isSelected ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
                                }`}
                                onClick={() => handleVariantToggle(group.id, variantType)}
                              >
                                <Checkbox checked={isSelected} />
                                <div className="flex-1 min-w-0">
                                  <span className="text-xs font-medium">{formatVariantType(variantType)}</span>
                                  <p className="text-xs text-muted-foreground">Additional format</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  No tracks available
                </div>
              )}
            </div>
          </div>

          {/* Total Price */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <span className="font-medium">Total Price</span>
            <Badge variant="secondary" className="text-lg font-semibold">
              ${calculateTotal().toFixed(2)}
            </Badge>
          </div>

          {/* Contract Preview */}
          {project.contract_url && (
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm">Contract Available</span>
              </div>
              <Button variant="outline" size="sm" onClick={handlePreviewContract}>
                Preview Contract
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddToCart} className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            {selectAll ? 'Add Project to Cart' : 'Add Selected Tracks to Cart'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectCartDialog;