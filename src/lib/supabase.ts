import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.'
    );
  }

  cachedClient = createClient(supabaseUrl, supabaseAnonKey);
  return cachedClient;
}

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient();
    const record = client as unknown as Record<PropertyKey, unknown>;
    const value = record[prop];

    if (typeof value === 'function') {
      return (value as (...args: unknown[]) => unknown).bind(client);
    }

    return value;
  },
}) as SupabaseClient;

export function formatSupabaseError(error: unknown): string {
  if (!error) return 'Unknown error';

  if (error instanceof Error) {
    return error.message || 'Unknown error';
  }

  if (typeof error === 'string') return error;

  if (typeof error === 'object') {
    const record = error as Record<string, unknown>;

    const message =
      typeof record.message === 'string' && record.message
        ? record.message
        : 'Unknown error';

    const code = typeof record.code === 'string' ? record.code : undefined;
    const details =
      typeof record.details === 'string' ? record.details : undefined;
    const hint = typeof record.hint === 'string' ? record.hint : undefined;

    const suffixParts = [code && `code=${code}`, details, hint].filter(
      (part): part is string => Boolean(part)
    );

    return suffixParts.length ? `${message} (${suffixParts.join(' • ')})` : message;
  }

  return 'Unknown error';
}

export function errorForConsole(error: unknown): unknown {
  if (!error) return error;
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  if (typeof error === 'object') {
    try {
      return JSON.parse(
        JSON.stringify(error, Object.getOwnPropertyNames(error as object))
      );
    } catch {
      return error;
    }
  }
  return error;
}

// Database types
export interface CatalogCard {
  id: string;
  name: string
  number: string;
  color_type: string;
  supertype: string;
}

export interface User {
  id: string;
  email: string;
  username?: string;
  created_at: string;
}
