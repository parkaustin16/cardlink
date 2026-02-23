import Link from 'next/link';
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

export default async function SetProductsPage({
  params,
  searchParams,
}: SetProductsPageProps & { searchParams?: { lang?: string } }) {
  const resolvedParams = await Promise.resolve(params);
  const setSlug = resolvedParams.set_id;
  const gameSlug = resolvedParams.game_id;
  const language = normalizeLanguage(searchParams?.lang);
  const t = translations[language];
  const gameResult = await fetchGameId(gameSlug);
  const setResult = await fetchSet(gameResult.gameId, setSlug, language);
  const products = setResult.set
    ? await fetchProducts(setResult.set.set_id)
    : [];
  const localizedSetName = setResult.localizedName
    ? setResult.localizedName
    : setResult.set
      ? await fetchSetLocalization(setResult.set.set_id, language)
      : null;
  const errorMessage = gameResult.errorMessage ?? setResult.errorMessage;
  const set = setResult.set;
  const displayName = localizedSetName ?? set?.name;
  const langParam = language === 'en' ? '' : `?lang=${language}`;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col gap-8">
          <div>
            <Link
              href={`/catalog/${gameSlug}/${setSlug}${langParam}`}
              className="text-sm font-semibold text-blue-600 dark:text-blue-400"
            >
              {t.catalog.backToSet}
            </Link>
            <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white">
              {displayName ?? 'Set'}
            </h1>
            <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
              {t.catalog.productsSubtitle}
            </p>
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
          ) : products.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-10 text-center">
              <p className="text-zinc-600 dark:text-zinc-400">
                {t.catalog.productsEmpty}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {products.map((product, index) => {
                const productName = getProductName(product);
                const productType = getProductType(product);
                const productImage =
                  typeof product.image_url === 'string'
                    ? product.image_url
                    : null;
                const price =
                  typeof product.price === 'number' ? product.price : null;

                return (
                  <div
                    key={getProductId(product, index)}
                    className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6"
                  >
                    <div className="flex gap-4">
                      <div className="h-20 w-20 flex-shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center">
                        {productImage ? (
                          <img
                            src={productImage}
                            alt={productName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-xs text-zinc-400">No Image</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                          {productName}
                        </h2>
                        {productType ? (
                          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                            {productType}
                          </p>
                        ) : null}
                      </div>
                      {price !== null ? (
                        <div className="text-right">
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            {t.catalog.priceLabel}
                          </p>
                          <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                            ${price.toFixed(2)}
                          </p>
                        </div>
                      ) : null}
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
