'use client';

import { useState, useEffect } from 'react';
import { supabase, Card } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import Link from 'next/link';
import Image from 'next/image';

export default function CardDetail() {
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    if (params.id) {
      fetchCard(params.id as string);
    }
  }, [params.id]);

  const fetchCard = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setCard(data);
    } catch (error) {
      console.error('Error fetching card:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!card || !user || card.seller_id !== user.id) return;

    if (!confirm('Are you sure you want to delete this listing?')) return;

    try {
      const { error } = await supabase.from('cards').delete().eq('id', card.id);

      if (error) throw error;
      router.push('/marketplace');
    } catch (error) {
      console.error('Error deleting card:', error);
      alert('Failed to delete card');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-600 dark:text-zinc-400">Card not found</p>
      </div>
    );
  }

  const isOwner = user && card.seller_id === user.id;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/marketplace"
          className="text-blue-600 dark:text-blue-400 mb-4 inline-block"
        >
          ← Back to Marketplace
        </Link>

        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
            <div>
              {card.image_url ? (
                <Image
                  src={card.image_url}
                  alt={card.name}
                  width={500}
                  height={700}
                  className="w-full rounded-lg"
                />
              ) : (
                <div className="w-full h-96 bg-zinc-200 dark:bg-zinc-700 rounded-lg flex items-center justify-center text-zinc-400">
                  No Image
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
                {card.name}
              </h1>

              <div className="mb-4">
                <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-semibold mr-2">
                  {card.game}
                </span>
                <span className="inline-block bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-full text-sm font-semibold">
                  {card.rarity}
                </span>
              </div>

              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-6">
                ${card.price.toFixed(2)}
              </div>

              <div className="mb-4">
                <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Condition
                </h3>
                <p className="text-zinc-900 dark:text-white">{card.condition}</p>
              </div>

              {card.description && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Description
                  </h3>
                  <p className="text-zinc-900 dark:text-white">
                    {card.description}
                  </p>
                </div>
              )}

              <div className="mt-auto pt-6">
                {isOwner ? (
                  <button
                    onClick={handleDelete}
                    className="w-full py-2 px-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
                  >
                    Delete Listing
                  </button>
                ) : (
                  <button className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
                    Contact Seller
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
