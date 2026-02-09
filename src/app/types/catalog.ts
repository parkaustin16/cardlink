// src/types/catalog.ts

/**
 * catalog.games table
 * The overarching category (e.g., One Piece, Pokemon)
 */
export interface Game {
  game_id: string;
  slug: string;
  name: string; // The primary name of the game
}

/**
 * catalog.set_localizations table
 * Linked to catalog.sets
 */
export interface SetLocalization {
  set_id: string;
  local_set_id: string;
  name: string;
  local_set_slug: string;
  master_set_slug: string;
  language: string;
}

/**
 * catalog.sets table
 * Categories that cards fall into (e.g., Romance Dawn, Base Set)
 */
export interface CardSet {
  set_id: string;
  game_id: string;
  slug: string;
  name: string;           // Base/English name
  code: string;           // e.g., "OP01"
  set_localizations?: SetLocalization[]; // Joined data
}

/**
 * catalog.localizations table
 * Linked to catalog.cards
 */
export interface CardLocalization {
  name: string;
  language: 'kr' | 'en';
}

/**
 * catalog.cards table
 * The specific card information
 */
export interface Card {
  id: string;
  set_id: string;
  name: string;           // Base/English name
  number: string;         // e.g., "OP01-001"
  set_code: string;       // e.g., "OP01"
  game: string;
  rarity: string;
  condition: string;
  price: number;
  image_url?: string | null;
  localizations?: CardLocalization[]; // Joined data
}