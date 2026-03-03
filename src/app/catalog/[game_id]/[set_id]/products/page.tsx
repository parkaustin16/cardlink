import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/lib/supabase';
import { normalizeLanguage, translations } from '@/lib/i18n';
import { fetchGameId, fetchSet, fetchSetLocalization } from '../set-data';

export const revalidate = 60;

interface SetProductsPageProps {
  params:
    | { game_id: string; set_id: string }
    | Promise<{ game_id: string; set_id: string }>;
}

interface ProductListingGroup {
  key: string;
  name: string;
  productType: string | null;
  imageUrl: string | null;
  listings: Product[];
}

const fetchProducts = async (setId: string): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('set_id', setId);

  if (error || !data) {
    return [];
  }

  return data as Product[];
};

const getProductId = (product: Product, index: number) =>
  product.id ?? product.product_id ?? `${index}`;

const getProductName = (product: Product) =>
  product.name ?? product.product_name ?? 'Sealed product';

const getProductType = (product: Product): string | null => {
  const candidate = product.product_type ?? product.category ?? product.type;
  return typeof candidate === 'string' && candidate.trim().length > 0
    ? candidate
    : null;
};

const getProductImage = (product: Product): string | null => {
  const candidate = product.image_url;
  return typeof candidate === 'string' && candidate.trim().length > 0
    ? candidate
    : null;
};

const groupProductListings = (products: Product[]): ProductListingGroup[] => {
  const groups = new Map<string, ProductListingGroup>();

  for (const product of products) {
    const name = getProductName(product);
    const productType = getProductType(product);
    const key = `${name}::${productType ?? ''}`.toLowerCase();
    const existing = groups.get(key);

    if (existing) {
      existing.listings.push(product);
      continue;
    }

    groups.set(key, {
      key,
      name,
      productType,
      imageUrl: getProductImage(product),
      listings: [product],
    });
  }

  return Array.from(groups.values());
};

const getLowestPrice = (listings: Product[]): number | null => {
  const priced = listings
    .map((listing) => listing.price)
    .filter((price): price is number => typeof price === 'number');

  if (priced.length === 0) return null;
  return Math.min(...priced);
};

const formatPrice = (value: number) => `$${value.toFixed(2)}`;

export default async function SetProductsPage({
  params,
  searchParams,
}: SetProductsPageProps & {
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
  const products = setResult.set
    ? await fetchProducts(setResult.set.set_id)
    : [];
  const productListingGroups = groupProductListings(products);
  const localizedSetName = setResult.localizedName
    ? setResult.localizedName
    : setResult.set
      ? await fetchSetLocalization(setResult.set.set_id, language)
      : null;
  const errorMessage = gameResult.errorMessage ?? setResult.errorMessage;
  const set = setResult.set;
  const displayName = localizedSetName ?? set?.name;
  const langParam = language === 'en' ? '' : `?lang=${language}`;
  const totalListings = productListingGroups.reduce(
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
              {displayName ?? 'Set'} Products
            </h1>
            <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
              {t.catalog.productsSubtitle}
            </p>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Products</p>
                <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-white">
                  {productListingGroups.length}
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
          ) : productListingGroups.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-10 text-center">
              <p className="text-zinc-600 dark:text-zinc-400">
                {t.catalog.productsEmpty}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {productListingGroups.map((group) => {
                const primaryListing = group.listings[0];
                const lowestPrice = getLowestPrice(group.listings);

                return (
                  <div
                    key={group.key}
                    className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6"
                  >
                    <div className="flex gap-4">
                      <div className="h-20 w-20 flex-shrink-0 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center">
                        {group.imageUrl ? (
                          <Image
                            src={group.imageUrl}
                            alt={group.name}
                            width={80}
                            height={80}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-xs text-zinc-400">No Image</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                          {group.name}
                        </h2>
                        {group.productType ? (
                          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                            {group.productType}
                          </p>
                        ) : null}
                        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                          {group.listings.length} listing{group.listings.length === 1 ? '' : 's'} available
                        </p>
                      </div>
                      {typeof primaryListing?.price === 'number' ? (
                        <div className="text-right">
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            {t.catalog.priceLabel}
                          </p>
                          <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                            {formatPrice(primaryListing.price)}
                          </p>
                          {lowestPrice !== null && lowestPrice !== primaryListing.price ? (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              from {formatPrice(lowestPrice)}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Listings
                      </p>
                      <div className="mt-2 divide-y divide-zinc-200 dark:divide-zinc-800">
                        {group.listings.map((listing, index) => {
                          const price =
                            typeof listing.price === 'number'
                              ? listing.price
                              : null;

                          return (
                            <div
                              key={getProductId(listing, index)}
                              className="flex items-center justify-between py-2 text-sm gap-4"
                            >
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center rounded-full border border-zinc-300 dark:border-zinc-700 px-2 py-0.5 text-xs text-zinc-600 dark:text-zinc-300">
                                  {getProductType(listing) ?? 'Sealed product'}
                                </span>
                              </div>
                              <span className="font-semibold text-zinc-900 dark:text-white">
                                {price === null ? 'Price unavailable' : formatPrice(price)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
