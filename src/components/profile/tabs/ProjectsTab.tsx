import { useState, useEffect } from 'react';
import useProfile from '@/hooks/useProfile';
import { useAuth } from '@/contexts/auth-context';
import ProjectCard from '../music/ProjectCard';
import { Button } from '@/components/ui/button';
import { Plus, Music, File, Check, FileMusic, Image, FileVideo, FileText, Upload, Download, Folder, ChevronRight, Search } from 'lucide-react';
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
import { Badge } from '@/components/@/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { type Project, type UserProfile } from '@/lib/types';

interface ProjectsTabProps {
  user: UserProfile;
  viewMode?: 'grid' | 'list';
  sortBy?: 'latest' | 'popular' | 'oldest';
  showCreateDialog: boolean;
  setShowCreateDialog: (show: boolean) => void;
}

const ProjectsTab = ({ user, viewMode = 'grid', sortBy = 'latest', showCreateDialog, setShowCreateDialog }: ProjectsTabProps) => {
  const { profile } = useProfile();
  const { user: currentUser } = useAuth();
  const userId = user?.id;
  const isOwner = currentUser?.id === userId;
  
  // State for projects
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for create project dialog is now managed by props
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isPublic: false,
    price: '', // New: Project price
    allowDownloads: false, // New: Allow project downloads
  });
  
  // State for user files
  const [userFiles, setUserFiles] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [trackPrices, setTrackPrices] = useState<Record<string, string>>({});
  const [trackAllowDownloads, setTrackAllowDownloads] = useState<Record<string, boolean>>({}); // New: Individual track download toggle
  const [contractFile, setContractFile] = useState<File | null>(null);
  
  // State for file browser
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [folders, setFolders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Function to fetch projects with their tracks
  const fetchProjects = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // Fetch projects and creator's username in one go
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*, profiles(*), allow_downloads')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (projectsError) throw projectsError;
      
      if (!projectsData || projectsData.length === 0) {
        setProjects([]);
        setLoading(false);
        return;
      }
      
      // Fetch tracks for each project
      const projectsWithTracks = await Promise.all(projectsData.map(async (project) => {
        const creatorUsername = (project.profiles as any)?.username || 'Unknown';

        let tracks: any[] = [];
        const { data: tracksData, error: tracksError } = await supabase
            .from('tracks')
            .select('*')
            .eq('project_id', project.id)
            .order('created_at', { ascending: true });

        if (tracksError) {
            console.error('Error fetching tracks:', tracksError);
        }

        if (tracksData && tracksData.length > 0) {
            tracks = tracksData.map((track: any) => ({
                id: track.id,
                title: track.title,
                file_url: track.audio_url,
                audioUrl: track.audio_url,
                duration: track.duration || '0:00',
                allow_download: track.allow_download,
            }));
        } else {
            // Fallback for old projects
            const { data: projectFiles, error: filesError } = await supabase
                .from('project_files')
                .select('position, files(id, name, file_url, file_type, allow_download)')
                .eq('project_id', project.id)
                .order('position', { ascending: true });

            if (filesError) {
                console.error('Error fetching project files for fallback:', filesError);
            } else if (projectFiles) {
                tracks = projectFiles.map((pf: any) => {
                  if (!pf.files) return null; // Guard against null files
                  return {
                    id: pf.files.id,
                    title: pf.files.name,
                    file_url: pf.files.file_url,
                    audioUrl: pf.files.file_url,
                    duration: '0:00', // Default duration
                    allow_download: pf.files.allow_download,
                    position: pf.position,
                  };
                }).filter(Boolean); // Remove any null entries
            }
        }

        return {
          ...project,
          tracks,
          totalTracks: tracks.length,
          creator_username: creatorUsername,
        };
      }));
      
      setProjects(projectsWithTracks || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };
   
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
        type: file.file_type, // Assuming file_type is already a simplified string like 'audio', 'image'
        size: file.size || 0,
        sizeFormatted: formatBytes(file.size || 0),
        created_at: file.created_at,
        path: file.file_path,
        url: file.file_url,
        description: file.description || '',
        folder_id: file.folder_id,
      }));
      
      setUserFiles(fetchedFiles);
      
      if (fetchedFiles.length === 0) {
        toast.info('No files found. Try uploading some files first.');
      }
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
      let query = supabase
        .from('folders')
        .select('*')
        .eq('user_id', userId);
      
      if (currentFolder) {
        query = query.eq('parent_id', currentFolder);
      } else {
        query = query.is('parent_id', null);
      }
      
      const { data, error } = await query.order('name');
      
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
    if (!mimeType) return <File className="h-5 w-5 text-gray-500" />;
    
    if (mimeType.startsWith('audio/')) {
      return <FileMusic className="h-5 w-5 text-green-500" />;
    } else if (mimeType.startsWith('image/')) {
      return <Image className="h-5 w-5 text-blue-500" />;
    } else if (mimeType.startsWith('video/')) {
      return <FileVideo className="h-5 w-5 text-purple-500" />;
    } else if (mimeType.includes('pdf') || mimeType.includes('text')) {
      return <FileText className="h-5 w-5 text-orange-500" />;
    }
    
    return <File className="h-5 w-5 text-gray-500" />;
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
  
  // Fetch projects and user files on component mount
  useEffect(() => {
    if (userId) {
      fetchProjects();
      fetchUserFiles();
      fetchFolders();
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchFolders();
    }
  }, [currentFolder, userId]);

  // Effect to update projects in state when the user profile changes
  useEffect(() => {
    if (projects.length > 0 && user) {
      setProjects(currentProjects =>
        currentProjects.map(p =>
          p.user_id === user.id
            ? {
                ...p,
                profiles: {
                  ...(p.profiles || {}),
                  ...user,
                },
              }
            : p
        )
      );
    }
  }, [user]);
  
  // Reset selected files when dialog is opened
  useEffect(() => {
    if (showCreateDialog) {
      setSelectedFiles([]);
      setTrackPrices({});
      setTrackAllowDownloads({}); // Reset individual track download toggles
      setContractFile(null);
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
          is_public: formData.isPublic,
          price: formData.price ? parseFloat(formData.price) : null, // Save project price
          allow_downloads: formData.allowDownloads, // Save download preference
          type: 'audio',
          genre: 'Other'
        });
      
      if (projectError) throw projectError;
      
      // Handle contract upload
      let contractUrl: string | undefined;
      if (contractFile) {
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
          contractUrl = publicUrlData?.publicUrl;
        }
      }

      // Update project with contract URL
      if (contractUrl) {
        await supabase
          .from('projects')
          .update({ contract_url: contractUrl })
          .eq('id', projectId);
      }

      // If files are selected, associate them with the project
      if (selectedFiles.length > 0) {
        const selectedFileData = userFiles.filter(file => selectedFiles.includes(file.id));
        
        for (let i = 0; i < selectedFileData.length; i++) {
          const file = selectedFileData[i];
          
          // Add to project_files with price
          await supabase.from('project_files').insert({
            project_id: projectId,
            file_id: file.id,
            position: i + 1,
            price: trackPrices[file.id] ? parseFloat(trackPrices[file.id]) : 0,
          });

          // If it's an audio file, add it to tracks as well
          if (file.type.startsWith('audio/')) {
            await supabase.from('tracks').insert({
              project_id: projectId,
              title: file.name,
              audio_url: file.url,
              price: trackPrices[file.id] ? parseFloat(trackPrices[file.id]) : 0,
              allow_download: trackAllowDownloads[file.id] || false, // Save individual track download preference
            });
          }
        }
      }
      
      toast.success("Project created successfully!");
      setShowCreateDialog(false);
      setFormData({ title: '', description: '', isPublic: false, price: '', allowDownloads: false }); // Reset form
      setSelectedFiles([]);
      setTrackPrices({});
      setContractFile(null);

      // Refresh projects
      fetchProjects();
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

  const filteredFolders = folders.filter(folder => 
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!userId) return <div className="p-4">Please log in to view your projects.</div>;
  if (loading) return <div className="p-4 animate-pulse">Loading projects...</div>;
  if (error) return <div className="p-4 text-destructive">Error: {error}</div>;
  
  // Sort projects based on sortBy parameter
  let sortedProjects = [...projects];
  if (sortBy === 'latest') sortedProjects.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  if (sortBy === 'oldest') sortedProjects.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  // Add 'popular' sorting if you have a metric

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Projects</h2>
      </div>
      
      {!sortedProjects.length ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No projects found</h3>
          <p className="text-muted-foreground mt-2 mb-4">
            {profile?.id === userId 
              ? "Create your first project to showcase your music" 
              : "No projects found"}
          </p>
          {isOwner && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          )}
        </div>
      ) : (
        <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'gap-4'}`}>
          {sortedProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              variant={viewMode}
              id={project.id}
              onDelete={fetchProjects}
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
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="details">Project Details</TabsTrigger>
              <TabsTrigger value="files">Add Files</TabsTrigger>
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
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="isPublic" 
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => 
                    setFormData({...formData, isPublic: checked as boolean})
                  }
                />
                <Label htmlFor="isPublic">Make this project public</Label>
              </div>

              {/* New checkbox for allowing downloads */}
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="allowDownloads" 
                  checked={formData.allowDownloads}
                  onCheckedChange={(checked) => 
                    setFormData({...formData, allowDownloads: checked as boolean})
                  }
                />
                <Label htmlFor="allowDownloads">Allow project downloads</Label>
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

            </TabsContent>
            
            <TabsContent value="files" className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    className="h-8 px-2"
                    onClick={() => navigateToFolder(null)}
                  >
                    All Files
                  </Button>
                  {currentFolder && (
                    <>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      <Button variant="ghost" className="h-8 px-2">
                        {folders.find(f => f.id === currentFolder)?.name || 'Folder'}
                      </Button>
                    </>
                  )}
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
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 ml-2 ${isSelected ? 'bg-primary text-primary-foreground' : 'border border-muted-foreground/30'}`}>
                                    {isSelected && <Check className="h-3 w-3" />}
                                  </div>
                                </div>
                                <div className="text-xs text-muted-foreground mt-auto space-y-0.5 pt-1.5">
                                  <div className="flex justify-between">
                                    <span>Size:</span>
                                    <span>{file.sizeFormatted}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Type:</span>
                                    <span className="capitalize">{file.type?.split('/')[0] || 'file'}</span>
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
                                        setTrackAllowDownloads(prev => ({ ...prev, [file.id]: !prev[file.id] }))
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
            </TabsContent>

            <TabsContent value="contracts" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contract">Upload Contract</Label>
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
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject} disabled={isSubmitting || !formData.title.trim()}>
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectsTab;
