
import { Product } from './types';

export const CATEGORIES = [
  { id: 'all', name: 'All Products', icon: 'fa-box-open' },
  { id: 'homedecor', name: 'Home Decor', icon: 'fa-house-chimney-window' },
  { id: 'clothing', name: 'Clothing', icon: 'fa-shirt' },
  { id: 'jewelry', name: 'Jewelry', icon: 'fa-gem' },
  { id: 'pottery', name: 'Pottery', icon: 'fa-mountain' },
  { id: 'textiles', name: 'Textiles', icon: 'fa-rug' },
  { id: 'gifts', name: 'Gifts', icon: 'fa-gift' },
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Hand-painted Ceramic Vase',
    description: 'A beautiful blue and white ceramic vase, hand-painted by traditional artisans in Rajasthan.',
    price: 1250,
    category: 'pottery',
    sellerId: 's1',
    sellerName: 'Amit Artisans',
    images: ['https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&q=80&w=800'],
    tags: ['blue', 'ceramic', 'handmade'],
    rating: 4.8,
    reviews: 124,
    weightInGrams: 1200,
    story: 'This vase represents the blue pottery traditions passed down through generations in my family.'
  },
  {
    id: '2',
    name: 'Block-Printed Cotton Kurta',
    description: 'Hand-block printed indigo kurta made from 100% organic cotton. Traditional Jaipur technique.',
    price: 1850,
    category: 'clothing',
    sellerId: 's2',
    sellerName: 'Jaipur Threads',
    images: ['https://images.unsplash.com/photo-1596462502278-27bf8637368c?auto=format&fit=crop&q=80&w=800'],
    tags: ['cotton', 'kurta', 'indigo'],
    rating: 4.9,
    reviews: 42,
    weightInGrams: 300
  },
  {
    id: '3',
    name: 'Silver Filigree Earrings',
    description: 'Delicate handcrafted silver earrings featuring traditional filigree patterns.',
    price: 2200,
    category: 'jewelry',
    sellerId: 's3',
    sellerName: 'Silver Craft',
    images: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=800'],
    tags: ['silver', 'jewelry', 'earrings'],
    rating: 4.7,
    reviews: 89,
    weightInGrams: 50
  },
  {
    id: '4',
    name: 'Hand-Carved Wooden Partition',
    description: 'Exquisite Sheesham wood room divider with intricate floral carvings. A masterpiece of woodcraft.',
    price: 12000,
    category: 'homedecor',
    sellerId: 's4',
    sellerName: 'Saharanpur Arts',
    images: ['https://images.unsplash.com/photo-1513519245088-0e12902e35ca?auto=format&fit=crop&q=80&w=800'],
    tags: ['wood', 'furniture', 'carved'],
    rating: 5.0,
    reviews: 12,
    weightInGrams: 8500
  },
  {
    id: '5',
    name: 'Hand-Woven Pashmina Shawl',
    description: 'Authentic 100% Pashmina wool shawl from Kashmir. Soft, warm, and timelessly elegant.',
    price: 15500,
    category: 'textiles',
    sellerId: 's5',
    sellerName: 'Kashmir Looms',
    images: ['https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&q=80&w=800'],
    tags: ['wool', 'pashmina', 'luxury'],
    rating: 4.9,
    reviews: 28,
    weightInGrams: 250
  },
  {
    id: '6',
    name: 'Artisan Gourmet Gift Box',
    description: 'A curated collection of handmade organic chocolates, tea, and a hand-poured soy candle.',
    price: 2500,
    category: 'gifts',
    sellerId: 's6',
    sellerName: 'Soulful Hampers',
    images: ['https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=800'],
    tags: ['gift', 'hamper', 'organic'],
    rating: 4.8,
    reviews: 210,
    weightInGrams: 1500
  },
  {
    id: '7',
    name: 'Macrame Wall Hanging',
    description: 'Bohemian style large wall hanging made from recycled cotton cords and driftwood.',
    price: 3200,
    category: 'homedecor',
    sellerId: 's7',
    sellerName: 'Knotty Arts',
    images: ['https://images.unsplash.com/photo-1522758971460-1d21eed7dc1d?auto=format&fit=crop&q=80&w=800'],
    tags: ['macrame', 'wall art', 'boho'],
    rating: 4.6,
    reviews: 45,
    weightInGrams: 1100
  },
  {
    id: '8',
    name: 'Kantha Work Cotton Throw',
    description: 'Hand-stitched vintage Kantha throw from Bengal. Double-sided with unique patterns.',
    price: 4500,
    category: 'textiles',
    sellerId: 's8',
    sellerName: 'Bengal Heritage',
    images: ['https://images.unsplash.com/photo-1595053545196-85750033c415?auto=format&fit=crop&q=80&w=800'],
    tags: ['kantha', 'throw', 'vintage'],
    rating: 4.7,
    reviews: 33,
    weightInGrams: 900
  }
];
