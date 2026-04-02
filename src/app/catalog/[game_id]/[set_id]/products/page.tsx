import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/lib/supabase';
import { normalizeLanguage, translations } from '@/lib/i18n';
import {
  fetchGameId,
  fetchSet,
  fetchSetLocalizationDetails,
} from '../set-data';
import ProductBrowser from '@/components/ProductBrowser';
import { getLowestPrice } from '@/lib/catalog-detail';

export const revalidate = 60;

interface SetProductsPageProps {
  params:
    | { game_id: string; set_id: string }
    | Promise<{ game_id: string; set_id: string }>;
}

interface ProductListingGroup {
  key: string;
  slug: string;
  name: string;
  productType: string | null;
  imageUrl: string | null;
  listings: Product[];
}

const fetchProducts = async (setId: string, language: string): Promise<Product[]> => {
  const { data: products, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('set_id', setId);

  if (productError || !products) {
    return [];
  }

  if (language === 'en') {
    return products as Product[];
  }

  const productIds = products
    .map((product: any) => product.product_id)
    .filter((productId: string | null | undefined): productId is string =>
      typeof productId === 'string' && productId.length > 0
    );

  if (productIds.length === 0) {
    return products as Product[];
  }

  const { data: localizations, error: localizationError } = await supabase
    .from('product_localizations')
    .select('product_id, name, product_type, series, local_slug, release_date, language')
    .in('product_id', productIds);

  if (localizationError || !localizations || localizations.length === 0) {
    return products as Product[];
  }

  const localizationsByProductId = new Map<string, Array<Record<string, unknown>>>();

  for (const localization of localizations as Array<Record<string, unknown>>) {
    const productId = localization.product_id;
    if (typeof productId !== 'string' || productId.length === 0) {
      continue;
    }

    const existing = localizationsByProductId.get(productId) ?? [];
    existing.push(localization);
    localizationsByProductId.set(productId, existing);
  }

  return products.map((product: any) => {
    const candidates = localizationsByProductId.get(product.product_id) ?? [];
    const preferredLocalization =
      candidates.find((candidate) => candidate.language === language) ?? candidates[0];

    if (!preferredLocalization) {
      return product;
    }

    return {
      ...product,
      name:
        typeof preferredLocalization.name === 'string'
          ? preferredLocalization.name
          : product.name,
      product_type:
        typeof preferredLocalization.product_type === 'string'
          ? preferredLocalization.product_type
          : product.product_type,
      series:
        typeof preferredLocalization.series === 'string'
          ? preferredLocalization.series
          : product.series,
      local_slug:
        typeof preferredLocalization.local_slug === 'string'
          ? preferredLocalization.local_slug
          : product.local_slug,
      product_slug:
        typeof preferredLocalization.local_slug === 'string'
          ? preferredLocalization.local_slug
          : product.product_slug,
      release_date:
        typeof preferredLocalization.release_date === 'string'
          ? preferredLocalization.release_date
          : product.release_date,
    };
  }) as Product[];
};

const getProductId = (product: Product, index: number) =>
  product.id ?? product.product_id ?? `${index}`;

const getProductSlug = (product: Product, index: number) => {
  const localizedSlug = typeof product.local_slug === 'string' ? product.local_slug.trim() : '';
  const canonicalSlug = typeof product.product_slug === 'string' ? product.product_slug.trim() : '';
  return localizedSlug || canonicalSlug || `${getProductId(product, index)}`;
};

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
      slug: getProductSlug(product, groups.size),
      name,
      productType,
      imageUrl: getProductImage(product),
      listings: [product],
    });
  }

  return Array.from(groups.values());
};

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
    ? await fetchProducts(setResult.set.set_id, language)
    : [];
  const productListingGroups = groupProductListings(products);
  const localizationDetails = setResult.set
    ? await fetchSetLocalizationDetails(setResult.set.set_id, language)
    : { name: null, localSetSlug: null };
  const localizedSetName = setResult.localizedName ?? localizationDetails.name;
  const errorMessage = gameResult.errorMessage ?? setResult.errorMessage;
  const set = setResult.set;
  const displayName = localizedSetName ?? set?.name;
  const langParam = language === 'en' ? '' : `?lang=${language}`;
  const totalListings = productListingGroups.reduce(
    (total, group) => total + group.listings.length,
    0
  );
  const productGroups = productListingGroups.map((group) => {
    const primaryListing = group.listings[0];

    return {
      key: group.key,
      href: `/catalog/${gameSlug}/${setSlug}/products/${encodeURIComponent(group.slug)}${langParam}`,
      name: group.name,
      productType: group.productType,
      imageUrl: group.imageUrl,
      series:
        typeof primaryListing?.series === 'string' ? primaryListing.series : null,
      releaseDate:
        typeof primaryListing?.release_date === 'string'
          ? primaryListing.release_date
          : null,
      lowestPrice: getLowestPrice(group.listings.map((listing) => listing.price)),
      listings: group.listings.map((listing, index) => ({
        id: getProductId(listing, index),
        price: typeof listing.price === 'number' ? listing.price : null,
        productType: getProductType(listing),
      })),
    };
  });

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
              {displayName ?? 'Set'} {t.catalog.productsTitleSuffix}
            </h1>
            <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
              {t.catalog.productsSubtitle}
            </p>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t.catalog.productsTitleSuffix}</p>
                <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-white">
                  {productListingGroups.length}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t.catalog.totalListingsLabel}</p>
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
            <ProductBrowser
              groups={productGroups}
              labels={{
                searchLabel: t.catalog.searchLabel,
                searchPlaceholder: t.catalog.searchProductsPlaceholder,
                filterSeries: t.catalog.filterSeries,
                filterProductType: t.catalog.filterProductType,
                allSeries: t.catalog.allSeries,
                allProductTypes: t.catalog.allProductTypes,
                sortBy: t.catalog.sortBy,
                sortName: t.catalog.sortName,
                sortReleaseNewest: t.catalog.sortReleaseNewest,
                sortReleaseOldest: t.catalog.sortReleaseOldest,
                sortLowestPrice: t.catalog.sortLowestPrice,
                visibleResults: t.catalog.visibleResults,
                productsLabel: t.catalog.productsTitle,
                totalListingsLabel: t.catalog.totalListingsLabel,
                priceLabel: t.catalog.priceLabel,
                emptyMessage: t.catalog.productsEmptyFiltered,
                listingsLabel: t.catalog.listingDetails,
                listingAvailableSingular: t.catalog.listingAvailableSingular,
                listingAvailablePlural: t.catalog.listingAvailablePlural,
                priceUnavailable: t.catalog.noListingPrices,
                sealedProductFallback: t.catalog.sealedProductFallback,
                noImage: t.catalog.noImage,
                fromPrefix: t.catalog.fromPrefix,
                viewGallery: t.catalog.viewGallery,
                viewList: t.catalog.viewList,
                openDetails: t.catalog.openDetails,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
