import { createClient } from '@supabase/supabase-js';

// 1. Import your types
import { Card, CardSet, Game } from '@/app/types/catalog';

const supabaseUrl = 'https://bvgeaihhvbyguxesdycc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2Z2VhaWhodmJ5Z3V4ZXNkeWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzY5ODgsImV4cCI6MjA4NTYxMjk4OH0.OBIgOHvDZ1Hfwweqhar7uz14gG0RC38JKpV_2gBqfHQ';

// 2. RE-EXPORT the types so other files can import them from here
export type { Card, CardSet, Game };

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'catalog',
  },
});

/**
 * Formats standard Supabase errors into a readable string.
 */
export const formatSupabaseError = (error: any): string => {
  if (!error) return 'An unknown error occurred';
  return error.message || JSON.stringify(error);
};

/**
 * A small utility for logging errors consistently.
 */
export const errorForConsole = (context: string, error: any) => {
  console.error(`[Supabase Error - ${context}]:`, error);
};