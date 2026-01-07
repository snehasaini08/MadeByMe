
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, UserRole, Product, CartItem, Order, AIInsights } from './types';
import { MOCK_PRODUCTS, CATEGORIES } from './constants';
import { getAIProductEnrichment, translateContent, getSalesInsights } from './services/geminiService';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';

// --- Constants & Utilities ---

const REGIONS = [
  { id: 'local', name: 'Local (Within State)', multiplier: 1, base: 40 },
  { id: 'national', name: 'National (Across India)', multiplier: 1.8, base: 70 },
  { id: 'intl', name: 'International', multiplier: 5.5, base: 450 }
];

const Button: React.FC<{ 
  onClick?: () => void; 
  className?: string; 
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  disabled?: boolean;
  type?: 'button' | 'submit';
}> = ({ onClick, className = '', children, variant = 'primary', disabled = false, type = 'button' }) => {
  const base = "px-6 py-2 rounded-full font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-sky-600 text-white hover:bg-sky-700 shadow-md",
    secondary: "bg-sky-100 text-sky-700 hover:bg-sky-200",
    outline: "border-2 border-sky-600 text-sky-600 hover:bg-sky-50",
    danger: "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100"
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

// --- Main App ---

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showSignup, setShowSignup] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'seller_dashboard' | 'cart' | 'checkout' | 'orders' | 'wishlist'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [aiTips, setAiTips] = useState<string[]>([]);
  
  // Checkout Shipping States
  const [deliveryRegion, setDeliveryRegion] = useState('local');
  const [shippingDetails, setShippingDetails] = useState({ name: '', address: '', city: '', pincode: '' });

  // Load AI Tips for Seller
  useEffect(() => {
    if (currentUser?.role === UserRole.SELLER) {
      const fetchTips = async () => {
        const history = "Vase: 5 sales, Kurta: 2 sales, Earrings: 10 sales";
        const result = await getSalesInsights(history);
        setAiTips(result.tips);
      };
      fetchTips();
    }
  }, [currentUser]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    const baseList = activeTab === 'wishlist' ? wishlist : products;
    return baseList.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
                           p.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, wishlist, searchQuery, selectedCategory, activeTab]);

  // Seller's specific products
  const sellerProducts = useMemo(() => {
    return products.filter(p => p.sellerId === currentUser?.id || p.sellerName === 'Amit Artisans'); // Mocking ownership for demo
  }, [products, currentUser]);

  const totalCartPrice = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cart]);

  const totalShippingFee = useMemo(() => {
    if (cart.length === 0) return 0;
    const totalWeight = cart.reduce((acc, item) => acc + ((item.weightInGrams || 500) * item.quantity), 0);
    const region = REGIONS.find(r => r.id === deliveryRegion) || REGIONS[0];
    const weightUnits = Math.ceil(totalWeight / 500);
    const weightFee = weightUnits * 20 * region.multiplier;
    return Math.round(region.base + weightFee);
  }, [cart, deliveryRegion]);

  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      setSearchQuery(event.results[0][0].transcript);
      setActiveTab('home');
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleAddToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleToggleWishlist = (product: Product) => {
    setWishlist(prev => {
      const exists = prev.find(p => p.id === product.id);
      if (exists) return prev.filter(p => p.id !== product.id);
      return [...prev, product];
    });
  };

  const handlePlaceOrder = () => {
    if (!shippingDetails.name || !shippingDetails.address) {
      alert("Please complete shipping details");
      return;
    }
    const newOrder: Order = {
      id: `ORD-${Math.floor(Math.random() * 10000)}`,
      items: [...cart],
      total: totalCartPrice + totalShippingFee,
      shippingFee: totalShippingFee,
      status: 'Packed',
      date: new Date().toLocaleDateString(),
      address: `${shippingDetails.address}, ${shippingDetails.city} - ${shippingDetails.pincode}`
    };
    setUserOrders(prev => [newOrder, ...prev]);
    setCart([]);
    setActiveTab('orders');
    alert("Order placed successfully!");
  };

  const deleteProduct = (id: string) => {
    if (confirm("Are you sure you want to remove this listing?")) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  // --- Views ---

  const AuthView = () => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: UserRole.BUYER });
    const handleSocialLogin = (provider: string) => {
      setCurrentUser({
        id: `s-123`,
        name: `${provider} Artisan`,
        role: UserRole.SELLER, // Default to seller for demo richness
        language: 'English',
        email: 'artisan@madebyme.com',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100'
      });
    };
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setCurrentUser({ id: 'u-1', name: formData.name || 'Artisan', role: formData.role, language: 'English' });
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-600 to-indigo-900 p-4">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-lg border border-white/20">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-sky-600 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-4 shadow-xl"><i className="fa-solid fa-hands-holding-circle text-4xl"></i></div>
            <h1 className="text-3xl font-black text-sky-900 uppercase tracking-tighter">MadeByMe</h1>
            <p className="text-sky-500 font-bold mt-2">Empowering Artisans Worldwide</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input required type="email" placeholder="Email" className="w-full p-4 bg-sky-50 border border-sky-100 rounded-2xl outline-none font-bold text-sky-900" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            <input required type="password" placeholder="Password" className="w-full p-4 bg-sky-50 border border-sky-100 rounded-2xl outline-none font-bold text-sky-900" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            <div className="flex gap-4 p-1.5 bg-sky-50 rounded-2xl border border-sky-100">
              <button type="button" onClick={() => setFormData({...formData, role: UserRole.BUYER})} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${formData.role === UserRole.BUYER ? 'bg-white text-sky-600 shadow-sm' : 'text-sky-300'}`}>Buyer</button>
              <button type="button" onClick={() => setFormData({...formData, role: UserRole.SELLER})} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${formData.role === UserRole.SELLER ? 'bg-white text-sky-600 shadow-sm' : 'text-sky-300'}`}>Artisan</button>
            </div>
            <Button type="submit" className="w-full py-4 text-lg mt-6">Login to Marketplace</Button>
          </form>
          <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col gap-3">
             <button onClick={() => handleSocialLogin('Google')} className="flex items-center justify-center gap-3 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50"><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5" /> Continue with Google</button>
          </div>
        </div>
      </div>
    );
  };

  const SellerDashboard = () => {
    const data = [
      { name: 'Mon', sales: 4000 }, { name: 'Tue', sales: 3000 }, { name: 'Wed', sales: 2000 },
      { name: 'Thu', sales: 2780 }, { name: 'Fri', sales: 1890 }, { name: 'Sat', sales: 2390 }, { name: 'Sun', sales: 3490 },
    ];
    
    return (
      <div className="max-w-7xl mx-auto px-4 py-10 space-y-10">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-black text-sky-900 tracking-tight">Artisan Studio</h2>
            <p className="text-sky-500 font-bold">Monitor your creations and business growth.</p>
          </div>
          <Button onClick={() => setIsAddingProduct(true)} className="py-4 px-8 shadow-xl shadow-sky-200"><i className="fa-solid fa-plus"></i> New Creation</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-sky-50">
            <p className="text-sky-400 font-black uppercase text-[10px] tracking-widest">Weekly Revenue</p>
            <h3 className="text-3xl font-black text-sky-900 mt-1">₹45,200</h3>
            <span className="text-green-500 text-xs font-bold">+12% from last week</span>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-sky-50">
            <p className="text-sky-400 font-black uppercase text-[10px] tracking-widest">Active Orders</p>
            <h3 className="text-3xl font-black text-sky-900 mt-1">08</h3>
            <span className="text-sky-300 text-xs font-bold">2 ready to pack</span>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-sky-50 md:col-span-2 relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-sky-400 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                <i className="fa-solid fa-sparkles text-amber-400"></i> AI Business Coaching
              </p>
              <div className="mt-3 space-y-2">
                {aiTips.length > 0 ? aiTips.map((tip, i) => (
                  <p key={i} className="text-sm font-bold text-sky-800 leading-tight">• {tip}</p>
                )) : <p className="text-sm font-bold text-sky-300 animate-pulse">Analyzing sales data...</p>}
              </div>
            </div>
            <i className="fa-solid fa-wand-magic-sparkles absolute -bottom-4 -right-4 text-8xl text-sky-50 opacity-10 group-hover:rotate-12 transition-transform"></i>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] shadow-sm border border-sky-50">
            <h4 className="font-black text-sky-900 mb-6 uppercase text-xs tracking-widest">Sales Trend</h4>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                  <Area type="monotone" dataKey="sales" stroke="#0284c7" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-sky-50">
            <h4 className="font-black text-sky-900 mb-6 uppercase text-xs tracking-widest">My Active Listings</h4>
            <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
              {sellerProducts.length === 0 ? (
                <div className="text-center py-10 opacity-40"><i className="fa-solid fa-box-open text-4xl mb-2"></i><p className="font-bold">No products listed</p></div>
              ) : sellerProducts.map(p => (
                <div key={p.id} className="flex gap-4 items-center p-3 rounded-2xl hover:bg-sky-50 transition-colors group">
                  <img src={p.images[0]} className="w-16 h-16 rounded-xl object-cover shadow-sm" alt={p.name} />
                  <div className="flex-1">
                    <p className="font-bold text-sky-900 text-sm line-clamp-1">{p.name}</p>
                    <p className="text-xs font-black text-sky-400">₹{p.price.toLocaleString()}</p>
                  </div>
                  <button onClick={() => deleteProduct(p.id)} className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-rose-500 hover:text-white"><i className="fa-solid fa-trash-can text-xs"></i></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const Navbar = () => (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-sky-100 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div onClick={() => setActiveTab('home')} className="flex items-center gap-2 cursor-pointer">
            <i className="fa-solid fa-hands-holding-circle text-2xl text-sky-600"></i>
            <span className="text-xl font-bold bg-gradient-to-r from-sky-700 to-sky-500 bg-clip-text text-transparent">MadeByMe</span>
          </div>
          {currentUser?.role === UserRole.SELLER && (
             <span className="bg-sky-100 text-sky-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Artisan Hub</span>
          )}
          <div className="flex md:hidden gap-5 items-center">
             <div onClick={() => setCurrentUser(null)} className="cursor-pointer text-red-400"><i className="fa-solid fa-right-from-bracket"></i></div>
          </div>
        </div>

        <div className="relative w-full max-w-lg mx-auto flex items-center">
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder={isListening ? "Listening..." : "Search treasures..."} 
              className={`active-focus w-full pl-11 pr-12 py-2 bg-sky-50 border border-sky-100 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-400 text-gray-900 placeholder-sky-300 font-medium transition-all ${isListening ? 'ring-sky-600 bg-sky-100' : ''}`} 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-3 text-sky-300"></i>
            <button onClick={startVoiceSearch} className={`absolute right-3 top-1.5 w-8 h-8 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-sky-100 text-sky-600 hover:bg-sky-200'}`}><i className="fa-solid fa-microphone"></i></button>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <button onClick={() => setActiveTab('home')} className={`text-sm font-bold ${activeTab === 'home' ? 'text-sky-700 underline underline-offset-4 decoration-2' : 'text-gray-400 hover:text-sky-600'}`}>Market</button>
          {currentUser?.role === UserRole.SELLER ? (
            <button onClick={() => setActiveTab('seller_dashboard')} className={`text-sm font-bold flex items-center gap-2 ${activeTab === 'seller_dashboard' ? 'text-sky-700 underline underline-offset-4 decoration-2' : 'text-gray-400 hover:text-sky-600'}`}><i className="fa-solid fa-store"></i> My Shop</button>
          ) : (
            <button onClick={() => setActiveTab('wishlist')} className={`text-sm font-bold flex items-center gap-2 ${activeTab === 'wishlist' ? 'text-red-500 underline underline-offset-4 decoration-2' : 'text-gray-400 hover:text-red-400'}`}><i className="fa-solid fa-heart"></i> Liked</button>
          )}
          <button onClick={() => setActiveTab('orders')} className={`text-sm font-bold flex items-center gap-2 ${activeTab === 'orders' ? 'text-sky-700 underline underline-offset-4 decoration-2' : 'text-gray-400 hover:text-sky-600'}`}><i className="fa-solid fa-receipt"></i> Orders</button>
          <div onClick={() => setActiveTab('cart')} className="relative cursor-pointer group">
            <i className={`fa-solid fa-cart-shopping text-lg transition-colors ${activeTab === 'cart' ? 'text-sky-700' : 'text-sky-300 group-hover:text-sky-600'}`}></i>
            {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-sky-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold border border-white">{cart.length}</span>}
          </div>
          <button onClick={() => setCurrentUser(null)} className="text-red-400 hover:text-red-600 transition-colors flex items-center gap-2 font-bold text-sm">
             <i className="fa-solid fa-right-from-bracket"></i> Logout
          </button>
        </div>
      </div>
    </nav>
  );

  const HomeView = () => (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {activeTab === 'wishlist' && (
        <div className="mb-8">
          <h2 className="text-3xl font-black text-sky-900">Your Liked Items</h2>
          <p className="text-sky-500 font-bold">Quick access to your favorite artisanal works.</p>
        </div>
      )}
      <div className="flex overflow-x-auto gap-4 pb-6 no-scrollbar">
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`flex flex-col items-center justify-center min-w-[100px] h-[100px] rounded-3xl transition-all duration-300 ${selectedCategory === cat.id ? 'bg-sky-600 text-white shadow-lg scale-105' : 'bg-white text-sky-800 border border-sky-100 hover:border-sky-300 hover:bg-sky-50'}`}>
            <i className={`fa-solid ${cat.icon} text-2xl mb-2`}></i>
            <span className="text-xs font-bold uppercase tracking-wider">{cat.name}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mt-12">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full text-center py-20">
            <p className="text-sky-300 text-lg font-bold">No items found matching your selection.</p>
            <Button variant="secondary" className="mt-4" onClick={() => {setSelectedCategory('all'); setActiveTab('home');}}>View All Products</Button>
          </div>
        ) : filteredProducts.map(product => {
          const isLiked = wishlist.some(p => p.id === product.id);
          return (
            <div key={product.id} className="bg-white rounded-[2.5rem] overflow-hidden border border-sky-50 shadow-sm hover:shadow-xl transition-all group">
              <div className="relative aspect-square overflow-hidden">
                <img src={product.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={product.name} />
                <button onClick={() => handleToggleWishlist(product)} className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all ${isLiked ? 'bg-red-500 text-white' : 'bg-white/80 backdrop-blur-md text-gray-400 hover:text-red-400'}`}>
                  <i className={`fa-solid fa-heart ${isLiked ? 'scale-110' : ''}`}></i>
                </button>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-gray-800 text-lg leading-tight line-clamp-1">{product.name}</h3>
                <p className="text-xs text-sky-400 font-bold uppercase tracking-widest mt-1">{product.sellerName}</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-2xl font-black text-sky-700">₹{product.price.toLocaleString()}</span>
                  <span className="text-[10px] font-black text-gray-300 uppercase">~{product.weightInGrams || 500}g</span>
                </div>
                <div className="mt-6">
                  <Button onClick={() => handleAddToCart(product)} className="w-full py-3">Add to Basket</Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const OrdersView = () => (
    <div className="max-w-4xl mx-auto px-4 py-16">
       <div className="mb-12">
        <h2 className="text-3xl font-extrabold text-sky-900 flex items-center gap-3"><i className="fa-solid fa-receipt text-sky-500"></i> Order History</h2>
      </div>
      <div className="space-y-10">
        {userOrders.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[3rem] border border-sky-100"><div className="w-24 h-24 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-6 text-sky-200"><i className="fa-solid fa-box-open text-5xl"></i></div><h3 className="text-2xl font-bold text-gray-800 mb-2">No orders found</h3><Button onClick={() => setActiveTab('home')} className="mt-6">Explore Marketplace</Button></div>
        ) : userOrders.map(order => (
          <div key={order.id} className="bg-white p-8 rounded-[3rem] shadow-sm border border-sky-50 overflow-hidden">
             <div className="flex justify-between items-center mb-6 pb-6 border-b border-sky-50">
                <div><p className="text-xs font-black text-sky-300 tracking-widest">ORDER #{order.id}</p><p className="font-bold text-gray-400">{order.date}</p></div>
                <span className="bg-sky-100 text-sky-600 px-4 py-2 rounded-full font-black text-xs uppercase">{order.status}</span>
             </div>
             <div className="space-y-4 mb-6">{order.items.map(item => (<div key={item.id} className="flex gap-4 items-center"><img src={item.images[0]} className="w-12 h-12 rounded-lg object-cover" /><div className="flex-1"><p className="font-bold text-sm">{item.name}</p><p className="text-xs text-sky-400">Qty: {item.quantity}</p></div><p className="font-black text-sky-900">₹{(item.price * item.quantity).toLocaleString()}</p></div>))}</div>
             <div className="bg-sky-50 p-5 rounded-2xl"><p className="text-[10px] font-black text-sky-800 uppercase mb-1">Delivered to</p><p className="text-sm font-bold text-sky-600 leading-tight">{order.address}</p></div>
          </div>
        ))}
      </div>
    </div>
  );

  const CartView = () => (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="mb-12"><h2 className="text-3xl font-extrabold text-sky-900 flex items-center gap-3"><i className="fa-solid fa-shopping-basket text-sky-500"></i> My Basket</h2></div>
      {cart.length === 0 ? (
        <div className="text-center py-32 bg-white rounded-[3rem] border border-sky-100 shadow-xl shadow-sky-100/20"><div className="w-24 h-24 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-8 text-sky-200"><i className="fa-solid fa-cart-arrow-down text-5xl"></i></div><h3 className="text-2xl font-bold text-gray-800 mb-3">Your basket is empty</h3><Button onClick={() => setActiveTab('home')} className="px-10 py-4 text-lg">Browse Creations</Button></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-6">
            {cart.map(item => (
              <div key={item.id} className="bg-white p-6 rounded-[2.5rem] border border-sky-50 shadow-sm flex items-center gap-6 group">
                 <div className="w-24 h-24 rounded-[2rem] overflow-hidden shadow-md flex-shrink-0"><img src={item.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="cart item" /></div>
                 <div className="flex-1"><h4 className="font-extrabold text-gray-800 text-lg mb-1">{item.name}</h4><div className="flex items-center gap-6 mt-4"><div className="flex items-center bg-sky-50 rounded-2xl p-1"><button onClick={() => setCart(prev => prev.map(i => i.id === item.id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i))} className="w-8 h-8 text-sky-600 font-bold">−</button><span className="w-10 text-center text-gray-800 font-black">{item.quantity}</span><button onClick={() => setCart(prev => prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))} className="w-8 h-8 text-sky-600 font-bold">+</button></div><button onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))} className="text-red-300 hover:text-red-500 font-bold uppercase text-[10px]">Remove</button></div></div>
                 <div className="text-right"><p className="text-xl font-black text-sky-700">₹{(item.price * item.quantity).toLocaleString()}</p></div>
              </div>
            ))}
          </div>
          <div className="bg-white p-8 rounded-[3rem] border border-sky-50 shadow-2xl h-fit sticky top-28">
             <h4 className="font-extrabold text-sky-900 text-xl mb-8 pb-4 border-b border-sky-50">Summary</h4>
             <div className="space-y-4 mb-10">
                <div className="flex justify-between text-gray-500 font-medium"><span>Subtotal</span><span>₹{totalCartPrice.toLocaleString()}</span></div>
                <div className="flex justify-between font-black text-2xl pt-6 border-t-2 border-dashed border-sky-50 mt-6"><span className="text-sky-900">Grand Total</span><span className="text-sky-600">₹{totalCartPrice.toLocaleString()}</span></div>
             </div>
             <Button onClick={() => setActiveTab('checkout')} className="w-full py-5 text-xl">Confirm Delivery</Button>
          </div>
        </div>
      )}
    </div>
  );

  // Added missing CheckoutView component
  const CheckoutView = () => (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-black text-sky-900 uppercase tracking-tight">Delivery Details</h2>
        <p className="text-sky-500 font-bold mt-2">Where should we send your handcrafted treasures?</p>
      </div>
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-sky-50 grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-6">
          <h4 className="text-xs font-black text-sky-400 uppercase tracking-[0.2em] border-b pb-4 mb-8">Shipping Information</h4>
          <input type="text" placeholder="Full Name" className="w-full p-4 bg-sky-50 border border-sky-100 rounded-2xl font-bold text-sky-900 outline-none" value={shippingDetails.name} onChange={e => setShippingDetails({...shippingDetails, name: e.target.value})} />
          <textarea placeholder="Complete Address" className="w-full h-32 p-4 bg-sky-50 border border-sky-100 rounded-2xl font-bold text-sky-900 outline-none resize-none" value={shippingDetails.address} onChange={e => setShippingDetails({...shippingDetails, address: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="City" className="w-full p-4 bg-sky-50 border border-sky-100 rounded-2xl font-bold text-sky-900 outline-none" value={shippingDetails.city} onChange={e => setShippingDetails({...shippingDetails, city: e.target.value})} />
            <input type="text" placeholder="Pincode" className="w-full p-4 bg-sky-50 border border-sky-100 rounded-2xl font-bold text-sky-900 outline-none" value={shippingDetails.pincode} onChange={e => setShippingDetails({...shippingDetails, pincode: e.target.value})} />
          </div>
        </div>
        <div className="space-y-6 bg-sky-50/50 p-8 rounded-[2.5rem] border border-sky-100 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-black text-sky-400 uppercase tracking-[0.2em] border-b border-sky-100 pb-4 mb-6">Select Region</h4>
            <div className="space-y-3">
              {REGIONS.map(region => (
                <div key={region.id} onClick={() => setDeliveryRegion(region.id)} className={`p-4 rounded-2xl cursor-pointer border-2 transition-all flex items-center justify-between ${deliveryRegion === region.id ? 'bg-sky-600 text-white border-sky-600 shadow-lg' : 'bg-white text-sky-900 border-white hover:border-sky-200'}`}>
                  <span className="font-bold">{region.name}</span>
                  <i className={`fa-solid ${deliveryRegion === region.id ? 'fa-circle-check' : 'fa-circle text-sky-50'}`}></i>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-6 border-t border-sky-100 mt-6 space-y-3">
            <div className="flex justify-between text-sm font-bold text-sky-800"><span>Items Total:</span><span>₹{totalCartPrice.toLocaleString()}</span></div>
            <div className="flex justify-between text-sm font-bold text-sky-800"><span>Shipping Fee:</span><span>₹{totalShippingFee.toLocaleString()}</span></div>
            <div className="flex justify-between text-xl font-black text-sky-900 pt-3 border-t-2 border-dashed border-sky-200"><span>Grand Total:</span><span>₹{(totalCartPrice + totalShippingFee).toLocaleString()}</span></div>
            <Button onClick={handlePlaceOrder} className="w-full py-5 text-lg mt-4">Place Secure Order</Button>
          </div>
        </div>
      </div>
    </div>
  );

  const AddProductModal = () => {
    const [roughInput, setRoughInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [enrichedData, setEnrichedData] = useState<any>(null);
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [weight, setWeight] = useState(500); 
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAIEnrich = async () => {
      if (!roughInput) return;
      setLoading(true);
      const data = await getAIProductEnrichment(roughInput);
      setEnrichedData(data);
      setLoading(false);
    };

    const handleFinalize = () => {
      const defaultImage = "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800";
      const newProduct: Product = {
        id: `p-${Date.now()}`,
        name: enrichedData.name,
        description: enrichedData.description,
        price: enrichedData.price,
        category: enrichedData.category.toLowerCase(),
        sellerId: currentUser!.id,
        sellerName: currentUser!.name,
        images: uploadedImages.length > 0 ? uploadedImages : [defaultImage],
        tags: enrichedData.tags,
        rating: 0,
        reviews: 0,
        story: enrichedData.description.substring(0, 100),
        weightInGrams: weight
      };
      setProducts(prev => [newProduct, ...prev]);
      setIsAddingProduct(false);
      alert("Product published!");
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => setUploadedImages(prev => [...prev, reader.result as string]);
        reader.readAsDataURL(file);
      });
    };

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-sky-900/60 backdrop-blur-md">
        <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col border border-white/50 animate-in zoom-in duration-300">
          <div className="p-8 border-b border-sky-100 flex justify-between items-center bg-sky-50/50">
            <h3 className="text-2xl font-bold text-sky-900 flex items-center gap-3"><i className="fa-solid fa-wand-magic-sparkles text-sky-600"></i> Smart Listing</h3>
            <button onClick={() => setIsAddingProduct(false)} className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"><i className="fa-solid fa-xmark text-xl"></i></button>
          </div>
          <div className="p-8 overflow-y-auto flex-1 no-scrollbar">
            {!enrichedData ? (
              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-bold text-sky-800 uppercase tracking-widest mb-3">Describe your product</label>
                  <textarea value={roughInput} onChange={(e) => setRoughInput(e.target.value)} placeholder="E.g., I made a blue cotton dress with flower embroidery..." className="active-focus w-full h-40 p-5 bg-sky-50 border border-sky-100 rounded-[2rem] outline-none text-gray-900 text-lg placeholder-sky-200 font-medium resize-none" />
                  <div className="mt-6 flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-bold text-sky-800 uppercase tracking-widest mb-3">Weight (g)</label>
                      <input type="number" value={weight} onChange={e => setWeight(Number(e.target.value))} className="active-focus w-full p-4 bg-sky-50 border border-sky-100 rounded-2xl outline-none font-bold text-sky-900" placeholder="e.g. 500" />
                    </div>
                  </div>
                  <div className="mt-6">
                    <label className="block text-sm font-bold text-sky-800 uppercase tracking-widest mb-3">Photos</label>
                    <div className="flex flex-wrap gap-4">
                      {uploadedImages.map((img, idx) => (<div key={idx} className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-sm"><img src={img} className="w-full h-full object-cover" alt="prev" /></div>))}
                      <button onClick={() => fileInputRef.current?.click()} className="w-24 h-24 border-2 border-dashed border-sky-200 rounded-2xl flex flex-col items-center justify-center text-sky-400 hover:bg-sky-50"><i className="fa-solid fa-camera text-2xl"></i></button>
                      <input type="file" ref={fileInputRef} onChange={handleImageUpload} multiple accept="image/*" className="hidden" />
                    </div>
                  </div>
                </div>
                <Button onClick={handleAIEnrich} disabled={loading || !roughInput} className="w-full py-5 text-lg"> {loading ? 'Thinking...' : 'Generate Listing Details'} </Button>
              </div>
            ) : (
              <div className="space-y-8">
                <input type="text" value={enrichedData.name} onChange={(e) => setEnrichedData({...enrichedData, name: e.target.value})} className="active-focus w-full p-4 bg-sky-50 border border-sky-100 rounded-2xl outline-none font-bold text-sky-900 text-xl" />
                <textarea value={enrichedData.description} onChange={(e) => setEnrichedData({...enrichedData, description: e.target.value})} className="active-focus w-full h-56 p-5 bg-sky-50 border border-sky-100 rounded-[2rem] outline-none text-gray-900 leading-relaxed font-medium" />
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setEnrichedData(null)} className="flex-1 py-4">Back</Button>
                  <Button onClick={handleFinalize} className="flex-1 py-4">Confirm & Publish</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!currentUser) return <AuthView />;

  return (
    <div className="min-h-screen pb-24 bg-sky-50/30">
      <Navbar />
      <main className="animate-in fade-in duration-700">
        {activeTab === 'home' && <HomeView />}
        {activeTab === 'seller_dashboard' && <SellerDashboard />}
        {activeTab === 'cart' && <CartView />}
        {activeTab === 'checkout' && <CheckoutView />}
        {activeTab === 'orders' && <OrdersView />}
        {activeTab === 'wishlist' && <HomeView />}
      </main>

      {isAddingProduct && <AddProductModal />}

      {/* Mobile Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-2xl border-t border-sky-100 md:hidden flex justify-around py-5 px-4 shadow-2xl rounded-t-[2.5rem] z-[50]">
         <button onClick={() => setActiveTab('home')} className={`text-2xl transition-all ${activeTab === 'home' ? 'text-sky-600 scale-125' : 'text-gray-300'}`}><i className="fa-solid fa-house"></i></button>
         {currentUser.role === UserRole.SELLER ? (
            <button onClick={() => setActiveTab('seller_dashboard')} className={`text-2xl transition-all ${activeTab === 'seller_dashboard' ? 'text-sky-600 scale-125' : 'text-gray-300'}`}><i className="fa-solid fa-store"></i></button>
         ) : (
            <button onClick={() => setActiveTab('wishlist')} className={`text-2xl transition-all ${activeTab === 'wishlist' ? 'text-red-500 scale-125' : 'text-gray-300'}`}><i className="fa-solid fa-heart"></i></button>
         )}
         <button onClick={() => setActiveTab('cart')} className={`text-2xl transition-all relative ${activeTab === 'cart' ? 'text-sky-600 scale-125' : 'text-gray-300'}`}>
            <i className="fa-solid fa-cart-shopping"></i>
            {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-sky-600 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{cart.length}</span>}
         </button>
         <button onClick={() => setActiveTab('orders')} className={`text-2xl transition-all ${activeTab === 'orders' ? 'text-sky-600 scale-125' : 'text-gray-300'}`}><i className="fa-solid fa-receipt"></i></button>
      </div>
    </div>
  );
};

export default App;
