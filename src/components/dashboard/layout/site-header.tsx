import { Separator } from "@/components/@/ui/separator"
import { SidebarTrigger } from "@/components/@/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/@/ui/avatar"
import { Button } from "@/components/@/ui/button"
import { Badge } from "@/components/@/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/@/ui/dropdown-menu"
import { Bell, Settings, LogOut, User, MessageSquare, LayoutGrid, Wallet, Gem, ShoppingCart, ShoppingBag, Camera } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { ThemeToggle } from "@/components/theme-toggle"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useLocation, Link, useNavigate } from "react-router-dom"
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
import { v4 as uuidv4 } from "uuid"

export function SiteHeader() {
  const { user, isLoading, signOut } = useAuth()
  const [gemBalance, setGemBalance] = useState<number>(0)
  const [walletBalance, setWalletBalance] = useState<number>(0)
  const [unreadMessages, setUnreadMessages] = useState<number>(0)
  const location = useLocation()
  const navigate = useNavigate()
  const { unreadCount } = useMessages(user?.id || '')
  const { cart, removeFromCart, clearCart } = useCart()
  const [showCartDialog, setShowCartDialog] = useState(false)
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [userProfile, setUserProfile] = useState<{ avatarUrl?: string; bannerUrl?: string } | null>(null)

  // Get the current page name from the location
  const getCurrentPageName = () => {
    const path = location.pathname
    
    if (path === '/user/dashboard' || path === '/dashboard') {
      return 'Dashboard'
    }
    
    // Extract the last part of the path and capitalize it
    const pathSegments = path.split('/')
    const lastSegment = pathSegments[pathSegments.length - 1]
    
    if (!lastSegment) return 'Dashboard'
    
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1)
  }

  // Fetch user's gem and wallet balance
  useEffect(() => {
    if (!user) return

    const fetchUserStats = async () => {
      try {
        const { data, error } = await supabase
          .from('user_stats')
          .select('gems')
          .eq('user_id', user.id)
          .single()
        
        if (error) throw error
        
        if (data) {
          setGemBalance(data.gems || 0)
        }
      } catch (error) {
        console.error('Error fetching user stats:', error)
      }
    }

    const fetchUserWallet = async () => {
      try {
        const { data, error } = await supabase
          .from('user_wallets')
          .select('balance')
          .eq('user_id', user.id)
          .maybeSingle()
        
        if (error) throw error
        
        if (data) {
          setWalletBalance(Number(data.balance) || 0)
        } else {
          // Create wallet if it doesn't exist
          await createUserWallet()
        }
      } catch (error) {
        console.error('Error fetching user wallet:', error)
      }
    }

    const createUserWallet = async () => {
      try {
        const { data, error } = await supabase
          .from('user_wallets')
          .insert([
            { user_id: user.id, balance: 0 }
          ])
          .select()
        
        if (error) throw error
        
        if (data && data[0]) {
          setWalletBalance(Number(data[0].balance) || 0)
        }
      } catch (error) {
        console.error('Error creating user wallet:', error)
      }
    }

    fetchUserStats()
    fetchUserWallet()

    // Listen for gem balance updates
    const handleGemBalanceUpdate = () => {
      fetchUserStats()
    }

    window.addEventListener('gem-balance-update', handleGemBalanceUpdate)
    
    return () => {
      window.removeEventListener('gem-balance-update', handleGemBalanceUpdate)
    }
  }, [user])

  // Update unread messages count from the hook
  useEffect(() => {
    setUnreadMessages(unreadCount);
  }, [unreadCount]);
  
  // Fetch user profile data
  useEffect(() => {
    if (!user) return;
    
    const fetchUserProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('profile_url, banner_url')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        
        if (data) {
          setUserProfile({
            avatarUrl: data.profile_url,
            bannerUrl: data.banner_url
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };
    
    fetchUserProfile();
  }, [user]);

  const handleCheckout = () => {
    // Navigate to checkout page instead of showing dialog
    navigate('/checkout');
  };
  
  const handleProfileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !user) {
      return;
    }
    
    const file = event.target.files[0];
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Start progress animation
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 5;
          return newProgress >= 95 ? 95 : newProgress;
        });
      }, 100);
      
      // Generate unique file name
      const fileId = uuidv4();
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${fileId}.${fileExt}`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          profile_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (updateError) throw updateError;
      
      // Update local state
      setUserProfile(prev => ({
        ...prev,
        avatarUrl: publicUrl
      }));
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      toast.success('Profile picture uploaded successfully');
      
      // Close dialog after a short delay
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
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center justify-between gap-1 px-4 lg:gap-2 lg:px-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="text-base font-medium">{getCurrentPageName()}</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="default" className="flex items-center gap-2 bg-primary/10 text-primary hover:bg-primary/20">
              <Wallet className="h-4 w-4" />
              <span>${walletBalance.toFixed(2)}</span>
            </Badge>
            <Badge variant="default" className="flex items-center gap-2 bg-violet-500/10 text-violet-500 hover:bg-violet-500/20">
              <Gem className="h-4 w-4" />
              <span>{gemBalance}</span>
            </Badge>
            {/* Shopping Cart */}
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
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Cart</span>
                  {cart.length > 0 && (
                    <Badge variant="secondary" className="ml-2">{cart.length} item{cart.length !== 1 ? 's' : ''}</Badge>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {cart.length === 0 ? (
                  <div className="py-2 px-2 text-center text-sm text-muted-foreground">
                    Your cart is empty
                  </div>
                ) : (
                  <>
                    <div className="max-h-[200px] overflow-y-auto py-1">
                      {cart.map((item) => (
                        <div key={item.id} className="flex items-center justify-between px-2 py-1.5 hover:bg-muted/50 rounded-sm">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.title}</p>
                            <p className="text-xs text-muted-foreground">${item.price.toFixed(2)}</p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <DropdownMenuSeparator />
                    <div className="p-2">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Total:</span>
                        <span className="text-sm font-bold">
                          ${cart.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
                        </span>
                      </div>
                      <Button 
                        className="w-full" 
                        size="sm"
                        onClick={handleCheckout}
                      >
                        Checkout
                      </Button>
                    </div>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <ThemeToggle />
          {!user ? (
            <Button asChild variant="ghost" size="sm">
              <a href="/auth/login">
                Login
              </a>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <a href="/upload">Upload</a>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <MessageSquare className="h-5 w-5" />
                    {unreadMessages > 0 && (
                      <span className="absolute -right-0 mr-2 mt-2 -top-0 h-2.5 w-2.5 rounded-full bg-blue-500" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Messages</span>
                    {unreadMessages > 0 && (
                      <Badge variant="secondary" className="ml-2">{unreadMessages} new</Badge>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src="https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg" />
                        <AvatarFallback>JD</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">John Doe</p>
                        <p className="text-xs text-muted-foreground">Hey, how's it going?</p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src="https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg" />
                        <AvatarFallback>AS</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">Sarah Smith</p>
                        <p className="text-xs text-muted-foreground">Let's collaborate!</p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="justify-center text-sm text-blue-500">
                    <Link to="/messages">View all messages</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute -right-0 mr-2 mt-2 -top-0 h-2.5 w-2.5 rounded-full bg-red-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <div className="flex items-center gap-2">
                      <div className="bg-green-100 p-1 rounded-full">
                        <User className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">New follower</p>
                        <p className="text-xs text-muted-foreground">Jane Doe followed you</p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-100 p-1 rounded-full">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">New comment</p>
                        <p className="text-xs text-muted-foreground">On your track 'Sunset'</p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="justify-center text-sm text-blue-500">
                    View all notifications
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full" onClick={(e) => e.stopPropagation()}>
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
                  </Button>
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
                      {unreadMessages > 0 && (
                        <Badge variant="secondary" className="ml-auto">{unreadMessages}</Badge>
                      )}
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
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
      
      {/* Profile Picture Upload Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Upload Profile Picture
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Preview Area */}
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
            
            {/* Upload Progress */}
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

function Trash2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  )
}
