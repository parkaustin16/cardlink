import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Card {
  id: string;
  name: string;
  description: string;
  game: string;
  rarity: string;
  condition: string;
  price: number;
  image_url?: string;
  seller_id: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  username?: string;
  created_at: string;
}
