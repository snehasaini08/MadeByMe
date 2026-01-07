
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, UserRole, Product, CartItem, Order } from './types';
import { MOCK_PRODUCTS, CATEGORIES } from './constants';
import { getAIProductEnrichment, translateContent, getSalesInsights } from './services/geminiService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie
} from 'recharts';

// --- Utility Components ---

const Button: React.FC<{ 
  onClick?: () => void; 
  className?: string; 
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
}> = ({ onClick, className = '', children, variant = 'primary', disabled = false }) => {
  const base = "px-6 py-2 rounded-full font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:active:scale-100";
  const variants = {
    primary: "bg-sky-600 text-white hover:bg-sky-700 shadow-md",
    secondary: "bg-sky-100 text-sky-700 hover:bg-sky-200",
    outline: "border-2 border-sky-600 text-sky-600 hover:bg-sky-50"
  };
  return (
    <button disabled={disabled} onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

// --- Main App ---

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'seller_dashboard' | 'cart' | 'checkout' | 'orders' | 'wishlist'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [language, setLanguage] = useState('English');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
                           p.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const totalCartPrice = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleAddToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    alert(`${product.name} added to cart!`);
  };

  const handleToggleWishlist = (product: Product) => {
    setWishlist(prev => {
      const exists = prev.find(p => p.id === product.id);
      if (exists) {
        return prev.filter(p => p.id !== product.id);
      }
      return [...prev, product];
    });
  };

  const handlePlaceOrder = () => {
    const newOrder: Order = {
      id: `ORD-${Math.floor(Math.random() * 10000)}`,
      items: [...cart],
      total: totalCartPrice,
      status: 'Packed',
      date: new Date().toLocaleDateString(),
      address: '123 Artisan Street, Jaipur, India'
    };
    setUserOrders(prev => [newOrder, ...prev]);
    setCart([]);
    setActiveTab('orders');
    alert("Order placed successfully! Sellers are notified.");
  };

  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice Search is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'English' ? 'en-IN' : 'hi-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
    };
    recognition.onerror = () => setIsListening(false);

    recognition.start();
  };

  // --- Views ---

  const LoginView = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-400 to-sky-100 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md text-center border border-sky-100">
        <div className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="fa-solid fa-hands-holding-circle text-3xl text-sky-600"></i>
        </div>
        <h1 className="text-3xl font-bold text-sky-900 mb-2">MadeByMe</h1>
        <p className="text-sky-600 mb-8 font-medium">Empowering Artisans with AI</p>
        <div className="space-y-4">
          <Button onClick={() => setCurrentUser({ id: 'b1', name: 'Buyer User', role: UserRole.BUYER, language: 'English' })} className="w-full">
            Continue as Buyer
          </Button>
          <Button onClick={() => setCurrentUser({ id: 's1', name: 'Artisan Amit', role: UserRole.SELLER, language: 'English' })} variant="outline" className="w-full">
            Continue as Seller
          </Button>
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="text-sm text-gray-500">Preferred Language:</span>
            <select 
              className="text-sm border-none bg-transparent font-bold text-sky-700 focus:ring-0 cursor-pointer"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option>English</option>
              <option>Hindi</option>
              <option>Marathi</option>
              <option>Bengali</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const Navbar = () => (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-sky-100 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div onClick={() => setActiveTab('home')} className="flex items-center gap-2 cursor-pointer">
            <i className="fa-solid fa-hands-holding-circle text-2xl text-sky-600"></i>
            <span className="text-xl font-bold bg-gradient-to-r from-sky-700 to-sky-500 bg-clip-text text-transparent">MadeByMe</span>
          </div>
          <div className="flex md:hidden gap-5 items-center">
             <i className={`fa-solid fa-heart ${activeTab === 'wishlist' ? 'text-red-500' : 'text-sky-400'}`} onClick={() => setActiveTab('wishlist')}></i>
             <i className={`fa-solid fa-cart-shopping ${activeTab === 'cart' ? 'text-sky-600' : 'text-sky-400'}`} onClick={() => setActiveTab('cart')}></i>
             <i className="fa-solid fa-user text-sky-400" onClick={() => setCurrentUser(null)}></i>
          </div>
        </div>

        <div className="relative w-full max-w-2xl mx-auto flex items-center">
          <div className="relative flex-1">
            <input 
              type="text"
              placeholder={isListening ? "Listening..." : "Search unique handmade products..."}
              className={`active-focus w-full pl-11 pr-12 py-2 bg-sky-50 border border-sky-100 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-400 text-gray-900 placeholder-sky-300 font-medium transition-all ${isListening ? 'ring-2 ring-sky-500 bg-white' : ''}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-3 text-sky-300"></i>
            
            <button 
              onClick={startVoiceSearch}
              className={`absolute right-3 top-1.5 w-8 h-8 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-sky-100 text-sky-600 hover:bg-sky-200'}`}
              title="Voice Search"
            >
              <i className={`fa-solid ${isListening ? 'fa-waveform-lines' : 'fa-microphone'}`}></i>
            </button>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <button onClick={() => setActiveTab('home')} className={`text-sm font-bold ${activeTab === 'home' ? 'text-sky-700 underline underline-offset-4 decoration-2' : 'text-gray-400 hover:text-sky-600'}`}>Explore</button>
          {currentUser?.role === UserRole.SELLER && (
            <button onClick={() => setActiveTab('seller_dashboard')} className={`text-sm font-bold ${activeTab === 'seller_dashboard' ? 'text-sky-700 underline underline-offset-4 decoration-2' : 'text-gray-400 hover:text-sky-600'}`}>Dashboard</button>
          )}
          <div onClick={() => setActiveTab('wishlist')} className="relative cursor-pointer group">
            <i className={`fa-solid fa-heart text-lg transition-colors ${activeTab === 'wishlist' ? 'text-red-500' : 'text-sky-300 group-hover:text-red-400'}`}></i>
            {wishlist.length > 0 && <span className="absolute -top-2 -right-2 bg-red-400 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold border border-white">{wishlist.length}</span>}
          </div>
          <div onClick={() => setActiveTab('cart')} className="relative cursor-pointer group">
            <i className={`fa-solid fa-cart-shopping text-lg transition-colors ${activeTab === 'cart' ? 'text-sky-700' : 'text-sky-300 group-hover:text-sky-600'}`}></i>
            {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-sky-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold border border-white">{cart.length}</span>}
          </div>
          <button onClick={() => setCurrentUser(null)} className="text-sm font-bold text-red-400 hover:text-red-600 flex items-center gap-1 transition-colors">
            <i className="fa-solid fa-right-from-bracket"></i>
          </button>
        </div>
      </div>
    </nav>
  );

  const HomeView = () => (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Categories Scroller */}
      <div className="flex overflow-x-auto gap-4 pb-6 no-scrollbar">
        {CATEGORIES.map(cat => (
          <button 
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex flex-col items-center justify-center min-w-[100px] h-[100px] rounded-3xl transition-all duration-300 ${selectedCategory === cat.id ? 'bg-sky-600 text-white shadow-lg scale-105' : 'bg-white text-sky-800 border border-sky-100 hover:border-sky-300 hover:bg-sky-50'}`}
          >
            <i className={`fa-solid ${cat.icon} text-2xl mb-2`}></i>
            <span className="text-xs font-bold uppercase tracking-wider">{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-br from-sky-600 via-sky-500 to-sky-400 rounded-[3rem] p-10 mb-12 text-white flex flex-col lg:flex-row items-center justify-between shadow-2xl shadow-sky-200/50">
        <div className="mb-8 lg:mb-0 lg:max-w-xl">
          <span className="bg-white/20 backdrop-blur-md px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-6 inline-block">Direct from Artisans</span>
          <h2 className="text-5xl font-extrabold mb-6 leading-tight">Authentic Handmade Treasures</h2>
          <p className="text-sky-50 text-xl font-light mb-8 opacity-90">Every piece tells a story. Support small creators and bring home unique craftsmanship from across the country.</p>
          <div className="flex flex-wrap gap-4">
             <Button variant="secondary" className="px-8 py-3 text-lg" onClick={() => setSelectedCategory('crafts')}>Browse Collection</Button>
             <button className="flex items-center gap-3 text-lg font-medium group"><i className="fa-solid fa-circle-play text-3xl group-hover:scale-110 transition-transform"></i> Meet our Artisans</button>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-4 bg-white/10 rounded-[3rem] blur-2xl"></div>
          <img src="https://images.unsplash.com/photo-1513519245088-0e12902e35ca?auto=format&fit=crop&q=80&w=800" className="rounded-[2.5rem] shadow-2xl w-full max-w-lg relative object-cover" alt="Artisan workshop" />
        </div>
      </div>

      <div className="flex justify-between items-end mb-8">
        <h3 className="text-2xl font-bold text-sky-900">Featured Creations</h3>
        <p className="text-sky-400 font-medium">{filteredProducts.length} items found</p>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredProducts.map(product => {
          const isLiked = wishlist.some(p => p.id === product.id);
          return (
            <div key={product.id} className="bg-white rounded-[2rem] overflow-hidden border border-sky-50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="relative aspect-square overflow-hidden">
                <img src={product.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={product.name} />
                <button 
                  onClick={() => handleToggleWishlist(product)}
                  className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all ${isLiked ? 'bg-red-500 text-white' : 'bg-white/80 backdrop-blur-md text-gray-400 hover:text-red-400'}`}
                >
                  <i className={`fa-solid fa-heart ${isLiked ? 'scale-110' : ''}`}></i>
                </button>
                <div className="absolute bottom-4 left-4 bg-sky-900/40 backdrop-blur-md px-3 py-1 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest">
                  {product.category}
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-800 text-lg leading-tight line-clamp-1 group-hover:text-sky-600 transition-colors">{product.name}</h3>
                </div>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2 h-10">{product.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-extrabold text-sky-700">₹{product.price.toLocaleString()}</span>
                  <div className="flex items-center gap-1 text-xs text-amber-500 font-bold bg-amber-50 px-2 py-1 rounded-lg">
                    <i className="fa-solid fa-star"></i>
                    <span>{product.rating}</span>
                  </div>
                </div>
                <div className="mt-6">
                  <Button onClick={() => handleAddToCart(product)} className="w-full py-3">Add to Cart</Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {filteredProducts.length === 0 && (
        <div className="text-center py-24 bg-white rounded-[3rem] border border-sky-100 mt-10">
          <div className="w-24 h-24 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fa-solid fa-magnifying-glass text-4xl text-sky-200"></i>
          </div>
          <h3 className="text-2xl font-bold text-sky-900 mb-2">No masterpieces found</h3>
          <p className="text-gray-400 max-w-xs mx-auto">We couldn't find items matching "{searchQuery}". Try different keywords or browse categories.</p>
          <Button onClick={() => {setSearchQuery(''); setSelectedCategory('all')}} variant="outline" className="mt-8">Reset Search</Button>
        </div>
      )}
    </div>
  );

  const WishlistView = () => (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-sky-900 flex items-center gap-3">
             <i className="fa-solid fa-heart text-red-500"></i> Saved Items
          </h2>
          <p className="text-sky-500 mt-1">Products you loved and might want to buy later.</p>
        </div>
        <Button onClick={() => setActiveTab('home')} variant="secondary">Keep Shopping</Button>
      </div>

      {wishlist.length === 0 ? (
        <div className="text-center py-32 bg-white rounded-[3rem] border border-sky-100 shadow-sm">
          <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fa-solid fa-heart text-5xl text-red-200"></i>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">No saved items yet</h3>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto">Add items to your wishlist while you browse and keep track of your favorite artisanal creations.</p>
          <Button onClick={() => setActiveTab('home')}>Explore Marketplace</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {wishlist.map(product => (
            <div key={product.id} className="bg-white rounded-[2rem] overflow-hidden border border-sky-50 shadow-sm hover:shadow-lg transition-all group">
               <div className="relative aspect-square overflow-hidden">
                <img src={product.images[0]} className="w-full h-full object-cover" alt={product.name} />
                <button 
                  onClick={() => handleToggleWishlist(product)}
                  className="absolute top-4 right-4 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"
                >
                  <i className="fa-solid fa-heart"></i>
                </button>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-gray-800 text-lg leading-tight line-clamp-1 mb-2">{product.name}</h3>
                <span className="text-xl font-extrabold text-sky-700 block mb-6">₹{product.price.toLocaleString()}</span>
                <div className="flex gap-2">
                  <Button onClick={() => handleAddToCart(product)} className="flex-1 text-sm py-2">Add to Cart</Button>
                  <button 
                    onClick={() => handleToggleWishlist(product)}
                    className="p-2 border border-red-100 text-red-400 rounded-xl hover:bg-red-50"
                    title="Remove from saved"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const AddProductModal = () => {
    const [roughInput, setRoughInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [enrichedData, setEnrichedData] = useState<any>(null);
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
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
        story: enrichedData.description.substring(0, 100)
      };
      setProducts(prev => [newProduct, ...prev]);
      setIsAddingProduct(false);
      alert("Product published to marketplace!");
    };

    const handleVoiceInput = () => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Voice input is not supported in this browser.");
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'English' ? 'en-IN' : 'hi-IN';
      recognition.onresult = (event: any) => {
        setRoughInput(event.results[0][0].transcript);
      };
      recognition.start();
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;
      
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setUploadedImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    };

    const removeUploadedImage = (index: number) => {
      setUploadedImages(prev => prev.filter((_, i) => i !== index));
    };

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-sky-900/60 backdrop-blur-md">
        <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col border border-white/50 animate-in zoom-in duration-300">
          <div className="p-8 border-b border-sky-100 flex justify-between items-center bg-sky-50/50">
            <h3 className="text-2xl font-bold text-sky-900 flex items-center gap-3">
              <i className="fa-solid fa-wand-magic-sparkles text-sky-600"></i>
              Smart Listing Assistant
            </h3>
            <button onClick={() => setIsAddingProduct(false)} className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
          </div>
          
          <div className="p-8 overflow-y-auto flex-1 no-scrollbar">
            {!enrichedData ? (
              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-bold text-sky-800 uppercase tracking-widest mb-3">Describe your product</label>
                  <textarea 
                    value={roughInput}
                    onChange={(e) => setRoughInput(e.target.value)}
                    placeholder="E.g., I made a blue cotton dress with flower embroidery for summer. It took 3 days to weave..."
                    className="active-focus w-full h-40 p-5 bg-sky-50 border border-sky-100 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-sky-400/20 text-gray-900 text-lg placeholder-sky-200 font-medium resize-none"
                  />
                  
                  <div className="mt-6">
                    <label className="block text-sm font-bold text-sky-800 uppercase tracking-widest mb-3">Show off your work</label>
                    <div className="flex flex-wrap gap-4">
                      {uploadedImages.map((img, idx) => (
                        <div key={idx} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-sky-100 group">
                          <img src={img} className="w-full h-full object-cover" alt="Preview" />
                          <button 
                            onClick={() => removeUploadedImage(idx)}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <i className="fa-solid fa-xmark text-[10px]"></i>
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-24 h-24 border-2 border-dashed border-sky-200 rounded-2xl flex flex-col items-center justify-center text-sky-400 hover:bg-sky-50 hover:border-sky-400 transition-all"
                      >
                        <i className="fa-solid fa-camera-retro text-2xl mb-1"></i>
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Add Photo</span>
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageUpload} 
                        multiple 
                        accept="image/*" 
                        className="hidden" 
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-8">
                     <button onClick={handleVoiceInput} className="flex items-center gap-2 px-6 py-3 bg-white border border-sky-100 text-sky-700 rounded-full text-sm font-bold shadow-sm hover:bg-sky-50 transition-colors">
                        <i className="fa-solid fa-microphone text-sky-400"></i> Voice Input
                     </button>
                  </div>
                </div>
                <div className="bg-amber-50/80 p-5 rounded-3xl border border-amber-100">
                   <p className="text-sm text-amber-800 flex items-start gap-3 leading-relaxed">
                      <i className="fa-solid fa-robot text-lg mt-1"></i>
                      <span>AI will automatically generate a professional marketing description, suggest a competitive price, and add SEO tags based on your notes.</span>
                   </p>
                </div>
                <Button onClick={handleAIEnrich} disabled={loading || !roughInput} className="w-full py-5 text-lg shadow-sky-200 shadow-xl">
                  {loading ? (
                    <span className="flex items-center justify-center gap-3">
                      <i className="fa-solid fa-sparkles animate-pulse"></i> AI is thinking...
                    </span>
                  ) : 'Enrich Listing with AI'}
                </Button>
              </div>
            ) : (
              <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
                <div className="bg-green-50/80 p-5 rounded-3xl border border-green-100">
                  <p className="text-sm text-green-800 font-bold flex items-center gap-2">
                    <i className="fa-solid fa-check-circle"></i> AI Proposal Ready! Review and publish below.
                  </p>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                   {uploadedImages.length > 0 ? uploadedImages.map((img, idx) => (
                      <img key={idx} src={img} className="w-32 h-32 rounded-3xl object-cover border-2 border-sky-100 shadow-sm" alt="Final preview" />
                   )) : (
                      <div className="w-32 h-32 rounded-3xl bg-sky-50 flex items-center justify-center text-sky-200 border-2 border-sky-100">
                         <i className="fa-solid fa-image text-3xl"></i>
                      </div>
                   )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Product Title</label>
                    <input 
                      type="text" 
                      value={enrichedData.name} 
                      onChange={(e) => setEnrichedData({...enrichedData, name: e.target.value})}
                      className="active-focus w-full p-4 bg-sky-50 border border-sky-100 rounded-2xl focus:ring-4 focus:ring-sky-400/10 outline-none text-gray-900 font-bold" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Artisanal Price (₹)</label>
                    <input 
                      type="number" 
                      value={enrichedData.price} 
                      onChange={(e) => setEnrichedData({...enrichedData, price: Number(e.target.value)})}
                      className="active-focus w-full p-4 bg-sky-50 border border-sky-100 rounded-2xl focus:ring-4 focus:ring-sky-400/10 outline-none text-gray-900 font-bold" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Market Category</label>
                    <input 
                      type="text" 
                      value={enrichedData.category} 
                      onChange={(e) => setEnrichedData({...enrichedData, category: e.target.value})}
                      className="active-focus w-full p-4 bg-sky-50 border border-sky-100 rounded-2xl focus:ring-4 focus:ring-sky-400/10 outline-none text-gray-900 font-bold" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Story-led Description</label>
                  <textarea 
                    value={enrichedData.description} 
                    onChange={(e) => setEnrichedData({...enrichedData, description: e.target.value})}
                    className="active-focus w-full h-56 p-5 bg-sky-50 border border-sky-100 rounded-[2rem] focus:ring-4 focus:ring-sky-400/10 outline-none resize-none text-gray-900 leading-relaxed font-medium" 
                  />
                </div>
                <div className="bg-sky-50 p-6 rounded-[2rem] border border-sky-100">
                   <h4 className="text-sm font-bold text-sky-800 mb-2 flex items-center gap-2">
                     <i className="fa-solid fa-lightbulb text-amber-400"></i> AI Photography Tip:
                   </h4>
                   <p className="text-sm text-sky-700 italic leading-relaxed">"{enrichedData.imageTips}"</p>
                </div>
                <div className="flex gap-4 pt-4">
                  <Button variant="outline" onClick={() => setEnrichedData(null)} className="flex-1 py-4">Back to Edit</Button>
                  <Button onClick={handleFinalize} className="flex-1 py-4 shadow-sky-200 shadow-xl">Publish to Marketplace</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const SellerDashboard = () => {
    const revenueData = [
      { name: 'Mon', rev: 4000 },
      { name: 'Tue', rev: 3000 },
      { name: 'Wed', rev: 6000 },
      { name: 'Thu', rev: 5000 },
      { name: 'Fri', rev: 8000 },
      { name: 'Sat', rev: 12000 },
      { name: 'Sun', rev: 15000 },
    ];

    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
           <div>
             <h2 className="text-3xl font-bold text-sky-900">Artisan Hub</h2>
             <p className="text-sky-500 font-medium">Hello {currentUser?.name}, your creations are reaching many hearts!</p>
           </div>
           <Button onClick={() => setIsAddingProduct(true)} className="flex items-center gap-3 py-3 px-8 text-lg shadow-xl shadow-sky-200">
             <i className="fa-solid fa-plus-circle text-xl"></i> Add New Creation
           </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-sky-50 group hover:shadow-xl transition-all">
             <div className="flex items-center gap-5 mb-6">
                <div className="w-14 h-14 bg-green-50 text-green-600 rounded-[1.25rem] flex items-center justify-center group-hover:scale-110 transition-transform">
                   <i className="fa-solid fa-indian-rupee-sign text-2xl"></i>
                </div>
                <div>
                   <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Store Revenue</p>
                   <h3 className="text-3xl font-extrabold text-gray-800">₹53,000</h3>
                </div>
             </div>
             <p className="text-sm text-green-600 font-bold flex items-center gap-2"><i className="fa-solid fa-arrow-trend-up"></i> +12.5% vs last week</p>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-sky-50 group hover:shadow-xl transition-all">
             <div className="flex items-center gap-5 mb-6">
                <div className="w-14 h-14 bg-sky-50 text-sky-600 rounded-[1.25rem] flex items-center justify-center group-hover:scale-110 transition-transform">
                   <i className="fa-solid fa-truck-fast text-2xl"></i>
                </div>
                <div>
                   <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Active Orders</p>
                   <h3 className="text-3xl font-extrabold text-gray-800">04</h3>
                </div>
             </div>
             <p className="text-sm text-sky-500 font-bold">Pack them with care!</p>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-sky-50 group hover:shadow-xl transition-all">
             <div className="flex items-center gap-5 mb-6">
                <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-[1.25rem] flex items-center justify-center group-hover:scale-110 transition-transform">
                   <i className="fa-solid fa-medal text-2xl"></i>
                </div>
                <div>
                   <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Artist Level</p>
                   <h3 className="text-3xl font-extrabold text-gray-800">Silver</h3>
                </div>
             </div>
             <p className="text-sm text-amber-600 font-bold">150 points to Gold</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-sky-50">
             <h4 className="text-xl font-bold text-sky-900 mb-8 flex items-center gap-3">
                <i className="fa-solid fa-chart-line text-sky-500"></i> Sales Insights
             </h4>
             <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}} 
                      contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} 
                    />
                    <Bar dataKey="rev" fill="#0ea5e9" radius={[12, 12, 0, 0]} barSize={35} />
                  </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
          
          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-sky-50 flex flex-col">
             <h4 className="text-xl font-bold text-sky-900 mb-8 flex items-center gap-3">
                <i className="fa-solid fa-sparkles text-sky-500"></i> AI Success Guidance
             </h4>
             <div className="flex-1 space-y-5">
                <div className="p-5 bg-sky-50/50 rounded-[2rem] border border-sky-100/50 hover:bg-sky-50 transition-colors">
                   <h5 className="font-bold text-sky-800 mb-2 flex items-center gap-2">
                     <i className="fa-solid fa-bullseye text-sky-400"></i> Demand Alert
                   </h5>
                   <p className="text-sm text-sky-600 leading-relaxed">Cotton embroidery is trending in North India. Consider adding 2-3 ethnic designs to your store.</p>
                </div>
                <div className="p-5 bg-amber-50/50 rounded-[2rem] border border-amber-100/50 hover:bg-amber-50 transition-colors">
                   <h5 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                     <i className="fa-solid fa-tags text-amber-400"></i> Pricing Tip
                   </h5>
                   <p className="text-sm text-amber-700 leading-relaxed">Your "Pottery" items are highly rated. You could test a 5% price increase for premium variants.</p>
                </div>
                <div className="p-5 bg-purple-50/50 rounded-[2rem] border border-purple-100/50 hover:bg-purple-50 transition-colors">
                   <h5 className="font-bold text-purple-800 mb-2 flex items-center gap-2">
                     <i className="fa-solid fa-camera-retro text-purple-400"></i> Photo Hack
                   </h5>
                   <p className="text-sm text-purple-700 leading-relaxed">Artistic shadows in your photos can boost engagement. Try shooting during 'Golden Hour'.</p>
                </div>
             </div>
             <Button className="w-full mt-8 py-4" variant="outline">Analyze Store Deeper</Button>
          </div>
        </div>

        <div className="bg-white rounded-[3rem] shadow-sm border border-sky-50 overflow-hidden">
           <div className="p-8 border-b border-sky-50 flex justify-between items-center bg-sky-50/20">
              <h4 className="text-xl font-bold text-sky-900">Live Inventory</h4>
              <button className="text-sm font-bold text-sky-600 hover:text-sky-800 transition-colors">Manage Stock</button>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead className="bg-sky-50/50 text-sky-400 uppercase text-[10px] font-extrabold tracking-[0.2em]">
                    <tr>
                       <th className="px-8 py-5">Masterpiece</th>
                       <th className="px-8 py-5">Category</th>
                       <th className="px-8 py-5 text-right">Price</th>
                       <th className="px-8 py-5">Availability</th>
                       <th className="px-8 py-5">Market Status</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-sky-50 text-sm">
                    {products.filter(p => p.sellerId === currentUser?.id).map(p => (
                       <tr key={p.id} className="hover:bg-sky-50/30 transition-colors group">
                          <td className="px-8 py-5 flex items-center gap-4">
                             <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-sm border border-sky-50">
                                <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                             </div>
                             <span className="font-bold text-gray-800">{p.name}</span>
                          </td>
                          <td className="px-8 py-5 text-gray-500 font-medium capitalize">{p.category}</td>
                          <td className="px-8 py-5 font-bold text-sky-700 text-right text-lg">₹{p.price}</td>
                          <td className="px-8 py-5 text-gray-400 font-medium">12 in stock</td>
                          <td className="px-8 py-5">
                             <span className="px-3 py-1 bg-sky-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-sky-200">Active</span>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    );
  };

  const CartView = () => (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="mb-12">
        <h2 className="text-3xl font-extrabold text-sky-900 flex items-center gap-3">
           <i className="fa-solid fa-shopping-basket text-sky-500"></i> Your Basket
        </h2>
        <p className="text-sky-500 font-medium mt-1">Found {cart.length} artisanal treasures.</p>
      </div>

      {cart.length === 0 ? (
        <div className="text-center py-32 bg-white rounded-[3rem] border border-sky-100 shadow-xl shadow-sky-100/20">
          <div className="w-24 h-24 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-8">
            <i className="fa-solid fa-cart-arrow-down text-5xl text-sky-200"></i>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">Your basket is empty</h3>
          <p className="text-gray-400 mb-10 max-w-sm mx-auto">Explore unique handmade products and fill your home with soulful creations.</p>
          <Button onClick={() => setActiveTab('home')} className="px-10 py-4 text-lg">Start Exploring</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-6">
            {cart.map(item => (
              <div key={item.id} className="bg-white p-6 rounded-[2.5rem] border border-sky-50 shadow-sm flex flex-col sm:flex-row gap-6 items-center group">
                 <div className="w-32 h-32 rounded-[2rem] overflow-hidden shadow-md flex-shrink-0">
                    <img src={item.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                 </div>
                 <div className="flex-1 text-center sm:text-left">
                    <h4 className="font-extrabold text-gray-800 text-xl mb-1">{item.name}</h4>
                    <p className="text-sm text-sky-400 font-bold mb-4 flex items-center justify-center sm:justify-start gap-2">
                      <i className="fa-solid fa-store"></i> {item.sellerName}
                    </p>
                    <div className="flex items-center justify-center sm:justify-start gap-6">
                       <div className="flex items-center bg-sky-50 rounded-2xl overflow-hidden border border-sky-100 p-1">
                          <button 
                            onClick={() => setCart(prev => prev.map(i => i.id === item.id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i))}
                            className="w-10 h-10 flex items-center justify-center text-sky-600 hover:bg-sky-100 transition-colors font-bold text-xl"
                          >−</button>
                          <span className="w-12 text-center text-gray-800 font-black">{item.quantity}</span>
                          <button 
                            onClick={() => setCart(prev => prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))}
                            className="w-10 h-10 flex items-center justify-center text-sky-600 hover:bg-sky-100 transition-colors font-bold text-xl"
                          >+</button>
                       </div>
                       <button 
                        onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))}
                        className="text-red-300 hover:text-red-500 text-sm font-bold uppercase tracking-widest flex items-center gap-1 transition-colors"
                       >
                         <i className="fa-solid fa-trash-can"></i>
                         <span>Drop</span>
                       </button>
                    </div>
                 </div>
                 <div className="sm:text-right flex flex-col justify-center h-full">
                    <p className="text-2xl font-black text-sky-700">₹{(item.price * item.quantity).toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mt-1">VAT Included</p>
                 </div>
              </div>
            ))}
          </div>
          <div className="bg-white p-8 rounded-[3rem] border border-sky-50 shadow-2xl shadow-sky-100 h-fit sticky top-28">
             <h4 className="font-extrabold text-sky-900 text-xl mb-8 pb-4 border-b border-sky-50">Grand Total</h4>
             <div className="space-y-4 mb-10">
                <div className="flex justify-between text-gray-500 font-medium">
                   <span>Items ({cart.length})</span>
                   <span className="text-gray-800">₹{totalCartPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-500 font-medium">
                   <span>Artisan Delivery</span>
                   <span className="text-green-500 font-bold uppercase tracking-widest text-xs mt-1">Complimentary</span>
                </div>
                <div className="flex justify-between font-black text-2xl pt-6 border-t-2 border-dashed border-sky-50 mt-6">
                   <span className="text-sky-900">Total</span>
                   <span className="text-sky-600">₹{totalCartPrice.toLocaleString()}</span>
                </div>
             </div>
             <Button onClick={() => setActiveTab('checkout')} className="w-full py-5 text-xl shadow-sky-200 shadow-2xl">Pay Secured ₹{totalCartPrice.toLocaleString()}</Button>
             <div className="mt-6 flex items-center justify-center gap-2 text-sky-300 text-[10px] font-bold uppercase tracking-widest">
               <i className="fa-solid fa-shield-halved"></i> 100% Artisan Guarantee
             </div>
          </div>
        </div>
      )}
    </div>
  );

  const CheckoutView = () => (
    <div className="max-w-3xl mx-auto px-4 py-16">
       <div className="mb-12">
        <h2 className="text-3xl font-extrabold text-sky-900 flex items-center gap-3">
           <i className="fa-solid fa-user-shield text-sky-500"></i> Checkout Details
        </h2>
        <p className="text-sky-500 font-medium mt-1">Enter your delivery and payment preferences.</p>
      </div>
      
      <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-sky-50 space-y-12">
         <section>
            <h4 className="font-black text-sky-800 mb-6 flex items-center gap-4 text-lg">
               <span className="w-8 h-8 bg-sky-600 text-white rounded-full flex items-center justify-center text-sm shadow-lg shadow-sky-200">1</span>
               Shipping Destination
            </h4>
            <div className="grid grid-cols-1 gap-5">
               <input type="text" placeholder="Recipient Full Name" className="active-focus p-4 bg-sky-50 border border-sky-100 rounded-2xl outline-none focus:ring-4 focus:ring-sky-400/10 text-gray-900 font-bold" />
               <input type="text" placeholder="Shipping Address Details" className="active-focus p-4 bg-sky-50 border border-sky-100 rounded-2xl outline-none focus:ring-4 focus:ring-sky-400/10 text-gray-900 font-bold" />
               <div className="grid grid-cols-2 gap-5">
                  <input type="text" placeholder="City" className="active-focus p-4 bg-sky-50 border border-sky-100 rounded-2xl outline-none focus:ring-4 focus:ring-sky-400/10 text-gray-900 font-bold" />
                  <input type="text" placeholder="Pincode" className="active-focus p-4 bg-sky-50 border border-sky-100 rounded-2xl outline-none focus:ring-4 focus:ring-sky-400/10 text-gray-900 font-bold" />
               </div>
            </div>
         </section>

         <section>
            <h4 className="font-black text-sky-800 mb-6 flex items-center gap-4 text-lg">
               <span className="w-8 h-8 bg-sky-600 text-white rounded-full flex items-center justify-center text-sm shadow-lg shadow-sky-200">2</span>
               Select Payment Mode
            </h4>
            <div className="space-y-4">
               <label className="flex items-center gap-5 p-6 border-2 border-sky-50 rounded-[2rem] cursor-pointer hover:bg-sky-50 hover:border-sky-200 transition-all group">
                  <input type="radio" name="payment" defaultChecked className="accent-sky-600 w-5 h-5" />
                  <div className="flex-1">
                     <p className="font-black text-gray-800 text-base">UPI Quick Pay</p>
                     <p className="text-[10px] text-sky-400 uppercase font-black tracking-[0.1em] mt-1">Google Pay, PhonePe, Paytm</p>
                  </div>
                  <i className="fa-solid fa-qrcode text-3xl text-sky-200 group-hover:text-sky-400 transition-colors"></i>
               </label>
               <label className="flex items-center gap-5 p-6 border-2 border-sky-50 rounded-[2rem] cursor-pointer hover:bg-sky-50 hover:border-sky-200 transition-all group">
                  <input type="radio" name="payment" className="accent-sky-600 w-5 h-5" />
                  <div className="flex-1">
                     <p className="font-black text-gray-800 text-base">Card (Debit/Credit)</p>
                     <p className="text-[10px] text-sky-400 uppercase font-black tracking-[0.1em] mt-1">Visa, Mastercard, RuPay</p>
                  </div>
                  <i className="fa-solid fa-credit-card text-3xl text-sky-200 group-hover:text-sky-400 transition-colors"></i>
               </label>
               <label className="flex items-center gap-5 p-6 border-2 border-sky-50 rounded-[2rem] cursor-pointer hover:bg-sky-50 hover:border-sky-200 transition-all group">
                  <input type="radio" name="payment" className="accent-sky-600 w-5 h-5" />
                  <div className="flex-1">
                     <p className="font-black text-gray-800 text-base">Cash on Hand</p>
                     <p className="text-[10px] text-sky-400 uppercase font-black tracking-[0.1em] mt-1">Pay when you receive the soul</p>
                  </div>
                  <i className="fa-solid fa-hand-holding-dollar text-3xl text-sky-200 group-hover:text-sky-400 transition-colors"></i>
               </label>
            </div>
         </section>

         <div className="pt-6">
            <Button onClick={handlePlaceOrder} className="w-full py-6 text-xl shadow-sky-200 shadow-2xl uppercase tracking-widest font-black">Finalize Purchase</Button>
            <div className="flex items-center justify-center gap-4 mt-8">
               <div className="flex items-center gap-2 opacity-30 font-bold text-[10px] uppercase tracking-tighter">
                  <i className="fa-solid fa-lock"></i> SSL Secured
               </div>
               <div className="w-px h-3 bg-gray-200"></div>
               <div className="flex items-center gap-2 opacity-30 font-bold text-[10px] uppercase tracking-tighter">
                  <i className="fa-solid fa-award"></i> Quality Checked
               </div>
            </div>
         </div>
      </div>
    </div>
  );

  const OrdersView = () => (
    <div className="max-w-4xl mx-auto px-4 py-16">
       <div className="mb-12">
        <h2 className="text-3xl font-extrabold text-sky-900 flex items-center gap-3">
           <i className="fa-solid fa-receipt text-sky-500"></i> My Orders
        </h2>
        <p className="text-sky-500 font-medium mt-1">Track your handmade treasures from artisan to doorstep.</p>
      </div>

      <div className="space-y-10">
        {userOrders.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[3rem] border border-sky-100">
             <div className="w-24 h-24 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fa-solid fa-box-open text-5xl text-sky-200"></i>
             </div>
             <h3 className="text-2xl font-bold text-gray-800 mb-2">No orders placed yet</h3>
             <Button onClick={() => setActiveTab('home')} className="mt-6">Shop Creations</Button>
          </div>
        ) : userOrders.map(order => (
          <div key={order.id} className="bg-white p-8 rounded-[3rem] shadow-sm border border-sky-50 overflow-hidden">
             <div className="flex flex-col sm:flex-row justify-between mb-8 pb-8 border-b border-sky-50 gap-4">
                <div>
                   <p className="text-xs font-black text-sky-300 uppercase tracking-[0.2em] mb-2">Order ID #{order.id}</p>
                   <p className="text-sm font-bold text-gray-500">Captured on {order.date}</p>
                </div>
                <div className="text-right">
                   <span className="px-6 py-2 bg-sky-100 text-sky-700 rounded-full text-xs font-black uppercase tracking-[0.1em] border border-sky-200">
                     {order.status}
                   </span>
                </div>
             </div>
             <div className="space-y-6 mb-10">
                {order.items.map(item => (
                   <div key={item.id} className="flex gap-6 items-center">
                      <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden shadow-sm border border-sky-50">
                        <img src={item.images[0]} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                         <p className="font-extrabold text-gray-800 text-lg">{item.name}</p>
                         <p className="text-xs text-sky-400 font-bold uppercase tracking-widest mt-1">Unit Qty: {item.quantity}</p>
                      </div>
                      <p className="font-black text-sky-700 text-xl">₹{(item.price * item.quantity).toLocaleString()}</p>
                   </div>
                ))}
             </div>
             <div className="bg-sky-50/50 p-8 rounded-[2rem] border border-sky-100/50">
                <h5 className="text-[10px] font-black text-sky-800 uppercase tracking-[0.25em] mb-6">Real-time Movement</h5>
                <div className="flex items-center gap-4 relative py-2">
                   <div className="flex-1 h-2 bg-sky-200 rounded-full overflow-hidden relative shadow-inner">
                      <div className="absolute left-0 top-0 h-full w-1/4 bg-sky-600 shadow-lg shadow-sky-400"></div>
                   </div>
                   <div className="flex justify-between w-full absolute -bottom-8 text-[9px] font-black text-sky-300 uppercase tracking-widest px-1">
                      <span className="text-sky-700">Packed</span>
                      <span>Shipped</span>
                      <span>Transit</span>
                      <span>Delivered</span>
                   </div>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );

  // --- Layout Render ---

  if (!currentUser) return <LoginView />;

  return (
    <div className="min-h-screen pb-24 bg-sky-50/30 selection:bg-sky-100 selection:text-sky-900">
      <Navbar />
      
      <main className="animate-in fade-in slide-in-from-top-4 duration-700">
        {activeTab === 'home' && <HomeView />}
        {activeTab === 'seller_dashboard' && <SellerDashboard />}
        {activeTab === 'cart' && <CartView />}
        {activeTab === 'checkout' && <CheckoutView />}
        {activeTab === 'orders' && <OrdersView />}
        {activeTab === 'wishlist' && <WishlistView />}
      </main>

      {isAddingProduct && <AddProductModal />}

      {/* Floating Global Actions */}
      <div className="fixed bottom-28 right-8 z-40 flex flex-col gap-4">
        <button 
          onClick={() => {
             setIsTranslating(true);
             setTimeout(() => setIsTranslating(false), 2000);
             alert(`All creations translated to ${language} using AI Intelligence`);
          }}
          className="bg-white/80 backdrop-blur-xl shadow-2xl border border-sky-100 text-sky-700 p-5 rounded-full flex items-center gap-3 font-black transition-all hover:scale-110 hover:shadow-sky-200 hover:text-sky-900 group"
          title="Translate Marketplace"
        >
          {isTranslating ? (
            <i className="fa-solid fa-spinner-third animate-spin text-2xl"></i>
          ) : (
            <i className="fa-solid fa-globe text-2xl group-hover:rotate-12 transition-transform"></i>
          )}
          <span className="text-xs uppercase tracking-widest hidden md:block">Region: {language}</span>
        </button>
      </div>

      {/* Mobile Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-2xl border-t border-sky-100 md:hidden flex justify-around py-5 px-4 shadow-2xl rounded-t-[2.5rem]">
         <button onClick={() => setActiveTab('home')} className={`text-2xl transition-all ${activeTab === 'home' ? 'text-sky-600 scale-125' : 'text-gray-300'}`}><i className="fa-solid fa-house-heart"></i></button>
         <button onClick={() => setActiveTab('wishlist')} className={`text-2xl transition-all relative ${activeTab === 'wishlist' ? 'text-red-500 scale-125' : 'text-gray-300'}`}>
            <i className="fa-solid fa-heart"></i>
            {wishlist.length > 0 && <span className="absolute -top-2 -right-2 bg-red-400 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold border border-white">{wishlist.length}</span>}
         </button>
         {currentUser.role === UserRole.SELLER && (
           <button onClick={() => setActiveTab('seller_dashboard')} className={`text-2xl transition-all ${activeTab === 'seller_dashboard' ? 'text-sky-600 scale-125' : 'text-gray-300'}`}><i className="fa-solid fa-chart-tree-map"></i></button>
         )}
         <button onClick={() => setActiveTab('cart')} className={`text-2xl transition-all relative ${activeTab === 'cart' ? 'text-sky-600 scale-125' : 'text-gray-300'}`}>
            <i className="fa-solid fa-cart-shopping"></i>
            {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-sky-600 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold border border-white">{cart.length}</span>}
         </button>
         <button onClick={() => setActiveTab('orders')} className={`text-2xl transition-all ${activeTab === 'orders' ? 'text-sky-600 scale-125' : 'text-gray-300'}`}><i className="fa-solid fa-receipt"></i></button>
      </div>
    </div>
  );
};

export default App;
