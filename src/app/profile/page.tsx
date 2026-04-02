'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { supabase, Card, formatSupabaseError, errorForConsole } from '@/lib/supabase';
import { useLanguage } from '@/lib/i18n-client';
import CardItem from '@/components/CardItem';

interface RatingSummary {
  average: number | null;
  count: number;
}

interface ProfileSettings {
  emailNotifications: boolean;
  marketingEmails: boolean;
  publicProfile: boolean;
}

const defaultSettings: ProfileSettings = {
  emailNotifications: true,
  marketingEmails: false,
  publicProfile: true,
};

const renderStars = (value: number | null) => {
  const filled = Math.round(value ?? 0);
  return Array.from({ length: 5 }, (_, index) => (index < filled ? '★' : '☆')).join(' ');
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [sellerRating, setSellerRating] = useState<RatingSummary>({ average: null, count: 0 });
  const [buyerRating, setBuyerRating] = useState<RatingSummary>({ average: null, count: 0 });
  const [settings, setSettings] = useState<ProfileSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

  const router = useRouter();
  const { t, withLang } = useLanguage();

  const listingStats = useMemo(() => {
    const totalListings = cards.length;
    const totalInventory = cards.reduce((sum, card) => {
      const maybeQuantity = (card as unknown as { quantity?: unknown }).quantity;
      const quantity = typeof maybeQuantity === 'number'
        ? maybeQuantity
        : 1;
      return sum + quantity;
    }, 0);

    const averagePrice =
      totalListings === 0
        ? null
        : cards.reduce((sum, card) => sum + (typeof card.price === 'number' ? card.price : 0), 0) / totalListings;

    return { totalListings, totalInventory, averagePrice };
  }, [cards]);

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (!session?.user) {
          router.push(withLang('/auth/login'));
          return;
        }

        setUser(session.user);

        const metadata = (session.user.user_metadata ?? {}) as Record<string, unknown>;
        setSettings({
          emailNotifications:
            typeof metadata.emailNotifications === 'boolean'
              ? metadata.emailNotifications
              : defaultSettings.emailNotifications,
          marketingEmails:
            typeof metadata.marketingEmails === 'boolean'
              ? metadata.marketingEmails
              : defaultSettings.marketingEmails,
          publicProfile:
            typeof metadata.publicProfile === 'boolean'
              ? metadata.publicProfile
              : defaultSettings.publicProfile,
        });

        await Promise.all([
          fetchUserListings(session.user.id, isMounted),
          fetchRatingSummary(session.user.id, 'seller', isMounted),
          fetchRatingSummary(session.user.id, 'buyer', isMounted),
        ]);
      } catch (err) {
        if (!isMounted) return;
        setError(formatSupabaseError(err));
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, [router, withLang]);

  const fetchUserListings = async (userId: string, isMounted: boolean) => {
    try {
      const { data, error: queryError } = await supabase
        .from('cards')
        .select('id, set_id, name, number, set_code, game, rarity, condition, price, image_url')
        .eq('seller_id', userId)
        .order('id', { ascending: false })
        .limit(120);

      if (!isMounted) return;

      if (queryError) {
        console.warn('[profile] listings query failed', queryError.message);
        setCards([]);
        return;
      }

      setCards((data as Card[] | null) ?? []);
    } catch (err) {
      if (!isMounted) return;
      console.warn('[profile] listings fetch threw', err);
      setCards([]);
    }
  };

  const fetchRatingSummary = async (
    userId: string,
    role: 'seller' | 'buyer',
    isMounted: boolean
  ) => {
    const table = role === 'seller' ? 'seller_ratings' : 'buyer_ratings';
    const userField = role === 'seller' ? 'seller_id' : 'buyer_id';

    try {
      const { data, error: ratingsError } = await supabase
        .from(table)
        .select('rating')
        .eq(userField, userId);

      if (!isMounted) return;

      if (ratingsError || !data) {
        if (role === 'seller') {
          setSellerRating({ average: null, count: 0 });
        } else {
          setBuyerRating({ average: null, count: 0 });
        }
        return;
      }

      const ratings = (data as Array<{ rating?: number | null }>)
        .map((entry) => entry.rating)
        .filter((entry): entry is number => typeof entry === 'number' && Number.isFinite(entry));

      const summary: RatingSummary = {
        average: ratings.length > 0 ? ratings.reduce((sum, item) => sum + item, 0) / ratings.length : null,
        count: ratings.length,
      };

      if (role === 'seller') {
        setSellerRating(summary);
      } else {
        setBuyerRating(summary);
      }
    } catch (err) {
      if (!isMounted) return;
      if (role === 'seller') {
        setSellerRating({ average: null, count: 0 });
      } else {
        setBuyerRating({ average: null, count: 0 });
      }
      console.warn(`[profile] ${role} ratings fetch failed`, err);
    }
  };

  const updateSetting = (field: keyof ProfileSettings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const saveSettings = async () => {
    if (!user) return;

    setSavingSettings(true);
    setSettingsMessage(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          emailNotifications: settings.emailNotifications,
          marketingEmails: settings.marketingEmails,
          publicProfile: settings.publicProfile,
        },
      });

      if (updateError) throw updateError;

      setSettingsMessage('Settings saved successfully.');
    } catch (err) {
      setSettingsMessage(formatSupabaseError(err));
      errorForConsole('saveProfileSettings', err);
    } finally {
      setSavingSettings(false);
    }
  };

  if (!user) {
    return <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950" />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <section className="bg-white dark:bg-zinc-800 rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">My Profile</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">{user.email}</p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Total Listings</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-white">{listingStats.totalListings}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Inventory Units</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-white">{listingStats.totalInventory}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Average Listing Price</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-white">
                {listingStats.averagePrice === null ? '—' : `$${listingStats.averagePrice.toFixed(2)}`}
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Seller Rating</h2>
            <p className="mt-3 text-2xl text-amber-500">{renderStars(sellerRating.average)}</p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {sellerRating.average === null
                ? 'No seller ratings yet.'
                : `${sellerRating.average.toFixed(2)} / 5 from ${sellerRating.count} review${sellerRating.count === 1 ? '' : 's'}`}
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Buyer Rating</h2>
            <p className="mt-3 text-2xl text-amber-500">{renderStars(buyerRating.average)}</p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {buyerRating.average === null
                ? 'No buyer ratings yet.'
                : `${buyerRating.average.toFixed(2)} / 5 from ${buyerRating.count} review${buyerRating.count === 1 ? '' : 's'}`}
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Personal Information</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500 dark:text-zinc-400">Email</dt>
                <dd className="text-zinc-900 dark:text-white text-right break-all">{user.email}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500 dark:text-zinc-400">Account ID</dt>
                <dd className="text-zinc-900 dark:text-white text-right">{user.id.slice(0, 8)}...</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500 dark:text-zinc-400">Joined</dt>
                <dd className="text-zinc-900 dark:text-white text-right">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                </dd>
              </div>
            </dl>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={withLang('/auth/forgot-password')}
                className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700"
              >
                Change Password
              </Link>
              <Link
                href={withLang('/sell')}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
              >
                {t.nav.sellCard}
              </Link>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Settings</h2>
            <div className="mt-4 space-y-3">
              <label className="flex items-center justify-between gap-4">
                <span className="text-sm text-zinc-700 dark:text-zinc-200">Email notifications</span>
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(event) => updateSetting('emailNotifications', event.target.checked)}
                  className="h-4 w-4"
                />
              </label>
              <label className="flex items-center justify-between gap-4">
                <span className="text-sm text-zinc-700 dark:text-zinc-200">Marketing emails</span>
                <input
                  type="checkbox"
                  checked={settings.marketingEmails}
                  onChange={(event) => updateSetting('marketingEmails', event.target.checked)}
                  className="h-4 w-4"
                />
              </label>
              <label className="flex items-center justify-between gap-4">
                <span className="text-sm text-zinc-700 dark:text-zinc-200">Public profile visibility</span>
                <input
                  type="checkbox"
                  checked={settings.publicProfile}
                  onChange={(event) => updateSetting('publicProfile', event.target.checked)}
                  className="h-4 w-4"
                />
              </label>
            </div>

            <button
              onClick={saveSettings}
              disabled={savingSettings}
              className="mt-5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {savingSettings ? 'Saving...' : 'Save Settings'}
            </button>

            {settingsMessage ? (
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">{settingsMessage}</p>
            ) : null}
          </div>
        </section>

        <section className="bg-white dark:bg-zinc-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">My Listings</h2>

          {error ? (
            <div className="mb-6 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="text-center py-10">
              <p className="text-zinc-600 dark:text-zinc-400">Loading profile...</p>
            </div>
          ) : cards.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">You haven&apos;t listed any cards yet.</p>
              <Link
                href={withLang('/sell')}
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
              >
                {t.nav.sellCard}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {cards.map((card) => (
                <CardItem key={card.id} card={card} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
