import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/@/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/@/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/@/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/@/ui/tabs";
import { Badge } from "@/components/@/ui/badge";
import { useCart } from '@/contexts/cart-context';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import { 
  CreditCard, 
  Wallet, 
  Bitcoin, 
  ChevronLeft, 
  ShieldCheck, 
  Lock, 
  CreditCardIcon, 
  Loader2,
  CheckCircle2,
  XCircle,
  Info
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/@/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/@/ui/tooltip";
import { supabase } from "@/lib/supabase";

interface OrderFile {
  id: string;
  name: string;
  url: string;
  type: string;
}

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet' | 'crypto'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isNavigatingFromSuccess, setIsNavigatingFromSuccess] = useState(false);
  const [walletBalance, setWalletBalance] = useState(500); // Mock wallet balance
  const [savePaymentInfo, setSavePaymentInfo] = useState(false);
  const [guestCheckout, setGuestCheckout] = useState(!user);
  const [orderId, setOrderId] = useState<string>('');
  const [purchasedItems, setPurchasedItems] = useState<any[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    // Billing info
    firstName: user?.user_metadata?.full_name?.split(' ')[0] || '',
    lastName: user?.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    
    // Card details
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    
    // Crypto details
    cryptoAddress: '',
    
    // Coupon
    couponCode: '',
  });
  
  // Calculate order summary
  const subtotal = cart.reduce((sum, item) => sum + (item.price || 0), 0);
  const processingFee = subtotal * 0.03; // 3% processing fee
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + tax + processingFee;
  
  // Check if cart is empty and redirect if needed
  useEffect(() => {
    if (cart.length === 0 && !showSuccessDialog && !isNavigatingFromSuccess) {
      navigate('/');
    }
  }, [cart, navigate, showSuccessDialog, isNavigatingFromSuccess]);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle payment method change
  const handlePaymentMethodChange = (value: string) => {
    setPaymentMethod(value as 'card' | 'wallet' | 'crypto');
  };
  
  // Apply coupon code
  const handleApplyCoupon = () => {
    if (formData.couponCode.trim()) {
      toast.info("Coupon code applied: 10% discount");
      // In a real app, you would validate the coupon code with the backend
    }
  };
  
  // Process payment
  const handleProcessPayment = async () => {
    setIsProcessing(true);

    try {
      // Validate billing information
      if (!formData.firstName.trim()) {
        throw new Error('Please enter your first name');
      }
      if (!formData.lastName.trim()) {
        throw new Error('Please enter your last name');
      }
      if (!formData.email.trim()) {
        throw new Error('Please enter your email address');
      }
      if (!formData.address.trim()) {
        throw new Error('Please enter your address');
      }
      if (!formData.city.trim()) {
        throw new Error('Please enter your city');
      }
      if (!formData.state.trim()) {
        throw new Error('Please enter your state');
      }
      if (!formData.zipCode.trim()) {
        throw new Error('Please enter your zip code');
      }
      if (!formData.country.trim()) {
        throw new Error('Please select your country');
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check payment method specific validations
      if (paymentMethod === 'card') {
        // Validate card details
        if (!formData.cardNumber || !formData.cardName || !formData.expiryDate || !formData.cvv) {
          throw new Error('Please fill in all card details');
        }
        
        // Basic card number validation
        if (formData.cardNumber.replace(/\s/g, '').length !== 16) {
          throw new Error('Invalid card number');
        }
      } else if (paymentMethod === 'wallet') {
        // Check if wallet has enough balance
        if (walletBalance < total) {
          throw new Error('Insufficient wallet balance');
        }
      } else if (paymentMethod === 'crypto') {
        // Validate crypto address
        if (!formData.cryptoAddress) {
          throw new Error('Please enter a crypto wallet address');
        }
      }
      
      // Create order in database
      const orderData = {
        user_id: user?.id || null,
        title: cart.length === 1 ? cart[0].title : `${cart.length} items`,
        type: 'order',
        customer_name: `${formData.firstName} ${formData.lastName}`,
        customer_email: formData.email,
        customer_phone: formData.phone,
        shipping_address: `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}, ${formData.country}`,
        payment_method: paymentMethod,
        subtotal: subtotal,
        processing_fee: processingFee,
        tax: tax,
        total: total,
        status: 'completed',
        items: await Promise.all(cart.map(async (item) => {
          let files: OrderFile[] = [];

          if (item.type === 'track' && item.selected_file_types && item.selected_file_types.length > 0) {
            // For tracks with selected file types, fetch the actual files
            try {
              // Get track variants for this track
              const { data: variants } = await supabase
                .from('track_variants')
                .select('file_id, variant_type')
                .eq('track_id', item.track_id);

              if (variants && variants.length > 0) {
                const fileIds = variants.map(v => v.file_id);
                const variantMap = new Map(variants.map(v => [v.file_id, v.variant_type]));

                // Get project files for these file_ids
                const { data: projectFiles, error } = await supabase
                  .from('project_files')
                  .select(`
                    file_id,
                    files (
                      id,
                      name,
                      file_url,
                      file_path
                    )
                  `)
                  .in('file_id', fileIds);

                if (!error && projectFiles && projectFiles.length > 0) {
                  // Filter files by selected types
                  files = projectFiles
                    .filter(pf => pf.files && item.selected_file_types!.includes(variantMap.get(pf.file_id) || 'mp3'))
                    .map(pf => ({
                      id: (pf.files as any).id,
                      name: (pf.files as any).name,
                      url: (pf.files as any).file_url,
                      type: variantMap.get(pf.file_id) || 'mp3'
                    }));
                }
              } else {
                // Fallback: try to get files directly from project_files if no variants exist
                const { data: projectFiles, error } = await supabase
                  .from('project_files')
                  .select(`
                    files (
                      id,
                      name,
                      file_url,
                      file_path
                    )
                  `)
                  .eq('project_id', item.project_id);

                if (!error && projectFiles && projectFiles.length > 0) {
                  files = projectFiles
                    .filter(pf => pf.files)
                    .map(pf => ({
                      id: (pf.files as any).id,
                      name: (pf.files as any).name,
                      url: (pf.files as any).file_url,
                      type: 'mp3' // Default type
                    }));
                }
              }
            } catch (error) {
              console.error('Error fetching files for item:', item.id, error);
            }
          }

          return {
            id: item.id, // This is the cart_item_id
            project_id: item.project_id || (item.type === 'track' ? item.project_id : undefined),
            track_id: item.type === 'track' ? item.track_id : undefined,
            title: item.title,
            price: item.price,
            type: item.type,
            selected_file_types: item.selected_file_types,
            files: files
          };
        }))
      };

      // Save order to database
      try {
        const { data: savedOrder, error: orderError } = await supabase
          .from('orders')
          .insert(orderData)
          .select()
          .single();

        if (orderError) throw orderError;

        setOrderId(savedOrder.id);
      } catch (dbError) {
        console.error('Error saving order:', dbError);
        // For guest checkout or if database save fails, generate a random order ID
        const generatedOrderId = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
        setOrderId(generatedOrderId);
      }
      
      // Store purchased items before clearing cart
      setPurchasedItems([...cart]);

      // Simulate successful payment
      clearCart();
      setShowSuccessDialog(true);
    } catch (error) {
      console.error('Payment error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Payment processing failed');
      setShowErrorDialog(true);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };
  
  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-6 animate-fade-in p-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => navigate(-1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">Checkout</h1>
                  <p className="text-muted-foreground">Complete your purchase</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  <span>Secure Checkout</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Checkout Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Account Options */}
                {!user && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Account Options</CardTitle>
                      <CardDescription>Sign in or continue as a guest</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => navigate('/auth/login')}
                        >
                          Sign In
                        </Button>
                        <Button 
                          variant={guestCheckout ? "default" : "outline"} 
                          className="flex-1"
                          onClick={() => setGuestCheckout(true)}
                        >
                          Continue as Guest
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Billing Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Billing Information</CardTitle>
                    <CardDescription>Enter your billing details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input 
                          id="firstName" 
                          name="firstName" 
                          value={formData.firstName}
                          onChange={handleInputChange}
                          placeholder="John"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input 
                          id="lastName" 
                          name="lastName" 
                          value={formData.lastName}
                          onChange={handleInputChange}
                          placeholder="Doe"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          name="email" 
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="john@example.com"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input 
                          id="phone" 
                          name="phone" 
                          type="tel"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="(123) 456-7890"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input 
                        id="address" 
                        name="address" 
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="123 Main St"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="city">City</Label>
                        <Input 
                          id="city" 
                          name="city" 
                          value={formData.city}
                          onChange={handleInputChange}
                          placeholder="New York"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input 
                          id="state" 
                          name="state" 
                          value={formData.state}
                          onChange={handleInputChange}
                          placeholder="NY"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zipCode">Zip Code</Label>
                        <Input 
                          id="zipCode" 
                          name="zipCode" 
                          value={formData.zipCode}
                          onChange={handleInputChange}
                          placeholder="10001"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <select
                        id="country"
                        name="country"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData.country}
                        onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                        required
                      >
                        <option value="United States">United States</option>
                        <option value="Canada">Canada</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Australia">Australia</option>
                        <option value="Germany">Germany</option>
                        <option value="France">France</option>
                        <option value="Japan">Japan</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Payment Method */}
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Method</CardTitle>
                    <CardDescription>Select your preferred payment method</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <RadioGroup 
                      value={paymentMethod} 
                      onValueChange={handlePaymentMethodChange}
                      className="space-y-4"
                    >
                      <div className={`flex items-center justify-between rounded-lg border p-4 ${paymentMethod === 'card' ? 'border-primary bg-primary/5' : ''}`}>
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value="card" id="card" />
                          <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer">
                            <CreditCard className="h-5 w-5" />
                            <span>Credit / Debit Card</span>
                          </Label>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="h-6 w-10 rounded bg-blue-600"></div>
                          <div className="h-6 w-10 rounded bg-red-500"></div>
                          <div className="h-6 w-10 rounded bg-yellow-500"></div>
                        </div>
                      </div>
                      
                      {user && (
                        <div className={`flex items-center justify-between rounded-lg border p-4 ${paymentMethod === 'wallet' ? 'border-primary bg-primary/5' : ''}`}>
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value="wallet" id="wallet" />
                            <Label htmlFor="wallet" className="flex items-center gap-2 cursor-pointer">
                              <Wallet className="h-5 w-5" />
                              <span>Wallet Balance</span>
                            </Label>
                          </div>
                          <div className="text-sm font-medium">
                            ${walletBalance.toFixed(2)} available
                          </div>
                        </div>
                      )}
                      
                      <div className={`flex items-center justify-between rounded-lg border p-4 ${paymentMethod === 'crypto' ? 'border-primary bg-primary/5' : ''}`}>
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value="crypto" id="crypto" />
                          <Label htmlFor="crypto" className="flex items-center gap-2 cursor-pointer">
                            <Bitcoin className="h-5 w-5" />
                            <span>Cryptocurrency</span>
                          </Label>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="h-6 w-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">₿</div>
                          <div className="h-6 w-6 rounded-full bg-blue-400 flex items-center justify-center text-white text-xs font-bold">Ξ</div>
                        </div>
                      </div>
                    </RadioGroup>
                    
                    {/* Payment Method Details */}
                    <div className="mt-4">
                      {paymentMethod === 'card' && (
                        <div className="space-y-4 pt-4 border-t">
                          <div className="space-y-2">
                            <Label htmlFor="cardNumber">Card Number</Label>
                            <div className="relative">
                              <Input 
                                id="cardNumber" 
                                name="cardNumber" 
                                value={formData.cardNumber}
                                onChange={(e) => setFormData(prev => ({ 
                                  ...prev, 
                                  cardNumber: formatCardNumber(e.target.value) 
                                }))}
                                placeholder="1234 5678 9012 3456"
                                maxLength={19}
                                className="pl-10"
                                required={paymentMethod === 'card'}
                              />
                              <CreditCardIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="cardName">Name on Card</Label>
                            <Input 
                              id="cardName" 
                              name="cardName" 
                              value={formData.cardName}
                              onChange={handleInputChange}
                              placeholder="John Doe"
                              required={paymentMethod === 'card'}
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="expiryDate">Expiry Date</Label>
                              <Input 
                                id="expiryDate" 
                                name="expiryDate" 
                                value={formData.expiryDate}
                                onChange={handleInputChange}
                                placeholder="MM/YY"
                                maxLength={5}
                                required={paymentMethod === 'card'}
                              />
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Label htmlFor="cvv">CVV</Label>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>3 or 4 digit security code on the back of your card</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                              <div className="relative">
                                <Input 
                                  id="cvv" 
                                  name="cvv" 
                                  value={formData.cvv}
                                  onChange={handleInputChange}
                                  placeholder="123"
                                  maxLength={4}
                                  className="pl-10"
                                  required={paymentMethod === 'card'}
                                />
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 pt-2">
                            <Checkbox 
                              id="savePaymentInfo" 
                              checked={savePaymentInfo}
                              onCheckedChange={(checked) => setSavePaymentInfo(!!checked)}
                            />
                            <label
                              htmlFor="savePaymentInfo"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Save payment information for future purchases
                            </label>
                          </div>
                        </div>
                      )}
                      
                      {paymentMethod === 'wallet' && (
                        <div className="space-y-4 pt-4 border-t">
                          <div className="rounded-lg border p-4 bg-muted/20">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Wallet className="h-5 w-5 text-primary" />
                                <span className="font-medium">Current Balance</span>
                              </div>
                              <span className="font-bold">${walletBalance.toFixed(2)}</span>
                            </div>
                            
                            {walletBalance < total && (
                              <div className="mt-2 text-sm text-red-500 flex items-center gap-1">
                                <XCircle className="h-4 w-4" />
                                <span>Insufficient balance for this purchase</span>
                              </div>
                            )}
                            
                            {walletBalance >= total && (
                              <div className="mt-2 text-sm text-green-500 flex items-center gap-1">
                                <CheckCircle2 className="h-4 w-4" />
                                <span>Sufficient balance for this purchase</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="text-sm text-muted-foreground">
                            Your wallet balance will be debited immediately upon completing this purchase.
                          </div>
                        </div>
                      )}
                      
                      {paymentMethod === 'crypto' && (
                        <div className="space-y-4 pt-4 border-t">
                          <Tabs defaultValue="bitcoin" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="bitcoin">Bitcoin</TabsTrigger>
                              <TabsTrigger value="ethereum">Ethereum</TabsTrigger>
                            </TabsList>
                            <TabsContent value="bitcoin" className="space-y-4 pt-4">
                              <div className="space-y-2">
                                <Label htmlFor="cryptoAddress">Your Bitcoin Address</Label>
                                <Input 
                                  id="cryptoAddress" 
                                  name="cryptoAddress" 
                                  value={formData.cryptoAddress}
                                  onChange={handleInputChange}
                                  placeholder="Enter your Bitcoin wallet address"
                                  required={paymentMethod === 'crypto'}
                                />
                              </div>
                              <div className="rounded-lg border p-4 bg-muted/20">
                                <p className="text-sm text-muted-foreground mb-2">
                                  Send exactly <span className="font-bold">0.00324 BTC</span> to:
                                </p>
                                <div className="p-2 bg-muted rounded-md text-xs font-mono break-all">
                                  bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                  The exchange rate will be locked for 15 minutes. Your order will be processed once the payment is confirmed on the blockchain.
                                </p>
                              </div>
                            </TabsContent>
                            <TabsContent value="ethereum" className="space-y-4 pt-4">
                              <div className="space-y-2">
                                <Label htmlFor="cryptoAddress">Your Ethereum Address</Label>
                                <Input 
                                  id="cryptoAddress" 
                                  name="cryptoAddress" 
                                  value={formData.cryptoAddress}
                                  onChange={handleInputChange}
                                  placeholder="Enter your Ethereum wallet address"
                                  required={paymentMethod === 'crypto'}
                                />
                              </div>
                              <div className="rounded-lg border p-4 bg-muted/20">
                                <p className="text-sm text-muted-foreground mb-2">
                                  Send exactly <span className="font-bold">0.0182 ETH</span> to:
                                </p>
                                <div className="p-2 bg-muted rounded-md text-xs font-mono break-all">
                                  0x71C7656EC7ab88b098defB751B7401B5f6d8976F
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                  The exchange rate will be locked for 15 minutes. Your order will be processed once the payment is confirmed on the blockchain.
                                </p>
                              </div>
                            </TabsContent>
                          </Tabs>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Right Column - Order Summary */}
              <div className="space-y-6">
                <Card className="sticky top-6">
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                    <CardDescription>Review your order details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Items */}
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <div key={item.id} className="flex gap-4">
                          {/* Removed image display as per user feedback */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{item.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {item.type === 'project' ? 'Project' :
                               item.selected_file_types && item.selected_file_types.length > 0 ?
                               item.selected_file_types.map(type => type.toUpperCase()).join(' + ') :
                               'Track'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${(item.price || 0).toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <Separator />
                    
                    {/* Coupon Code */}
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Coupon code" 
                        name="couponCode"
                        value={formData.couponCode}
                        onChange={handleInputChange}
                      />
                      <Button 
                        variant="outline" 
                        onClick={handleApplyCoupon}
                        disabled={!formData.couponCode.trim()}
                      >
                        Apply
                      </Button>
                    </div>
                    
                    <Separator />
                    
                    {/* Totals */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Processing Fee (3%)</span>
                        <span>${processingFee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax (8%)</span>
                        <span>${tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex-col gap-4">
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={handleProcessPayment}
                      disabled={isProcessing || (paymentMethod === 'wallet' && walletBalance < total)}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Complete Order
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      By completing this order, you agree to our{' '}
                      <a href="#" className="underline">Terms of Service</a> and{' '}
                      <a href="#" className="underline">Privacy Policy</a>.
                    </p>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </div>
        </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={(open) => {
        if (!open) {
          // Prevent closing the dialog by clicking outside or pressing escape
          return;
        }
        setShowSuccessDialog(open);
      }} modal>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-500">
              <CheckCircle2 className="h-5 w-5" />
              Order Successful
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p>Your order has been successfully processed!</p>
            <div className="rounded-lg border p-4 bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Order ID:</span>
                <span className="font-mono text-sm">{orderId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Order Date:</span>
                <span className="text-sm">{new Date().toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Total Amount:</span>
                <span className="font-medium">${total.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Payment Method:</span>
                <span className="text-sm">{
                  paymentMethod === 'card' ? 'Credit/Debit Card' :
                  paymentMethod === 'wallet' ? 'Wallet Balance' :
                  'Cryptocurrency'
                }</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Status:</span>
                <Badge className="bg-green-500/10 text-green-500">Completed</Badge>
              </div>
            </div>

            <div className="rounded-lg border p-4 bg-blue-50 dark:bg-blue-900/10">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Order Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Processing Fee:</span>
                  <span>${processingFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <h4 className="font-medium mb-2">Items Purchased</h4>
              <div className="space-y-2">
                {purchasedItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <div>
                      <span>{item.title}</span>
                      {item.selected_file_types && item.selected_file_types.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {item.selected_file_types.map(type => type.toUpperCase()).join(' + ')}
                        </div>
                      )}
                    </div>
                    <span>${(item.price || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              A confirmation email has been sent to {formData.email}. You can download your purchased items from your order history page.
            </p>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setIsNavigatingFromSuccess(true);
                setShowSuccessDialog(false);
                navigate('/orders/history', { state: { newOrder: savedOrder } });
              }}
              className="w-full"
            >
              Continue to Order History
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <XCircle className="h-5 w-5" />
              Payment Failed
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p>There was an error processing your payment:</p>
            <div className="rounded-lg border border-red-200 p-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400">
              {errorMessage}
            </div>
            <p className="text-sm text-muted-foreground">
              Please check your payment details and try again. If the problem persists, please contact customer support.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowErrorDialog(false)}>
              Try Again
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
