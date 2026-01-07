
import { Product } from './types';

export const CATEGORIES = [
  { id: 'all', name: 'All Products', icon: 'fa-box-open' },
  { id: 'crafts', name: 'Crafts', icon: 'fa-scissors' },
  { id: 'jewelry', name: 'Jewelry', icon: 'fa-gem' },
  { id: 'paintings', name: 'Paintings', icon: 'fa-palette' },
  { id: 'pottery', name: 'Pottery', icon: 'fa-mountain' },
  { id: 'embroidery', name: 'Embroidery', icon: 'fa-shirt' },
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
    story: 'This vase represents the blue pottery traditions passed down through generations in my family.'
  },
  {
    id: '2',
    name: 'Silk Embroidered Saree',
    description: 'Luxurious silk saree with intricate Zardosi work, perfect for festive occasions.',
    price: 8500,
    category: 'embroidery',
    sellerId: 's2',
    sellerName: 'Latha Weaves',
    images: ['https://images.unsplash.com/photo-1610030469668-93510cb2801e?auto=format&fit=crop&q=80&w=800'],
    tags: ['silk', 'saree', 'traditional'],
    rating: 4.9,
    reviews: 56,
    story: 'Handcrafted over 15 days using premium Mulberry silk and real gold threads.'
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
  },
  {
    id: '4',
    name: 'Abstract Oil Painting',
    description: 'A vibrant abstract oil painting on high-quality canvas, expressing the beauty of Indian monsoons.',
    price: 4500,
    category: 'paintings',
    sellerId: 's4',
    sellerName: 'Art by Rohan',
    images: ['https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=800'],
    tags: ['abstract', 'canvas', 'wall decor'],
    rating: 4.5,
    reviews: 32,
  },
  {
    id: '5',
    name: 'Bamboo Picnic Basket',
    description: 'Sturdy and eco-friendly picnic basket hand-woven from sustainably sourced bamboo.',
    price: 750,
    category: 'crafts',
    sellerId: 's5',
    sellerName: 'Green Hands',
    images: ['https://images.unsplash.com/photo-1593006526979-5f8814c229f9?auto=format&fit=crop&q=80&w=800'],
    tags: ['bamboo', 'sustainable', 'home'],
    rating: 4.6,
    reviews: 145,
  }
];
