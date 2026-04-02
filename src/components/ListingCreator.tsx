'use client';

import Link from 'next/link';
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { supabase, formatSupabaseError, errorForConsole } from '@/lib/supabase';
import { useLanguage } from '@/lib/i18n-client';

type ListingKind = 'sealed_product' | 'single_card';

interface GameOption {
  game_id: string;
  name: string;
  slug: string;
}

interface SetOption {
  set_id: string;
  name: string;
  slug: string;
}

interface SearchOption {
  id: string;
  label: string;
  rarity?: string;
}

interface ListingCreatorProps {
  compact?: boolean;
}

interface TypeableSelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

const CONDITION_OPTIONS = ['Near Mint', 'LP', 'MP', 'HP', 'Damaged'] as const;
const PRINTING_OPTIONS = ['1st Ed', 'Unlimited', 'Reverse Holo', 'Promo'] as const;
const LANGUAGE_OPTIONS = ['English', 'Korean', 'Japanese'] as const;
const SHIPPING_METHOD_OPTIONS = [
  'Standard (Placeholder)',
  'Expedited (Placeholder)',
  'Tracked Mail (Placeholder)',
] as const;
const MAX_VISIBLE_OPTIONS = 200;

const useDebouncedValue = <T,>(value: T, delayMs: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debouncedValue;
};

function TypeableSelect({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
  required,
  disabled,
}: TypeableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const deferredValue = useDeferredValue(value);

  const { filteredOptions, totalMatches } = useMemo(() => {
    const query = deferredValue.trim().toLowerCase();

    if (!query) {
      return {
        filteredOptions: options.slice(0, MAX_VISIBLE_OPTIONS),
        totalMatches: options.length,
      };
    }

    const matches: string[] = [];
    let count = 0;

    for (const option of options) {
      if (!option.toLowerCase().includes(query)) continue;
      count += 1;
      if (matches.length < MAX_VISIBLE_OPTIONS) {
        matches.push(option);
      }
    }

    return {
      filteredOptions: matches,
      totalMatches: count,
    };
  }, [options, deferredValue]);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className="relative">
      <label htmlFor={id} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete="off"
          className="w-full px-4 py-2 pr-10 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          disabled={disabled}
          className="absolute inset-y-0 right-0 px-3 text-zinc-500 dark:text-zinc-400"
          aria-label={`Toggle ${label} options`}
        >
          ▾
        </button>
      </div>

      {isOpen && !disabled ? (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg">
          {totalMatches > filteredOptions.length ? (
            <div className="px-3 py-2 text-xs text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-700">
              Showing first {filteredOptions.length} of {totalMatches} options. Type to narrow results.
            </div>
          ) : null}
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">No matches</div>
          ) : (
            <ul className="max-h-56 overflow-y-auto py-1">
              {filteredOptions.map((option) => (
                <li key={option}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(option);
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-zinc-800 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    {option}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function ListingCreator({ compact = false }: ListingCreatorProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingGames, setLoadingGames] = useState(true);
  const [loadingSets, setLoadingSets] = useState(false);
  const [loadingNames, setLoadingNames] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [games, setGames] = useState<GameOption[]>([]);
  const [sets, setSets] = useState<SetOption[]>([]);
  const [nameOptions, setNameOptions] = useState<SearchOption[]>([]);
  const [rarityOptions, setRarityOptions] = useState<string[]>([]);
  const [variantOptions, setVariantOptions] = useState<string[]>([]);
  const [marketPrice, setMarketPrice] = useState<number | null>(null);

  const router = useRouter();
  const { t, withLang } = useLanguage();
  const nameOptionsCacheRef = useRef(new Map<string, SearchOption[]>());
  const marketPriceCacheRef = useRef(new Map<string, number | null>());
  const nameQueryIdRef = useRef(0);
  const marketPriceQueryIdRef = useRef(0);

  const [formData, setFormData] = useState({
    listingKind: 'single_card' as ListingKind,
    gameLabel: '',
    gameId: '',
    setLabel: '',
    setId: '',
    itemName: '',
    rarity: '',
    condition: 'Near Mint',
    printing: '',
    language: 'English',
    finish: '',
    quantity: '1',
    salePrice: '',
    shippingCost: '',
    shippingMethod: '',
    handlingTime: '',
    domesticShippingPrice: '',
    internationalShippingPrice: '',
  });

  const selectedGame = useMemo(
    () => games.find((game) => game.game_id === formData.gameId) ?? null,
    [games, formData.gameId]
  );

  const gameLabels = useMemo(() => games.map((game) => game.name), [games]);
  const setLabels = useMemo(() => sets.map((set) => set.name), [sets]);
  const itemLabels = useMemo(() => nameOptions.map((option) => option.label), [nameOptions]);
  const debouncedItemName = useDebouncedValue(formData.itemName.trim(), 300);
  const selectedNameOption = useMemo(
    () => nameOptions.find((option) => option.label === formData.itemName) ?? null,
    [nameOptions, formData.itemName]
  );

  const setFormField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const parseOptionalNumber = (value: string): number | null => {
    if (!value.trim()) return null;
    const numericValue = Number.parseFloat(value);
    return Number.isFinite(numericValue) ? numericValue : null;
  };

  const parseRequiredInteger = (value: string, fallback = 1): number => {
    const numericValue = Number.parseInt(value, 10);
    if (!Number.isFinite(numericValue) || numericValue < 1) return fallback;
    return numericValue;
  };

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchGames = async () => {
      setLoadingGames(true);
      const { data } = await supabase.from('games').select('game_id, name, slug').order('name');
      if (!isMounted) return;
      setGames((data as GameOption[] | null) ?? []);
      setLoadingGames(false);
    };

    fetchGames();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const selected = games.find((game) => game.name === formData.gameLabel);

    setFormData((prev) => {
      if ((selected?.game_id ?? '') === prev.gameId) return prev;
      return {
        ...prev,
        gameId: selected?.game_id ?? '',
        setLabel: '',
        setId: '',
        itemName: '',
      };
    });
  }, [formData.gameLabel, games]);

  useEffect(() => {
    let isMounted = true;

    const fetchSets = async () => {
      if (!formData.gameId) {
        setSets([]);
        return;
      }

      setLoadingSets(true);
      const { data } = await supabase
        .from('sets')
        .select('set_id, name, slug, code')
        .eq('game_id', formData.gameId)
        .order('code');

      if (!isMounted) return;

      const formatted =
        (data as Array<{ set_id: string; name: string; slug: string; code?: string | null }> | null)?.map((set) => ({
          set_id: set.set_id,
          slug: set.slug,
          name: set.code ? `${set.code} — ${set.name}` : set.name,
        })) ?? [];

      setSets(formatted);
      setLoadingSets(false);
    };

    fetchSets();

    return () => {
      isMounted = false;
    };
  }, [formData.gameId]);

  useEffect(() => {
    const selected = sets.find((set) => set.name === formData.setLabel);

    setFormData((prev) => {
      if ((selected?.set_id ?? '') === prev.setId) return prev;
      return {
        ...prev,
        setId: selected?.set_id ?? '',
        itemName: '',
      };
    });
  }, [formData.setLabel, sets]);

  useEffect(() => {
    let isMounted = true;

    const fetchNameOptions = async () => {
      if (!formData.gameId) {
        setNameOptions([]);
        setLoadingNames(false);
        return;
      }

      const term = debouncedItemName;
      if (term.length > 0 && term.length < 2) {
        setNameOptions([]);
        setLoadingNames(false);
        return;
      }

      const cacheKey = [formData.listingKind, formData.gameId, formData.setId || '-', term.toLowerCase()].join('|');
      const cached = nameOptionsCacheRef.current.get(cacheKey);
      if (cached) {
        setNameOptions(cached);
        setLoadingNames(false);
        return;
      }

      const currentQueryId = ++nameQueryIdRef.current;
      setLoadingNames(true);

      if (formData.listingKind === 'single_card') {
        let query = supabase
          .from('cards')
          .select('id, name, rarity, set_id, game')
          .order('name')
          .limit(term ? 50 : 30);

        if (formData.setId) query = query.eq('set_id', formData.setId);
        if (selectedGame?.name) query = query.eq('game', selectedGame.name);
        if (term) query = query.ilike('name', `%${term}%`);

        const { data } = await query;
        if (!isMounted || currentQueryId !== nameQueryIdRef.current) return;

        const deduped = new Map<string, SearchOption>();
        (data as Array<{ id: string; name: string; rarity?: string | null }> | null)?.forEach((card) => {
          const label = card.name?.trim();
          if (!label) return;
          const key = label.toLowerCase();
          if (!deduped.has(key)) {
            deduped.set(key, {
              id: card.id,
              label,
              rarity: card.rarity ?? undefined,
            });
          }
        });

        const options = Array.from(deduped.values());
        nameOptionsCacheRef.current.set(cacheKey, options);
        setNameOptions(options);
      } else {
        let query = supabase
          .from('products')
          .select('id, product_id, name, product_name, set_id')
          .order('name')
          .limit(term ? 50 : 30);

        if (formData.setId) query = query.eq('set_id', formData.setId);
        if (term) query = query.or(`name.ilike.%${term}%,product_name.ilike.%${term}%`);

        const { data } = await query;
        if (!isMounted || currentQueryId !== nameQueryIdRef.current) return;

        const deduped = new Map<string, SearchOption>();
        (
          data as Array<{
            id?: string | null;
            product_id?: string | null;
            name?: string | null;
            product_name?: string | null;
          }> | null
        )?.forEach((product) => {
          const label = (product.name ?? product.product_name ?? '').trim();
          if (!label) return;
          const key = label.toLowerCase();
          if (!deduped.has(key)) {
            deduped.set(key, {
              id: product.id ?? product.product_id ?? label,
              label,
            });
          }
        });

        const options = Array.from(deduped.values());
        nameOptionsCacheRef.current.set(cacheKey, options);
        setNameOptions(options);
      }

      setLoadingNames(false);
    };

    fetchNameOptions();

    return () => {
      isMounted = false;
    };
  }, [debouncedItemName, formData.gameId, formData.listingKind, formData.setId, selectedGame?.name]);

  useEffect(() => {
    const matched = nameOptions.find((option) => option.label === formData.itemName);
    if (matched?.rarity && formData.listingKind === 'single_card' && !formData.rarity) {
      setFormData((prev) => ({ ...prev, rarity: matched.rarity ?? '' }));
    }
  }, [formData.itemName, formData.listingKind, formData.rarity, nameOptions]);

  useEffect(() => {
    let isMounted = true;

    const fetchRarities = async () => {
      if (formData.listingKind !== 'single_card') {
        setRarityOptions([]);
        return;
      }

      if (rarityOptions.length > 0) {
        return;
      }

      const { data, error: fetchError } = await supabase.from('rarities').select('name').order('name');
      if (!isMounted) return;

      if (!fetchError && data && data.length > 0) {
        setRarityOptions(
          (data as Array<{ name?: string | null }>)
            .map((entry) => entry.name?.trim() ?? '')
            .filter((entry) => entry.length > 0)
        );
        return;
      }

      const { data: cardData } = await supabase.from('cards').select('rarity').not('rarity', 'is', null).limit(200);
      if (!isMounted) return;

      const unique = new Set<string>();
      (cardData as Array<{ rarity?: string | null }> | null)?.forEach((row) => {
        const rarity = row.rarity?.trim();
        if (rarity) unique.add(rarity);
      });
      setRarityOptions(Array.from(unique).sort((a, b) => a.localeCompare(b)));
    };

    fetchRarities();

    return () => {
      isMounted = false;
    };
  }, [formData.listingKind, rarityOptions.length]);

  useEffect(() => {
    let isMounted = true;

    const fetchVariants = async () => {
      const { data, error: fetchError } = await supabase.from('variants').select('name').order('name');
      if (!isMounted) return;

      if (!fetchError && data && data.length > 0) {
        setVariantOptions(
          (data as Array<{ name?: string | null }>)
            .map((entry) => entry.name?.trim() ?? '')
            .filter((entry) => entry.length > 0)
        );
      } else {
        setVariantOptions(['Non-Foil', 'Foil']);
      }
    };

    fetchVariants();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchMarketPrice = async () => {
      const selectedName = selectedNameOption?.label?.trim() ?? '';
      if (!selectedName) {
        setMarketPrice(null);
        return;
      }

      const cacheKey = [formData.listingKind, formData.setId || '-', selectedName.toLowerCase()].join('|');
      if (marketPriceCacheRef.current.has(cacheKey)) {
        setMarketPrice(marketPriceCacheRef.current.get(cacheKey) ?? null);
        return;
      }

      const currentQueryId = ++marketPriceQueryIdRef.current;

      if (formData.listingKind === 'single_card') {
        let query = supabase.from('cards').select('price').eq('name', selectedName).limit(200);
        if (formData.setId) query = query.eq('set_id', formData.setId);

        const { data } = await query;
        if (!isMounted || currentQueryId !== marketPriceQueryIdRef.current) return;

        const prices =
          (data as Array<{ price?: number | null }> | null)
            ?.map((row) => row.price)
            .filter((value): value is number => typeof value === 'number') ?? [];

        if (prices.length === 0) {
          marketPriceCacheRef.current.set(cacheKey, null);
          setMarketPrice(null);
          return;
        }

        const averagePrice = prices.reduce((sum, value) => sum + value, 0) / prices.length;
        marketPriceCacheRef.current.set(cacheKey, averagePrice);
        setMarketPrice(averagePrice);
        return;
      }

      let query = supabase
        .from('products')
        .select('price, name, product_name')
        .or(`name.eq.${selectedName},product_name.eq.${selectedName}`)
        .limit(200);

      if (formData.setId) query = query.eq('set_id', formData.setId);

      const { data } = await query;
      if (!isMounted || currentQueryId !== marketPriceQueryIdRef.current) return;

      const prices =
        (data as Array<{ price?: number | null }> | null)
          ?.map((row) => row.price)
          .filter((value): value is number => typeof value === 'number') ?? [];

      if (prices.length === 0) {
        marketPriceCacheRef.current.set(cacheKey, null);
        setMarketPrice(null);
        return;
      }

      const averagePrice = prices.reduce((sum, value) => sum + value, 0) / prices.length;
      marketPriceCacheRef.current.set(cacheKey, averagePrice);
      setMarketPrice(averagePrice);
    };

    fetchMarketPrice();

    return () => {
      isMounted = false;
    };
  }, [formData.listingKind, formData.setId, selectedNameOption?.label]);

  const tryInsertWithFallbacks = async (
    table: 'cards' | 'products',
    payloads: Array<Record<string, unknown>>
  ) => {
    let lastError: unknown = null;

    for (const payload of payloads) {
      const { error: insertError } = await supabase.schema('catalog').from(table).insert([payload]);
      if (!insertError) return;
      lastError = insertError;
    }

    throw lastError;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (!user) throw new Error('You must be logged in to create a listing');
      if (!formData.gameId) throw new Error('Please choose a game from the dropdown list');
      if (!formData.setId) throw new Error('Please choose a set name from the dropdown list');
      if (!formData.itemName.trim()) throw new Error('Please choose a product/card name');

      const salePrice = parseOptionalNumber(formData.salePrice);
      if (salePrice === null) {
        throw new Error('Sale price is required');
      }

      const quantity = parseRequiredInteger(formData.quantity, 1);
      const shippingCost = parseOptionalNumber(formData.shippingCost);
      const domesticShippingPrice = parseOptionalNumber(formData.domesticShippingPrice);
      const internationalShippingPrice = parseOptionalNumber(formData.internationalShippingPrice);

      if (formData.listingKind === 'single_card') {
        if (!formData.rarity.trim()) throw new Error('Please select a rarity for card listings');

        const detailedPayload: Record<string, unknown> = {
          name: formData.itemName.trim(),
          set_id: formData.setId,
          game: selectedGame?.name,
          rarity: formData.rarity,
          condition: formData.condition,
          price: salePrice,
          seller_id: user.id,
          quantity,
          printing: formData.printing || null,
          language: formData.language,
          finish: formData.finish || null,
          shipping_cost: shippingCost,
          shipping_method: formData.shippingMethod || null,
          handling_time: formData.handlingTime || null,
          domestic_shipping_price: domesticShippingPrice,
          international_shipping_price: internationalShippingPrice,
          market_price: marketPrice,
          sale_price: salePrice,
          listing_type: 'single_card',
        };

        const fallbackPayload: Record<string, unknown> = {
          name: formData.itemName.trim(),
          set_id: formData.setId,
          game: selectedGame?.name,
          rarity: formData.rarity,
          condition: formData.condition,
          price: salePrice,
          seller_id: user.id,
        };

        await tryInsertWithFallbacks('cards', [detailedPayload, fallbackPayload]);
      } else {
        const detailedPayload: Record<string, unknown> = {
          name: formData.itemName.trim(),
          product_name: formData.itemName.trim(),
          set_id: formData.setId,
          product_type: 'sealed_product',
          condition: formData.condition,
          price: salePrice,
          seller_id: user.id,
          quantity,
          printing: formData.printing || null,
          language: formData.language,
          finish: formData.finish || null,
          shipping_cost: shippingCost,
          shipping_method: formData.shippingMethod || null,
          handling_time: formData.handlingTime || null,
          domestic_shipping_price: domesticShippingPrice,
          international_shipping_price: internationalShippingPrice,
          market_price: marketPrice,
          sale_price: salePrice,
          listing_type: 'sealed_product',
        };

        const fallbackPayload: Record<string, unknown> = {
          name: formData.itemName.trim(),
          product_name: formData.itemName.trim(),
          set_id: formData.setId,
          product_type: 'sealed_product',
          price: salePrice,
          seller_id: user.id,
        };

        await tryInsertWithFallbacks('products', [detailedPayload, fallbackPayload]);
      }

      setSuccessMessage(t.listing.success);
      setTimeout(() => {
        router.push(withLang('/catalog'));
      }, 900);
    } catch (err) {
      setError(formatSupabaseError(err));
      errorForConsole('createListing', err);
    } finally {
      setLoading(false);
    }
  };

  const containerClass = compact
    ? 'rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6'
    : 'bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8';

  if (!user) {
    return (
      <div className={containerClass}>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">{t.listing.title}</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {t.listing.signInPrompt}
        </p>
        <Link
          href={withLang('/auth/login')}
          className="inline-block mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">{t.listing.title}</h2>
      {!compact ? (
        <p className="text-zinc-600 dark:text-zinc-400 mt-1 mb-6">
          {t.listing.subtitle}
        </p>
      ) : null}

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">{error}</div>
      )}
      {successMessage && (
        <div className="mb-4 p-3 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 mt-4">
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{t.listing.details}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TypeableSelect
              id="listing-game"
              label={t.listing.game}
              value={formData.gameLabel}
              onChange={(value) => setFormField('gameLabel', value)}
              options={gameLabels}
              placeholder={loadingGames ? t.listing.loadingGames : t.listing.pickGame}
              required
              disabled={loadingGames}
            />

            <TypeableSelect
              id="listing-set"
              label={t.listing.setName}
              value={formData.setLabel}
              onChange={(value) => setFormField('setLabel', value)}
              options={setLabels}
              placeholder={loadingSets ? t.listing.loadingSets : t.listing.pickSet}
              required
              disabled={!formData.gameId || loadingSets}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t.listing.productType}</label>
              <div className="inline-flex w-full rounded-lg border border-zinc-300 dark:border-zinc-700 overflow-hidden">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      listingKind: 'single_card',
                      itemName: '',
                    }))
                  }
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                    formData.listingKind === 'single_card'
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {t.listing.singleCard}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      listingKind: 'sealed_product',
                      itemName: '',
                      rarity: '',
                      condition: 'Near Mint',
                      printing: '',
                      finish: '',
                    }))
                  }
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                    formData.listingKind === 'sealed_product'
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {t.listing.sealedProduct}
                </button>
              </div>
            </div>

            <TypeableSelect
              id="listing-item"
              label={t.listing.itemName}
              value={formData.itemName}
              onChange={(value) => setFormField('itemName', value)}
              options={itemLabels}
              placeholder={loadingNames ? t.listing.loadingNames : t.listing.pickItem}
              required
              disabled={!formData.gameId}
            />
          </div>

          {formData.listingKind === 'single_card' ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TypeableSelect
                  id="listing-rarity"
                  label={t.listing.rarity}
                  value={formData.rarity}
                  onChange={(value) => setFormField('rarity', value)}
                  options={rarityOptions}
                  placeholder={t.listing.pickRarity}
                  required
                />

                <TypeableSelect
                  id="listing-condition"
                  label={t.listing.condition}
                  value={formData.condition}
                  onChange={(value) => setFormField('condition', value)}
                  options={[...CONDITION_OPTIONS]}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TypeableSelect
                  id="listing-printing"
                  label={t.listing.printing}
                  value={formData.printing}
                  onChange={(value) => setFormField('printing', value)}
                  options={[...PRINTING_OPTIONS]}
                  placeholder={t.listing.pickPrinting}
                />

                <TypeableSelect
                  id="listing-language"
                  label={t.listing.language}
                  value={formData.language}
                  onChange={(value) => setFormField('language', value)}
                  options={[...LANGUAGE_OPTIONS]}
                  required
                />

                <TypeableSelect
                  id="listing-finish"
                  label={t.listing.finish}
                  value={formData.finish}
                  onChange={(value) => setFormField('finish', value)}
                  options={variantOptions}
                  placeholder={t.listing.pickFinish}
                />
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TypeableSelect
                id="listing-language"
                label={t.listing.language}
                value={formData.language}
                onChange={(value) => setFormField('language', value)}
                options={[...LANGUAGE_OPTIONS]}
                required
              />
            </div>
          )}

          <div>
            <label htmlFor="listing-quantity" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              {t.listing.quantity}
            </label>
            <input
              id="listing-quantity"
              type="number"
              min="1"
              step="1"
              value={formData.quantity}
              onChange={(event) => setFormField('quantity', event.target.value)}
              required
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white"
            />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{t.listing.pricing}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="listing-market-price" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {t.listing.marketPrice}
              </label>
              <input
                id="listing-market-price"
                type="text"
                readOnly
                value={marketPrice === null ? t.listing.noMarketReference : `$${marketPrice.toFixed(2)}`}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
              />
            </div>

            <div>
              <label htmlFor="listing-sale-price" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {t.listing.salePrice}
              </label>
              <input
                id="listing-sale-price"
                type="number"
                min="0"
                step="0.01"
                value={formData.salePrice}
                onChange={(event) => setFormField('salePrice', event.target.value)}
                placeholder={t.listing.required}
                required
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{t.listing.shipping}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="listing-shipping-cost" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {t.listing.shippingCost}
              </label>
              <input
                id="listing-shipping-cost"
                type="number"
                min="0"
                step="0.01"
                value={formData.shippingCost}
                onChange={(event) => setFormField('shippingCost', event.target.value)}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white"
              />
            </div>

            <TypeableSelect
              id="listing-shipping-method"
              label={t.listing.shippingMethod}
              value={formData.shippingMethod}
              onChange={(value) => setFormField('shippingMethod', value)}
              options={[...SHIPPING_METHOD_OPTIONS]}
              placeholder={t.listing.pickShippingMethod}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="listing-handling-time" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {t.listing.handlingTime}
              </label>
              <input
                id="listing-handling-time"
                type="text"
                value={formData.handlingTime}
                onChange={(event) => setFormField('handlingTime', event.target.value)}
                placeholder={t.listing.handlingTimePlaceholder}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="listing-domestic-shipping"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
              >
                {t.listing.domesticShippingPrice}
              </label>
              <input
                id="listing-domestic-shipping"
                type="number"
                min="0"
                step="0.01"
                value={formData.domesticShippingPrice}
                onChange={(event) => setFormField('domesticShippingPrice', event.target.value)}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="listing-international-shipping"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
              >
                {t.listing.internationalShippingPrice}
              </label>
              <input
                id="listing-international-shipping"
                type="number"
                min="0"
                step="0.01"
                value={formData.internationalShippingPrice}
                onChange={(event) => setFormField('internationalShippingPrice', event.target.value)}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white"
              />
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t.listing.creating : t.listing.title}
        </button>
      </form>
    </div>
  );
}
