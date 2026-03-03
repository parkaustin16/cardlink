'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
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

  const filteredOptions = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) => option.toLowerCase().includes(query));
  }, [options, value]);

  useEffect(() => {
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
  }, []);

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
  const { withLang } = useLanguage();

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
        return;
      }

      setLoadingNames(true);
      const term = formData.itemName.trim();

      if (formData.listingKind === 'single_card') {
        let query = supabase.from('cards').select('id, name, rarity, set_id, game').order('name').limit(50);

        if (formData.setId) query = query.eq('set_id', formData.setId);
        if (selectedGame?.name) query = query.eq('game', selectedGame.name);
        if (term) query = query.ilike('name', `%${term}%`);

        const { data } = await query;
        if (!isMounted) return;

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

        setNameOptions(Array.from(deduped.values()));
      } else {
        let query = supabase
          .from('products')
          .select('id, product_id, name, product_name, set_id')
          .order('name')
          .limit(50);

        if (formData.setId) query = query.eq('set_id', formData.setId);
        if (term) query = query.or(`name.ilike.%${term}%,product_name.ilike.%${term}%`);

        const { data } = await query;
        if (!isMounted) return;

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

        setNameOptions(Array.from(deduped.values()));
      }

      setLoadingNames(false);
    };

    const timer = setTimeout(() => {
      fetchNameOptions();
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [formData.gameId, formData.itemName, formData.listingKind, formData.setId, selectedGame?.name]);

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
  }, [formData.listingKind]);

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
      const selectedName = formData.itemName.trim();
      if (!selectedName) {
        setMarketPrice(null);
        return;
      }

      if (formData.listingKind === 'single_card') {
        let query = supabase.from('cards').select('price').eq('name', selectedName).limit(200);
        if (formData.setId) query = query.eq('set_id', formData.setId);

        const { data } = await query;
        if (!isMounted) return;

        const prices =
          (data as Array<{ price?: number | null }> | null)
            ?.map((row) => row.price)
            .filter((value): value is number => typeof value === 'number') ?? [];

        if (prices.length === 0) {
          setMarketPrice(null);
          return;
        }

        setMarketPrice(prices.reduce((sum, value) => sum + value, 0) / prices.length);
        return;
      }

      let query = supabase
        .from('products')
        .select('price, name, product_name')
        .or(`name.eq.${selectedName},product_name.eq.${selectedName}`)
        .limit(200);

      if (formData.setId) query = query.eq('set_id', formData.setId);

      const { data } = await query;
      if (!isMounted) return;

      const prices =
        (data as Array<{ price?: number | null }> | null)
          ?.map((row) => row.price)
          .filter((value): value is number => typeof value === 'number') ?? [];

      if (prices.length === 0) {
        setMarketPrice(null);
        return;
      }

      setMarketPrice(prices.reduce((sum, value) => sum + value, 0) / prices.length);
    };

    fetchMarketPrice();

    return () => {
      isMounted = false;
    };
  }, [formData.itemName, formData.listingKind, formData.setId]);

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

      setSuccessMessage('Listing created successfully. Redirecting...');
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
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Create a Listing</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Sign in to create listings from anywhere in the catalog flow.
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
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Create a Listing</h2>
      {!compact ? (
        <p className="text-zinc-600 dark:text-zinc-400 mt-1 mb-6">
          Add a card or sealed product listing with pricing and shipping details.
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
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TypeableSelect
              id="listing-game"
              label="Game"
              value={formData.gameLabel}
              onChange={(value) => setFormField('gameLabel', value)}
              options={gameLabels}
              placeholder={loadingGames ? 'Loading games...' : 'Type or pick a game'}
              required
              disabled={loadingGames}
            />

            <TypeableSelect
              id="listing-set"
              label="Set Name"
              value={formData.setLabel}
              onChange={(value) => setFormField('setLabel', value)}
              options={setLabels}
              placeholder={loadingSets ? 'Loading sets...' : 'Type or pick a set'}
              required
              disabled={!formData.gameId || loadingSets}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Product Type</label>
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
                  Single Card
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
                  Sealed Product
                </button>
              </div>
            </div>

            <TypeableSelect
              id="listing-item"
              label="Product/Card Name"
              value={formData.itemName}
              onChange={(value) => setFormField('itemName', value)}
              options={itemLabels}
              placeholder={loadingNames ? 'Loading names...' : 'Type or pick a card/product'}
              required
              disabled={!formData.gameId}
            />
          </div>

          {formData.listingKind === 'single_card' ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TypeableSelect
                  id="listing-rarity"
                  label="Rarity"
                  value={formData.rarity}
                  onChange={(value) => setFormField('rarity', value)}
                  options={rarityOptions}
                  placeholder="Type or pick rarity"
                  required
                />

                <TypeableSelect
                  id="listing-condition"
                  label="Condition"
                  value={formData.condition}
                  onChange={(value) => setFormField('condition', value)}
                  options={[...CONDITION_OPTIONS]}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TypeableSelect
                  id="listing-printing"
                  label="Printing"
                  value={formData.printing}
                  onChange={(value) => setFormField('printing', value)}
                  options={[...PRINTING_OPTIONS]}
                  placeholder="Type or pick printing"
                />

                <TypeableSelect
                  id="listing-language"
                  label="Language"
                  value={formData.language}
                  onChange={(value) => setFormField('language', value)}
                  options={[...LANGUAGE_OPTIONS]}
                  required
                />

                <TypeableSelect
                  id="listing-finish"
                  label="Finish"
                  value={formData.finish}
                  onChange={(value) => setFormField('finish', value)}
                  options={variantOptions}
                  placeholder="Type or pick finish"
                />
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TypeableSelect
                id="listing-language"
                label="Language"
                value={formData.language}
                onChange={(value) => setFormField('language', value)}
                options={[...LANGUAGE_OPTIONS]}
                required
              />
            </div>
          )}

          <div>
            <label htmlFor="listing-quantity" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Quantity
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
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Pricing</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="listing-market-price" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Market Price (auto reference)
              </label>
              <input
                id="listing-market-price"
                type="text"
                readOnly
                value={marketPrice === null ? 'No market reference found' : `$${marketPrice.toFixed(2)}`}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
              />
            </div>

            <div>
              <label htmlFor="listing-sale-price" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Sale Price
              </label>
              <input
                id="listing-sale-price"
                type="number"
                min="0"
                step="0.01"
                value={formData.salePrice}
                onChange={(event) => setFormField('salePrice', event.target.value)}
                placeholder="Required"
                required
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Shipping</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="listing-shipping-cost" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Shipping Cost
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
              label="Shipping Method"
              value={formData.shippingMethod}
              onChange={(value) => setFormField('shippingMethod', value)}
              options={[...SHIPPING_METHOD_OPTIONS]}
              placeholder="Type or pick shipping method"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="listing-handling-time" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Handling Time
              </label>
              <input
                id="listing-handling-time"
                type="text"
                value={formData.handlingTime}
                onChange={(event) => setFormField('handlingTime', event.target.value)}
                placeholder="e.g. 1-2 business days"
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="listing-domestic-shipping"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
              >
                Domestic Shipping Price (placeholder)
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
                International Shipping Price (placeholder)
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
          {loading ? 'Creating listing...' : 'Create a Listing'}
        </button>
      </form>
    </div>
  );
}
