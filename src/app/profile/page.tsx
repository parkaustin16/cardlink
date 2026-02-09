'use client';

import { useState, useEffect } from 'react';
import { supabase, Card, formatSupabaseError, errorForConsole } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n-client';
import { User } from '@supabase/supabase-js';
import CardItem from '@/components/CardItem';

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { withLang } = useLanguage();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push(withLang('/auth/login'));
      } else {
        setUser(session.user);
        fetchUserCards(session.user.id);
      }
    });
  }, [router, withLang]);

  const fetchUserCards = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .schema('catalog')
        .from('cards')
        .select('*')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCards(data || []);
    } catch (err) {
      setError(formatSupabaseError(err));
      console.error('Error fetching user cards:', errorForConsole('fetchUserCards', err));
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950" />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
            My Profile
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">{user.email}</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
          My Listings
        </h2>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              You haven&apos;t listed any cards yet.
            </p>
            <Link
              href={withLang('/sell')}
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
            >
              List a Card
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((card) => (
              <CardItem key={card.id} card={card} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
