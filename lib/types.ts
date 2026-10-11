export type Category = { id: string; name: string; slug: string; sort: number };

export type Product = {
  id: string;
  slug: string;
  title: string;
  brand: string | null;
  model: string | null;
  description: string | null;
  category_id: string;
  price_aed: number;
  compare_at_price: number | null;
  condition: 'new' | 'like-new' | 'good' | 'fair' | null;
  specs: Record<string, string> | null;
  quantity: number;
  is_unique: boolean;
  status: 'draft' | 'active' | 'sold' | 'archived';
  images: string[];
  source: 'manual' | 'instagram';
  ig_post_url: string | null;
  created_at: string;
  categories?: Category;
};

export type CartItem = {
  id: string;
  slug: string;
  title: string;
  price_aed: number;
  image: string | null;
  qty: number;
  max_qty: number;
  /** Set by the live stock check: sold out or no longer in the shop. */
  unavailable?: boolean;
};

export type Order = {
  id: string;
  stripe_session_id: string;
  customer_email: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  shipping: Record<string, unknown> | null;
  items: { id: string; title: string; qty: number; price_aed: number }[];
  amount_aed: number;
  status: 'paid' | 'fulfilled' | 'cancelled';
  created_at: string;
  // Added by supabase/UPGRADE-CHECKOUT.sql (absent on databases not yet upgraded).
  hold_id?: string | null;
  stripe_payment_intent?: string | null;
  restocked?: boolean;
};
