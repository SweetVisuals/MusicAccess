import { Separator } from "@/components/@/ui/separator"
import { SidebarTrigger } from "@/components/@/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/@/ui/avatar"
import { Button } from "@/components/@/ui/button"
import { Badge } from "@/components/@/ui/badge"
import { Input } from "@/components/@/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/@/ui/dropdown-menu"
import { Bell, Settings, LogOut, User, MessageSquare, LayoutGrid, Wallet, Gem, ShoppingCart, ShoppingBag, Trash2, Bookmark, ArrowRight, Search, Camera } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useEffect, useState } from "react"
import { useLocation, Link, useNavigate, useParams } from "react-router-dom"
import { useMessages } from "@/hooks/useMessages"
import { useCart } from "@/contexts/cart-context"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/@/ui/dialog"
import { toast } from "sonner"
import useUserData from "@/hooks/useUserData"
import { CartItem } from "@/lib/types"
import { supabase } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"

export function SiteHeader() {
  const { user, isLoading, signOut } = useAuth()
  const [gemBalance, setGemBalance] = useState<number>(0)
  const [walletBalance, setWalletBalance] = useState<number>(0)
  const [unreadMessages, setUnreadMessages] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const location = useLocation()
  const navigate = useNavigate()
  // const { unreadCount } = useMessages(user?.id || '') // Temporarily commented out for debugging
  const { cart, savedForLater, removeFromCart, saveForLater, moveToCart, loading: cartLoading, recentlyAddedId } = useCart()
  const { ensureUserProfile, userStats } = useUserData()
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [userProfile, setUserProfile] = useState<{ avatarUrl?: string | null; bannerUrl?: string | null } | null>(null)
  const [headerTitle, setHeaderTitle] = useState<string>('Discover'); // New state for header title

  const getCurrentPageName = (path: string) => {
    if (path === '/') {
      return 'Discover'
    }
    
    if (path.startsWith('/dashboard')) {
      const dashboardSegment = path.split('/')[2];
      if (dashboardSegment) {
        return dashboardSegment.charAt(0).toUpperCase() + dashboardSegment.slice(1);
      }
      return 'Dashboard';
    }

    const pathSegments = path.split('/')
    const lastSegment = pathSegments[pathSegments.length - 1]
    
    if (lastSegment === 'beats-instrumentals') {
      return 'Beat & Instrumentals';
    }
    
    if (!lastSegment) return 'Discover';
    
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
  }

  useEffect(() => {
    if (user) {
      ensureUserProfile(user)
    }
  }, [user, ensureUserProfile])

  useEffect(() => {
    if (userStats) {
      setGemBalance(userStats.gems || 0);
      setWalletBalance(userStats.wallet_balance || 0); 
      setUserProfile({
        avatarUrl: userStats.profile_url,
        bannerUrl: userStats.banner_url
      });
    }
  }, [userStats]);

  useEffect(() => {
    console.log('Cart state in header:', cart);
  }, [cart]);

  // useEffect(() => {
  //   setUnreadMessages(unreadCount);
  // }, [unreadCount]); // Temporarily commented out for debugging

  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/view/')) {
      const projectId = path.split('/')[2];
      if (projectId) {
        const fetchProjectTitle = async () => {
          const { data: fullIdData, error: rpcError } = await supabase.rpc(
            "get_full_project_id",
            { short_id: projectId }
          );

          if (rpcError || !fullIdData) {
            console.error("Error resolving full project ID:", rpcError);
            setHeaderTitle('Project View'); // Fallback title
            return;
          }

          const fullProjectId = fullIdData;

          const { data: projectData, error: projectError } = await supabase
            .from("projects")
            .select("title")
            .eq("id", fullProjectId)
            .single();

          if (projectError) {
            console.error("Error fetching project title:", projectError);
            setHeaderTitle('Project View'); // Fallback title
          } else if (projectData) {
            setHeaderTitle(projectData.title);
          } else {
            setHeaderTitle('Project View'); // Fallback if no data
          }
        };
        fetchProjectTitle();
      } else {
        setHeaderTitle('Project View'); // Fallback if no projectId
      }
    } else {
      setHeaderTitle(getCurrentPageName(path));
    }
  }, [location.pathname]); // Re-run when path changes

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price || 0), 0);

  const handleProfileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !user) {
      return;
    }
    
    const file = event.target.files[0];
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 5;
          return newProgress >= 95 ? 95 : newProgress;
        });
      }, 100);
      
      const fileId = uuidv4();
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${fileId}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          profile_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (updateError) throw updateError;
      
      setUserProfile(prev => ({
        ...prev,
        avatarUrl: publicUrl
      }));
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      toast.success('Profile picture uploaded successfully');
      
      setTimeout(() => {
        setShowProfileDialog(false);
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);
      
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast.error('Failed to upload profile picture');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  if (isLoading) return null

  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 group-has-data-[collapsible=icon]/sidebar-wrapper:left-[--sidebar-width-icon] group-has-data-[collapsible=icon]/sidebar-wrapper:w-[calc(100%-var(--sidebar-width-icon))] flex h-14 shrink-0 items-center gap-2 border-b transition-[width,height,left] ease-linear fixed top-0 pt-2 left-[--sidebar-width] w-[calc(100%-var(--sidebar-width))] z-50 pb-2.5 bg-background/80 backdrop-blur-md">
      <div className="flex w-full items-center justify-between gap-1 px-4 lg:gap-2 lg:px-6">
        <div className="flex items-center gap-4 flex-1">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="text-base font-medium">{headerTitle}</h1> {/* Use headerTitle here */}
          <div className="relative ml-4 w-[800px]">
            <Search className="absolute left-3 top-[50%] -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search profiles and projects..."
              className="pl-9 pr-3 h-8 rounded-md w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim() !== '') {
                  navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="default" className="flex items-center gap-2 bg-primary/10 text-primary hover:bg-primary/20">
              <Wallet className="h-4 w-4" />
              <span className="text-white">${walletBalance.toFixed(2)}</span>
            </Badge>
            <Badge variant="default" className="flex items-center gap-2 bg-violet-500/10 text-violet-500 hover:bg-violet-500/20">
              <Gem className="h-4 w-4" />
              <span className="text-white">{gemBalance}</span>
            </Badge>
          </div>
          {!user ? (
            <Button asChild variant="ghost" size="sm">
              <a href="/auth/login">
                Login
              </a>
            </Button>
          ) : (
            <>
            <Button asChild variant="ghost" size="sm">
              <a href="/upload">Upload</a>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <ShoppingCart className="h-5 w-5" />
                    {cart.length > 0 && (
                      <span className="absolute -right-0 -top-0 h-4 w-4 rounded-full bg-primary text-[10px] font-bold flex items-center justify-center text-primary-foreground">
                        {cart.length}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-96">
                  <DropdownMenuLabel className="flex items-center justify-between font-semibold text-lg p-4">
                    <span>Shopping Cart</span>
                    {cart.length > 0 && (
                      <Badge variant="secondary">{cart.length} item{cart.length !== 1 ? 's' : ''}</Badge>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {(cart.length === 0 && savedForLater.length === 0) ? (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                      <ShoppingCart className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                      Your cart is empty
                    </div>
                  ) : (
                    <>
                      <div className="max-h-[300px] overflow-y-auto p-2">
                        {cart.length > 0 && (
                          <>
                            {cart.map((item: CartItem) => (
                              <div key={item.id} className={`flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 ${recentlyAddedId === item.id ? 'animate-flash' : ''}`}>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold truncate">{item.title}</p>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    <span>by {item.producer_name}</span>
                                    {item.project_id && item.track_count !== undefined && (
                                      <>
                                        <span className="mx-1">•</span>
                                        <span>{item.track_count} track{item.track_count !== 1 ? 's' : ''}</span>
                                      </>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {item.tags?.slice(0, 2).map((tag: string) => (
                                      <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                                    ))}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold">${(item.price || 0).toFixed(2)}</p>
                                  <div className="flex items-center gap-1 mt-2">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => saveForLater(item.id)}>
                                      <Bookmark className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeFromCart(item.id)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                        {savedForLater.length > 0 && (
                          <>
                            <DropdownMenuSeparator />
                            <div className="p-2">
                              <h3 className="text-sm font-semibold text-muted-foreground">Saved for Later ({savedForLater.length})</h3>
                            </div>
                            {savedForLater.map((item: CartItem) => (
                               <div key={item.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                                 <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-semibold truncate">{item.title}</p>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      <span>by {item.producer_name}</span>
                                      {item.project_id && item.track_count !== undefined && (
                                        <>
                                          <span className="mx-1">•</span>
                                          <span>{item.track_count} track{item.track_count !== 1 ? 's' : ''}</span>
                                        </>
                                      )}
                                    </div>
                                 </div>
                                 <div className="text-right">
                                   <p className="text-sm font-bold">${(item.price || 0).toFixed(2)}</p>
                                   <div className="flex items-center gap-1 mt-2">
                                     <Button variant="outline" size="sm" className="h-7" onClick={() => moveToCart(item.id)}>
                                       Move to cart
                                     </Button>
                                     <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeFromCart(item.id)}>
                                       <Trash2 className="h-4 w-4" />
                                     </Button>
                                   </div>
                                 </div>
                               </div>
                            ))}
                          </>
                        )}
                      </div>
                      <DropdownMenuSeparator />
                      <div className="p-4 bg-muted/50">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-base font-semibold">Subtotal</span>
                          <span className="text-xl font-bold">${subtotal.toFixed(2)}</span>
                        </div>
                        <Button 
                          className="w-full h-11 text-base font-bold" 
                          onClick={handleCheckout}
                          disabled={cart.length === 0}
                        >
                          Proceed to Checkout <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                      </div>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-8 w-8 bg-gray-300 cursor-pointer" onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowProfileDialog(true);
                  }}>
                    {userProfile?.avatarUrl ? (
                      <AvatarImage src={userProfile.avatarUrl} alt="Profile" />
                    ) : (
                      <AvatarFallback className="bg-gray-300" />
                    )}
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={`/user/${user?.user_metadata?.username || 'profile'}`}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/user/dashboard">
                      <LayoutGrid className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/messages">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Messages
                      {/* Temporarily commented out for debugging
                      {unreadMessages > 0 && (
                        <Badge variant="secondary" className="ml-auto">{unreadMessages}</Badge>
                      )} */}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/orders/history">
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Purchases
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
      
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Upload Profile Picture
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center transition-colors border-muted-foreground/25 hover:border-primary/50">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="w-40 h-40 bg-muted rounded-full overflow-hidden relative mx-auto">
                  {userProfile?.avatarUrl ? (
                    <img 
                      src={userProfile.avatarUrl} 
                      alt="Current profile" 
                      className="w-full h-full object-cover opacity-50"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Camera className="h-12 w-12 text-muted-foreground opacity-40" />
                    </div>
                  )}
                  
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <Camera className="h-8 w-8 text-primary" />
                      <p className="text-sm font-medium">Choose your profile picture</p>
                      <p className="text-xs text-muted-foreground">Recommended: Square image, at least 400x400px</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="relative overflow-hidden mt-2"
                        disabled={isUploading}
                      >
                        <input 
                          type="file" 
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                          accept="image/*"
                          onChange={handleProfileUpload}
                          disabled={isUploading}
                        />
                        {isUploading ? 'Uploading...' : 'Select Profile Picture'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading profile picture...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowProfileDialog(false)}
                disabled={isUploading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}
