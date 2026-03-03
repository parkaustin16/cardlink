import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import type { Card } from '@/lib/supabase';
import { normalizeLanguage, translations } from '@/lib/i18n';
import { fetchGameId, fetchSet, fetchSetLocalization } from '../set-data';

export const revalidate = 60;

interface SetCardsPageProps {
  params:
    | { game_id: string; set_id: string }
    | Promise<{ game_id: string; set_id: string }>;
}

interface CardListingGroup {
  key: string;
  number: string;
  name: string;
  setCode: string;
  listings: Card[];
}

const fetchCards = async (setId: string): Promise<Card[]> => {
  const { data, error } = await supabase
    .from('cards')
    .select('id, set_id, name, number, set_code, game, rarity, condition, price, image_url')
    .eq('set_id', setId)
    .order('number')
    .order('price');

  if (error || !data) {
    return [];
  }

  return data;
};

const groupCardListings = (cards: Card[]): CardListingGroup[] => {
  const groups = new Map<string, CardListingGroup>();

  for (const card of cards) {
    const number = card.number?.trim() ?? '';
    const name = card.name?.trim() ?? 'Card';
    const setCode = card.set_code?.trim() ?? '';
    const key = `${number}::${name}`.toLowerCase();
    const existing = groups.get(key);

    if (existing) {
      existing.listings.push(card);
      continue;
    }

    groups.set(key, {
      key,
      number,
      name,
      setCode,
      listings: [card],
    });
  }

  return Array.from(groups.values());
};

const getLowestPrice = (listings: Card[]): number | null => {
  const priced = listings
    .map((listing) => listing.price)
    .filter((price): price is number => typeof price === 'number');

  if (priced.length === 0) return null;
  return Math.min(...priced);
};

const formatPrice = (value: number) => `$${value.toFixed(2)}`;

export default async function SetCardsPage({
  params,
  searchParams,
}: SetCardsPageProps & {
  searchParams?:
    | { lang?: string | string[] }
    | Promise<{ lang?: string | string[] }>;
}) {
  const resolvedParams = await Promise.resolve(params);
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const setSlug = resolvedParams.set_id;
  const gameSlug = resolvedParams.game_id;
  const rawLang = Array.isArray(resolvedSearchParams?.lang)
    ? resolvedSearchParams?.lang[0]
    : resolvedSearchParams?.lang;
  const language = normalizeLanguage(rawLang);
  const t = translations[language];
  const gameResult = await fetchGameId(gameSlug);
  const setResult = await fetchSet(gameResult.gameId, setSlug, language);
  const cards = setResult.set
    ? await fetchCards(setResult.set.set_id)
    : [];
  const cardListingGroups = groupCardListings(cards);
  const localizedSetName = setResult.localizedName
    ? setResult.localizedName
    : setResult.set
      ? await fetchSetLocalization(setResult.set.set_id, language)
      : null;
  const errorMessage = gameResult.errorMessage ?? setResult.errorMessage;
  const set = setResult.set;
  const displayName = localizedSetName ?? set?.name;
  const langParam = language === 'en' ? '' : `?lang=${language}`;
  const totalListings = cardListingGroups.reduce(
    (total, group) => total + group.listings.length,
    0
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col gap-8">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8">
            <Link
              href={`/catalog/${gameSlug}/${setSlug}${langParam}`}
              className="text-sm font-semibold text-blue-600 dark:text-blue-400"
            >
              {t.catalog.backToSet}
            </Link>
            <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white">
              {displayName ?? 'Set'} Cards
            </h1>
            <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
              {t.catalog.cardsSubtitle}
            </p>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Cards</p>
                <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-white">
                  {cardListingGroups.length}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Total Listings</p>
                <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-white">
                  {totalListings}
                </p>
              </div>
            </div>
          </div>

          {errorMessage ? (
            <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-6 text-center">
              <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                {t.catalog.setErrorTitle}
              </p>
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {errorMessage}
              </p>
            </div>
          ) : cardListingGroups.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-10 text-center">
              <p className="text-zinc-600 dark:text-zinc-400">
                {t.catalog.cardsEmpty}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
              <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-950/50 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                <div className="col-span-6">Card</div>
                <div className="col-span-2 text-right">Lowest</div>
                <div className="col-span-2 text-right">Listings</div>
                <div className="col-span-2 text-right">Set</div>
              </div>
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {cardListingGroups.map((group) => {
                  const lowestPrice = getLowestPrice(group.listings);

                  return (
                  <div key={group.key} className="px-4 sm:px-6 py-5">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      <div className="md:col-span-6 flex items-center gap-3">
                        <div className="h-14 w-14 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center">
                          {group.listings[0]?.image_url ? (
                            <Image
                              src={group.listings[0].image_url}
                              alt={group.name}
                              width={56}
                              height={56}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">No Image</span>
                          )}
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                            {group.number || 'No Number'}
                          </p>
                          <p className="text-base font-semibold text-zinc-900 dark:text-white">
                            {group.name}
                          </p>
                        </div>
                      </div>

                      <div className="md:col-span-2 md:text-right">
                        <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400 md:hidden">Lowest</p>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                          {lowestPrice === null
                            ? '—'
                            : formatPrice(lowestPrice)}
                        </p>
                      </div>

                      <div className="md:col-span-2 md:text-right">
                        <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400 md:hidden">Listings</p>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                          {group.listings.length}
                        </p>
                      </div>

                      <div className="md:col-span-2 md:text-right">
                        <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400 md:hidden">Set</p>
                        <p className="text-sm text-zinc-700 dark:text-zinc-200">
                          {group.setCode || '—'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Listings
                      </p>
                      <div className="mt-2 divide-y divide-zinc-200 dark:divide-zinc-800">
                        {group.listings.map((listing) => (
                          <div
                            key={listing.id}
                            className="flex items-center justify-between py-2 text-sm gap-4"
                          >
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center rounded-full border border-zinc-300 dark:border-zinc-700 px-2 py-0.5 text-xs text-zinc-600 dark:text-zinc-300">
                                {listing.condition || 'Condition not listed'}
                              </span>
                              {listing.rarity ? (
                                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                  {listing.rarity}
                                </span>
                              ) : null}
                            </div>
                            <span className="font-semibold text-zinc-900 dark:text-white">
                              {formatPrice(listing.price)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
