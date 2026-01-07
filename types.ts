
export enum UserRole {
  BUYER = 'BUYER',
  SELLER = 'SELLER',
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  language: string;
  email?: string;
  avatar?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  sellerId: string;
  sellerName: string;
  images: string[];
  tags: string[];
  rating: number;
  reviews: number;
  story?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: 'Packed' | 'Shipped' | 'Out for delivery' | 'Delivered';
  date: string;
  address: string;
}

export interface AIInsights {
  revenue: number[];
  popularCategories: { name: string; value: number }[];
  suggestions: string[];
}
