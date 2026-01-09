
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, UserRole, Product, CartItem, Order, AIInsights } from './types';
import { MOCK_PRODUCTS, CATEGORIES } from './constants';
import { getAIProductEnrichment, translateContent, getSalesInsights, analyzeRoomForDecor, generateProductImage, enhanceProductImage } from './services/geminiService';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

// --- Shared Constants & UI Components ---

const REGIONS = [
  { id: 'local', name: 'Local (Within State)', multiplier: 1, base: 40 },
  { id: 'national', name: 'National (Across India)', multiplier: 1.8, base: 70 },
  { id: 'intl', name: 'International', multiplier: 5.5, base: 450 }
];

const MOCK_GOOGLE_ACCOUNTS = [
  { name: 'Amit Sharma', email: 'amit.sharma@gmail.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amit' },
  { name: 'Priya Das', email: 'priya.das@gmail.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya' },
  { name: 'Rajesh Kumar', email: 'rajesh.k@gmail.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rajesh' }
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

// --- Sub-Components ---

const Navbar: React.FC<{
  activeTab: string;
  setActiveTab: (tab: any) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isListening: boolean;
  startVoiceSearch: () => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isAnalyzing: boolean;
  currentUser: User | null;
  toggleProfile: () => void;
  cartLength: number;
}> = ({ activeTab, setActiveTab, searchQuery, setSearchQuery, isListening, startVoiceSearch, onImageUpload, isAnalyzing, currentUser, toggleProfile, cartLength }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-sky-100 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div onClick={() => setActiveTab('home')} className="flex items-center gap-2 cursor-pointer">
            <div className="w-10 h-10 bg-sky-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
               <i className="fa-solid fa-hands-holding-circle text-xl"></i>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-sky-700 to-sky-500 bg-clip-text text-transparent">MadeByMe</span>
          </div>
          <div className="flex md:hidden items-center gap-4">
            {currentUser && (
               <div onClick={toggleProfile} className="w-9 h-9 rounded-full bg-sky-100 border-2 border-white shadow-sm overflow-hidden cursor-pointer">
                 <img src={currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name}`} className="w-full h-full object-cover" />
               </div>
            )}
          </div>
        </div>

        <div className="relative w-full max-w-lg mx-auto flex items-center">
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder={isListening ? "Listening..." : isAnalyzing ? "AI is analyzing your room..." : "Search treasures..."} 
              className={`active-focus w-full pl-11 pr-24 py-2 bg-sky-50 border border-sky-100 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-400 text-gray-900 placeholder-sky-300 font-medium transition-all ${isListening || isAnalyzing ? 'ring-sky-600 bg-sky-100' : ''}`} 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-3 text-sky-300"></i>
            
            <div className="absolute right-2 top-1.5 flex gap-1">
              <button 
                onClick={() => fileInputRef.current?.click()} 
                title="Decorate my room (AI Vision)"
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isAnalyzing ? 'bg-amber-500 text-white animate-spin' : 'bg-sky-100 text-sky-600 hover:bg-sky-200'}`}
              >
                <i className="fa-solid fa-camera-retro"></i>
              </button>
              <button 
                onClick={startVoiceSearch} 
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-sky-100 text-sky-600 hover:bg-sky-200'}`}
              >
                <i className="fa-solid fa-microphone"></i>
              </button>
            </div>
            <input type="file" ref={fileInputRef} onChange={onImageUpload} accept="image/*" className="hidden" />
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
            {cartLength > 0 && <span className="absolute -top-2 -right-2 bg-sky-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold border border-white">{cartLength}</span>}
          </div>
          
          <div onClick={toggleProfile} className="w-10 h-10 rounded-full bg-sky-100 border-2 border-white shadow-md overflow-hidden cursor-pointer active:scale-95 transition-all">
             <img src={currentUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.name}`} className="w-full h-full object-cover" alt="User Profile" />
          </div>
        </div>
      </div>
    </nav>
  );
};

const ProfileDropdown: React.FC<{ 
  user: User; 
  onClose: () => void; 
  onLogout: () => void;
}> = ({ user, onClose, onLogout }) => {
  return (
    <div className="fixed top-20 right-4 md:right-24 z-[100] w-72 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white/80 backdrop-blur-xl border border-sky-100 rounded-[2.5rem] shadow-2xl overflow-hidden shadow-sky-900/10">
        <div className="p-6 bg-gradient-to-br from-sky-50 to-white">
          <div className="flex items-center gap-4 mb-4">
             <div className="w-16 h-16 rounded-3xl overflow-hidden shadow-lg border-2 border-white">
                <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} className="w-full h-full object-cover" />
             </div>
             <div>
                <h4 className="font-black text-sky-900 text-lg leading-none">{user.name}</h4>
                <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mt-1.5 bg-sky-100 px-2 py-0.5 rounded-full inline-block">{user.role}</p>
             </div>
          </div>
          <p className="text-xs text-gray-500 font-medium truncate">{user.email || 'artisan.member@madebyme.com'}</p>
        </div>
        
        <div className="p-4 space-y-1">
          <button className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-sky-50 transition-colors text-sky-800 font-bold text-sm">
            <i className="fa-solid fa-user-gear text-sky-300"></i> Account Settings
          </button>
          <button className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-sky-50 transition-colors text-sky-800 font-bold text-sm">
            <i className="fa-solid fa-shield-halved text-sky-300"></i> Privacy & Safety
          </button>
          <button className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-sky-50 transition-colors text-sky-800 font-bold text-sm">
            <i className="fa-solid fa-circle-question text-sky-300"></i> Help Center
          </button>
          
          <div className="pt-2 mt-2 border-t border-sky-50">
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-rose-50 transition-colors text-rose-600 font-bold text-sm"
            >
              <i className="fa-solid fa-right-from-bracket"></i> Sign Out
            </button>
          </div>
        </div>
      </div>
      {/* Click outside backdrop */}
      <div onClick={onClose} className="fixed inset-0 -z-10 bg-transparent" />
    </div>
  );
};

const AuthView: React.FC<{
  onLogin: (u: User) => void;
  isSelectingAccount: boolean;
  setIsSelectingAccount: (v: boolean) => void;
  selectedRoleForSocial: UserRole;
  setSelectedRoleForSocial: (r: UserRole) => void;
}> = ({ onLogin, isSelectingAccount, setIsSelectingAccount, selectedRoleForSocial, setSelectedRoleForSocial }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: UserRole.BUYER });

  const triggerSocialLogin = () => {
    setIsSelectingAccount(true);
    setSelectedRoleForSocial(formData.role);
  };

  const handleAccountSelection = (account: typeof MOCK_GOOGLE_ACCOUNTS[0]) => {
    onLogin({
      id: `g-${Date.now()}`,
      name: account.name,
      role: selectedRoleForSocial, 
      language: 'English',
      email: account.email,
      avatar: account.avatar
    });
    setIsSelectingAccount(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({ id: `u-${Date.now()}`, name: formData.name || 'User', role: formData.role, language: 'English', email: formData.email });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-600 to-indigo-900 p-4">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-lg border border-white/20 relative overflow-hidden transition-all duration-500">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-sky-600 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-4 shadow-xl"><i className="fa-solid fa-hands-holding-circle text-4xl"></i></div>
          <h1 className="text-3xl font-black text-sky-900 uppercase tracking-tighter">MadeByMe</h1>
          <p className="text-sky-500 font-bold mt-2">Empowering Artisans Worldwide</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <input required type="text" placeholder="Full Name" className="w-full p-4 bg-sky-50 border border-sky-100 rounded-2xl outline-none font-bold text-sky-900 animate-in fade-in slide-in-from-top-2" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          )}
          <input required type="email" placeholder="Email" className="w-full p-4 bg-sky-50 border border-sky-100 rounded-2xl outline-none font-bold text-sky-900" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          <input required type="password" placeholder="Password" className="w-full p-4 bg-sky-50 border border-sky-100 rounded-2xl outline-none font-bold text-sky-900" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          <div className="flex gap-4 p-1.5 bg-sky-50 rounded-2xl border border-sky-100">
            <button type="button" onClick={() => setFormData({...formData, role: UserRole.BUYER})} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${formData.role === UserRole.BUYER ? 'bg-white text-sky-600 shadow-sm' : 'text-sky-300'}`}>Buyer</button>
            <button type="button" onClick={() => setFormData({...formData, role: UserRole.SELLER})} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${formData.role === UserRole.SELLER ? 'bg-white text-sky-600 shadow-sm' : 'text-sky-300'}`}>Artisan</button>
          </div>
          <Button type="submit" className="w-full py-4 text-lg mt-6">
            {isSignUp ? 'Create My Account' : 'Login to Marketplace'}
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-sm font-bold text-sky-600 hover:text-sky-800 transition-colors">
            {isSignUp ? "Already have an account? Log In" : "Don't have an account? Sign Up"}
          </button>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col gap-3">
           <button onClick={triggerSocialLogin} className="flex items-center justify-center gap-3 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all"><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5" /> Continue with Google</button>
        </div>

        {isSelectingAccount && (
          <div className="absolute inset-0 z-50 bg-white p-10 flex flex-col animate-in slide-in-from-bottom-full duration-500">
            <button onClick={() => setIsSelectingAccount(false)} className="absolute top-6 left-6 text-gray-400 hover:text-sky-600 transition-colors">
              <i className="fa-solid fa-arrow-left text-xl"></i>
            </button>
            <div className="text-center mb-8">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-10 mx-auto mb-4" alt="Google" />
              <h2 className="text-xl font-bold text-gray-800">Choose an account</h2>
              <p className="text-sm text-gray-500">to continue to <span className="text-sky-600 font-bold">MadeByMe</span></p>
            </div>
            <div className="space-y-2 overflow-y-auto no-scrollbar flex-1">
              {MOCK_GOOGLE_ACCOUNTS.map((account, idx) => (
                <button 
                  key={idx} 
                  onClick={() => handleAccountSelection(account)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-sky-50 rounded-2xl transition-all border border-transparent hover:border-sky-100 group text-left"
                >
                  <img src={account.avatar} className="w-10 h-10 rounded-full border border-sky-100 group-hover:scale-105 transition-transform" alt={account.name} />
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 leading-none">{account.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{account.email}</p>
                  </div>
                  <i className="fa-solid fa-chevron-right text-[10px] text-sky-100 group-hover:text-sky-300"></i>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const HomeView: React.FC<{
  activeTab: string;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  filteredProducts: Product[];
  wishlist: Product[];
  handleToggleWishlist: (p: Product) => void;
  handleAddToCart: (p: Product) => void;
  setActiveTab: (tab: any) => void;
  aiRoomRecommendations: any | null;
  clearAiRecommendations: () => void;
}> = ({ activeTab, selectedCategory, setSelectedCategory, filteredProducts, wishlist, handleToggleWishlist, handleAddToCart, setActiveTab, aiRoomRecommendations, clearAiRecommendations }) => (
  <div className="max-w-7xl mx-auto px-4 py-8">
    {activeTab === 'wishlist' && (
      <div className="mb-8">
        <h2 className="text-3xl font-black text-sky-900">Your Liked Items</h2>
        <p className="text-sky-500 font-bold">Quick access to your favorite artisanal works.</p>
      </div>
    )}

    {aiRoomRecommendations && activeTab === 'home' && (
      <div className="mb-10 p-8 bg-gradient-to-r from-sky-600 to-indigo-700 rounded-[3rem] text-white shadow-xl relative overflow-hidden group">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-white/20 shadow-lg flex-shrink-0">
            <img src={aiRoomRecommendations.image} className="w-full h-full object-cover" alt="Uploaded room" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <i className="fa-solid fa-wand-magic-sparkles text-amber-400"></i>
              <span className="text-xs font-black uppercase tracking-[0.2em] opacity-80">AI Interior Decorator</span>
            </div>
            <h2 className="text-3xl font-black leading-tight">Handmade pieces for your {aiRoomRecommendations.style} style room</h2>
            <p className="mt-2 text-sky-100 font-medium max-w-2xl">{aiRoomRecommendations.recommendationReason || "We've curated these items to match the textures and colors of your space."}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              {aiRoomRecommendations.suggestedTags.map((tag: string) => (
                <span key={tag} className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">#{tag}</span>
              ))}
            </div>
          </div>
          <button onClick={clearAiRecommendations} className="md:ml-auto p-4 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>
        <i className="fa-solid fa-couch absolute -bottom-10 -right-10 text-[12rem] opacity-5 -rotate-12"></i>
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
          <Button variant="secondary" className="mt-4" onClick={() => {setSelectedCategory('all'); setActiveTab('home'); clearAiRecommendations();}}>View All Products</Button>
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

const SellerDashboard: React.FC<{
  currentUser: User | null;
  setIsAddingProduct: (v: boolean) => void;
  aiTips: string[];
  sellerProducts: Product[];
  deleteProduct: (id: string) => void;
}> = ({ currentUser, setIsAddingProduct, aiTips, sellerProducts, deleteProduct }) => {
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

const CartView: React.FC<{
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  totalCartPrice: number;
  setActiveTab: (tab: any) => void;
}> = ({ cart, setCart, totalCartPrice, setActiveTab }) => (
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

const CheckoutView: React.FC<{
  shippingDetails: any;
  setShippingDetails: (d: any) => void;
  deliveryRegion: string;
  setDeliveryRegion: (r: string) => void;
  totalCartPrice: number;
  totalShippingFee: number;
  handlePlaceOrder: () => void;
}> = ({ shippingDetails, setShippingDetails, deliveryRegion, setDeliveryRegion, totalCartPrice, totalShippingFee, handlePlaceOrder }) => (
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

const OrdersView: React.FC<{
  userOrders: Order[];
  setActiveTab: (tab: any) => void;
}> = ({ userOrders, setActiveTab }) => (
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

const AddProductModal: React.FC<{
  setIsAddingProduct: (v: boolean) => void;
  currentUser: User | null;
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}> = ({ setIsAddingProduct, currentUser, setProducts }) => {
  const [roughInput, setRoughInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [enhancingIndex, setEnhancingIndex] = useState<number | null>(null);
  const [enrichedData, setEnrichedData] = useState<any>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [weight, setWeight] = useState(500); 
  const [selectedSize, setSelectedSize] = useState<"1K" | "2K" | "4K">("1K");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAIEnrich = async () => {
    if (!roughInput) return;
    setLoading(true);
    const data = await getAIProductEnrichment(roughInput);
    setEnrichedData(data);
    setLoading(false);
  };

  const handleAIGenerateImage = async () => {
    if (!roughInput && (!enrichedData || !enrichedData.name)) {
      alert("Please provide a description or generate listing details first.");
      return;
    }
    setImgLoading(true);
    try {
      const prompt = enrichedData?.name || roughInput;
      const imageUrl = await generateProductImage(prompt, selectedSize);
      if (imageUrl) {
        setUploadedImages(prev => [imageUrl, ...prev]);
      }
    } catch (err) {
      alert("Failed to generate image. Please try again.");
    } finally {
      setImgLoading(false);
    }
  };

  const handleRemoveImage = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (enhancingIndex === index) return;
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    if (enhancingIndex === index) setEnhancingIndex(null);
  };

  const handleEnhanceImage = async (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (enhancingIndex !== null) return;
    const cat = enrichedData?.category || "Handmade Product";
    const name = enrichedData?.name || "Artisanal Piece";
    
    setEnhancingIndex(index);
    try {
      const enhanced = await enhanceProductImage(uploadedImages[index], cat, name);
      if (enhanced) {
        setUploadedImages(prev => {
          const newList = [...prev];
          newList[index] = enhanced;
          return newList;
        });
      } else {
        alert("Could not enhance this photo. Check your connection.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEnhancingIndex(null);
    }
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
    const input = e.target;
    if (!input.files) return;
    Array.from(input.files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result && typeof reader.result === 'string') {
          setUploadedImages(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file as Blob);
    });
  };

  const renderImageThumbnails = () => (
    <div className="flex flex-wrap gap-4 mt-4">
      {uploadedImages.map((img, idx) => (
        <div key={idx} className={`relative w-24 h-24 rounded-2xl overflow-hidden shadow-sm group border-2 transition-all ${enhancingIndex === idx ? 'border-sky-500 scale-105 animate-pulse' : 'border-transparent'}`}>
          <img src={img} className="w-full h-full object-cover" alt="prev" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity">
             <button type="button" onClick={(e) => handleEnhanceImage(e, idx)} disabled={enhancingIndex !== null} className="w-8 h-8 bg-sky-600 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 disabled:opacity-50">
               <i className={`fa-solid ${enhancingIndex === idx ? 'fa-spinner animate-spin' : 'fa-wand-magic-sparkles'} text-xs`}></i>
             </button>
             <button type="button" onClick={(e) => handleRemoveImage(e, idx)} disabled={enhancingIndex !== null} className="w-8 h-8 bg-white/20 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-colors shadow-lg active:scale-90">
               <i className="fa-solid fa-trash-can text-xs"></i>
             </button>
          </div>
          {enhancingIndex === idx && (
            <div className="absolute inset-0 bg-sky-900/40 flex items-center justify-center"><div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div></div>
          )}
          <button type="button" onClick={(e) => handleRemoveImage(e, idx)} className="md:hidden absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center text-[10px]"><i className="fa-solid fa-xmark"></i></button>
        </div>
      ))}
      <button type="button" onClick={() => fileInputRef.current?.click()} className="w-24 h-24 border-2 border-dashed border-sky-200 rounded-2xl flex flex-col items-center justify-center text-sky-400 hover:bg-sky-50"><i className="fa-solid fa-camera text-2xl"></i><span className="text-[8px] font-bold mt-1 uppercase">Upload</span></button>
      <input type="file" ref={fileInputRef} onChange={handleImageUpload} multiple accept="image/*" className="hidden" />
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-sky-900/60 backdrop-blur-md">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col border border-white/50 animate-in zoom-in duration-300">
        <div className="p-8 border-b border-sky-100 flex justify-between items-center bg-sky-50/50">
          <div className="flex items-center gap-3">
             <h3 className="text-2xl font-bold text-sky-900">Smart Listing</h3>
             {enrichedData && <span className="bg-sky-600 text-white text-[10px] px-2 py-1 rounded-full font-black uppercase">AI Mode Active</span>}
          </div>
          <button onClick={() => setIsAddingProduct(false)} className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"><i className="fa-solid fa-xmark text-xl"></i></button>
        </div>
        <div className="p-8 overflow-y-auto flex-1 no-scrollbar">
          {!enrichedData ? (
            <div className="space-y-8">
              <div>
                <label className="block text-sm font-bold text-sky-800 uppercase tracking-widest mb-3">What are you selling?</label>
                <textarea value={roughInput} onChange={(e) => setRoughInput(e.target.value)} placeholder="Describe your item in simple words. AI will handle the rest..." className="active-focus w-full h-40 p-5 bg-sky-50 border border-sky-100 rounded-[2rem] outline-none text-gray-900 text-lg placeholder-sky-200 font-medium resize-none" />
                <div className="mt-8">
                  <div className="flex justify-between items-center mb-1"><label className="block text-sm font-bold text-sky-800 uppercase tracking-widest">Photos & Enhancements</label>
                    <div className="flex items-center gap-3">
                       <select value={selectedSize} onChange={(e) => setSelectedSize(e.target.value as any)} className="text-[10px] font-black uppercase tracking-widest bg-sky-50 border border-sky-100 rounded-full px-3 py-1 outline-none text-sky-700"><option value="1K">Standard (1K)</option><option value="2K">High (2K)</option><option value="4K">Ultra (4K)</option></select>
                       <button type="button" onClick={handleAIGenerateImage} disabled={imgLoading} className="text-[10px] font-black uppercase tracking-widest text-sky-600 hover:text-sky-800 flex items-center gap-1.5 bg-sky-100 px-3 py-1 rounded-full border border-sky-200 shadow-sm transition-all active:scale-95 disabled:opacity-50">{imgLoading ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-wand-sparkles"></i>} AI Create</button>
                    </div>
                  </div>
                  {renderImageThumbnails()}
                </div>
              </div>
              <Button onClick={handleAIEnrich} disabled={loading || !roughInput} className="w-full py-5 text-lg"> {loading ? 'Enriching with AI...' : 'Generate Listing Details'} </Button>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div><label className="block text-[10px] font-black text-sky-400 uppercase tracking-widest mb-2">Artisan Name</label><input type="text" value={enrichedData.name} onChange={(e) => setEnrichedData({...enrichedData, name: e.target.value})} className="active-focus w-full p-4 bg-sky-50 border border-sky-100 rounded-2xl outline-none font-bold text-sky-900 text-xl" /></div>
              <div><label className="block text-[10px] font-black text-sky-400 uppercase tracking-widest mb-2">Listing Images</label>{renderImageThumbnails()}</div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[10px] font-black text-sky-400 uppercase tracking-widest mb-2">Category</label><input type="text" value={enrichedData.category} onChange={(e) => setEnrichedData({...enrichedData, category: e.target.value})} className="active-focus w-full p-3 bg-sky-50 border border-sky-100 rounded-xl outline-none font-bold text-sky-900 text-sm" /></div>
                <div><label className="block text-[10px] font-black text-sky-400 uppercase tracking-widest mb-2">Suggested Price (INR)</label><input type="number" value={enrichedData.price} onChange={(e) => setEnrichedData({...enrichedData, price: Number(e.target.value)})} className="active-focus w-full p-3 bg-sky-50 border border-sky-100 rounded-xl outline-none font-bold text-sky-900 text-sm" /></div>
              </div>
              <div><label className="block text-[10px] font-black text-sky-400 uppercase tracking-widest mb-2">Product Story & Description</label><textarea value={enrichedData.description} onChange={(e) => setEnrichedData({...enrichedData, description: e.target.value})} className="active-focus w-full h-40 p-5 bg-sky-50 border border-sky-100 rounded-[2rem] outline-none text-gray-900 leading-relaxed font-medium resize-none" /></div>
              <div className="flex gap-4 pt-4"><Button variant="outline" onClick={() => setEnrichedData(null)} className="flex-1 py-4">Back to Edit</Button><Button onClick={handleFinalize} className="flex-1 py-4">Publish Item</Button></div>
            </div>
          )}
        </div>
      </div>
    </div>
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
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiTips, setAiTips] = useState<string[]>([]);
  const [aiRoomRecommendations, setAiRoomRecommendations] = useState<any | null>(null);
  const [isSelectingAccount, setIsSelectingAccount] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedRoleForSocial, setSelectedRoleForSocial] = useState(UserRole.BUYER);
  
  const [deliveryRegion, setDeliveryRegion] = useState('local');
  const [shippingDetails, setShippingDetails] = useState({ name: '', address: '', city: '', pincode: '' });

  useEffect(() => {
    if (currentUser?.role === UserRole.SELLER) {
      const fetchTips = async () => {
        const history = "Vase: 5 sales, Kurta: 2 sales, Earrings: 10 sales";
        const result = await getSalesInsights(history);
        if (result && result.tips) setAiTips(result.tips);
      };
      fetchTips();
    }
  }, [currentUser]);

  const filteredProducts = useMemo(() => {
    const baseList = activeTab === 'wishlist' ? wishlist : products;
    return baseList.filter(p => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = p.name.toLowerCase().includes(query) || p.tags.some(t => t.toLowerCase().includes(query)) || p.category.toLowerCase().includes(query);
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      let matchesAi = true;
      if (aiRoomRecommendations && activeTab === 'home') {
        const aiTags = aiRoomRecommendations.suggestedTags.map((t: string) => t.toLowerCase());
        const aiCategories = aiRoomRecommendations.suggestedCategories.map((c: string) => c.toLowerCase());
        matchesAi = p.tags.some(t => aiTags.includes(t.toLowerCase())) || aiCategories.some(c => p.category.toLowerCase().includes(c)) || p.description.toLowerCase().includes(aiRoomRecommendations.style.toLowerCase());
      }
      return matchesSearch && matchesCategory && matchesAi;
    });
  }, [products, wishlist, searchQuery, selectedCategory, activeTab, aiRoomRecommendations]);

  const sellerProducts = useMemo(() => products.filter(p => p.sellerId === currentUser?.id || p.sellerName === 'Amit Artisans'), [products, currentUser]);
  const totalCartPrice = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cart]);
  const totalShippingFee = useMemo(() => {
    if (cart.length === 0) return 0;
    const totalWeight = cart.reduce((acc, item) => acc + ((item.weightInGrams || 500) * item.quantity), 0);
    const region = REGIONS.find(r => r.id === deliveryRegion) || REGIONS[0];
    return Math.round(region.base + (Math.ceil(totalWeight / 500) * 20 * region.multiplier));
  }, [cart, deliveryRegion]);

  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Voice not supported.");
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => { setSearchQuery(event.results[0][0].transcript); setActiveTab('home'); };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsAnalyzing(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      if (typeof reader.result === 'string') {
        const result = await analyzeRoomForDecor(reader.result);
        if (result) { setAiRoomRecommendations({ ...result, image: reader.result }); setActiveTab('home'); }
      }
      setIsAnalyzing(false);
    };
    reader.readAsDataURL(file as Blob);
  };

  const handleAddToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleToggleWishlist = (product: Product) => {
    setWishlist(prev => prev.find(p => p.id === product.id) ? prev.filter(p => p.id !== product.id) : [...prev, product]);
  };

  const handlePlaceOrder = () => {
    if (!shippingDetails.name || !shippingDetails.address) return alert("Complete details.");
    setUserOrders(prev => [{ id: `ORD-${Math.floor(Math.random() * 10000)}`, items: [...cart], total: totalCartPrice + totalShippingFee, shippingFee: totalShippingFee, status: 'Packed', date: new Date().toLocaleDateString(), address: `${shippingDetails.address}, ${shippingDetails.city}` }, ...prev]);
    setCart([]); setActiveTab('orders'); alert("Ordered!");
  };

  const deleteProduct = (id: string) => { if (confirm("Remove listing?")) setProducts(prev => prev.filter(p => p.id !== id)); };
  const handleLogout = () => { setCurrentUser(null); setIsProfileOpen(false); setActiveTab('home'); };

  if (!currentUser) return <AuthView onLogin={setCurrentUser} isSelectingAccount={isSelectingAccount} setIsSelectingAccount={setIsSelectingAccount} selectedRoleForSocial={selectedRoleForSocial} setSelectedRoleForSocial={setSelectedRoleForSocial} />;

  return (
    <div className="min-h-screen pb-28 bg-sky-50/30">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} searchQuery={searchQuery} setSearchQuery={setSearchQuery} isListening={isListening} isAnalyzing={isAnalyzing} onImageUpload={handleImageUpload} startVoiceSearch={startVoiceSearch} currentUser={currentUser} toggleProfile={() => setIsProfileOpen(!isProfileOpen)} cartLength={cart.length} />
      
      {isProfileOpen && <ProfileDropdown user={currentUser} onClose={() => setIsProfileOpen(false)} onLogout={handleLogout} />}

      <main className="animate-in fade-in duration-700">
        {(activeTab === 'home' || activeTab === 'wishlist') && <HomeView activeTab={activeTab} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} filteredProducts={filteredProducts} wishlist={wishlist} handleToggleWishlist={handleToggleWishlist} handleAddToCart={handleAddToCart} setActiveTab={setActiveTab} aiRoomRecommendations={aiRoomRecommendations} clearAiRecommendations={() => setAiRoomRecommendations(null)} />}
        {activeTab === 'seller_dashboard' && <SellerDashboard currentUser={currentUser} setIsAddingProduct={setIsAddingProduct} aiTips={aiTips} sellerProducts={sellerProducts} deleteProduct={deleteProduct} />}
        {activeTab === 'cart' && <CartView cart={cart} setCart={setCart} totalCartPrice={totalCartPrice} setActiveTab={setActiveTab} />}
        {activeTab === 'checkout' && <CheckoutView shippingDetails={shippingDetails} setShippingDetails={setShippingDetails} deliveryRegion={deliveryRegion} setDeliveryRegion={setDeliveryRegion} totalCartPrice={totalCartPrice} totalShippingFee={totalShippingFee} handlePlaceOrder={handlePlaceOrder} />}
        {activeTab === 'orders' && <OrdersView userOrders={userOrders} setActiveTab={setActiveTab} />}
      </main>

      {isAddingProduct && <AddProductModal setIsAddingProduct={setIsAddingProduct} currentUser={currentUser} setProducts={setProducts} />}

      {/* Persistent Labeled Mobile Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl border-t border-sky-100 md:hidden flex justify-around items-center pt-3 pb-6 px-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] rounded-t-[2.5rem] z-[100]">
         <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'home' ? 'text-sky-600' : 'text-gray-300'}`}>
            <i className="fa-solid fa-house text-xl"></i>
            <span className="text-[10px] font-black uppercase tracking-tighter">Market</span>
         </button>
         
         {currentUser.role === UserRole.SELLER ? (
            <button onClick={() => setActiveTab('seller_dashboard')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'seller_dashboard' ? 'text-sky-600 scale-110' : 'text-gray-300'}`}>
               <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${activeTab === 'seller_dashboard' ? 'bg-sky-600 text-white shadow-lg' : 'bg-sky-50'}`}>
                  <i className="fa-solid fa-store text-lg"></i>
               </div>
               <span className="text-[10px] font-black uppercase tracking-tighter">Studio</span>
            </button>
         ) : (
            <button onClick={() => setActiveTab('wishlist')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'wishlist' ? 'text-red-500' : 'text-gray-300'}`}>
               <i className="fa-solid fa-heart text-xl"></i>
               <span className="text-[10px] font-black uppercase tracking-tighter">Liked</span>
            </button>
         )}

         <button onClick={() => setActiveTab('cart')} className={`flex flex-col items-center gap-1 transition-all relative ${activeTab === 'cart' ? 'text-sky-600' : 'text-gray-300'}`}>
            <i className="fa-solid fa-cart-shopping text-xl"></i>
            {cart.length > 0 && <span className="absolute -top-1.5 -right-2 bg-sky-600 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold border border-white">{cart.length}</span>}
            <span className="text-[10px] font-black uppercase tracking-tighter">Basket</span>
         </button>

         <button onClick={() => setActiveTab('orders')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'orders' ? 'text-sky-600' : 'text-gray-300'}`}>
            <i className="fa-solid fa-receipt text-xl"></i>
            <span className="text-[10px] font-black uppercase tracking-tighter">Orders</span>
         </button>
      </div>
    </div>
  );
};

export default App;
