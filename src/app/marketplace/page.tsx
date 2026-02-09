'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, Card, formatSupabaseError, errorForConsole } from '@/lib/supabase';
import CardItem from '@/components/CardItem';

export default function Marketplace() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [gameFilter, setGameFilter] = useState('');
  const [rarityFilter, setRarityFilter] = useState('');

  const fetchCards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let query = supabase
        .schema('catalog')
        .from('cards')
        .select('*')
        .order('created_at', { ascending: false });

      if (gameFilter) {
        query = query.eq('name', gameFilter);
      }

      if (rarityFilter) {
        query = query.eq('rarity', rarityFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCards(data || []);
    } catch (err) {
      setError(formatSupabaseError(err));
      console.error('Error fetching cards:', errorForConsole(err));
    } finally {
      setLoading(false);
    }
  }, [gameFilter, rarityFilter]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const filteredCards = cards.filter((card) =>
    card.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-8">
          Marketplace
        </h1>

        {error && (
          <div className="mb-6 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Search cards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
          />
          <select
            value={gameFilter}
            onChange={(e) => setGameFilter(e.target.value)}
            className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
          >
            <option value="">All Games</option>
            <option value="Magic: The Gathering">Magic: The Gathering</option>
            <option value="Pokemon">Pokemon</option>
            <option value="Yu-Gi-Oh!">Yu-Gi-Oh!</option>
            <option value="Other">Other</option>
          </select>
          <select
            value={rarityFilter}
            onChange={(e) => setRarityFilter(e.target.value)}
            className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
          >
            <option value="">All Rarities</option>
            <option value="Common">Common</option>
            <option value="Uncommon">Uncommon</option>
            <option value="Rare">Rare</option>
            <option value="Mythic">Mythic</option>
            <option value="Legendary">Legendary</option>
          </select>
        </div>

        {/* Cards Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-zinc-600 dark:text-zinc-400">Loading cards...</p>
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-600 dark:text-zinc-400">
              No cards found. Be the first to list a card!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredCards.map((card) => (
              <CardItem key={card.id} card={card} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
