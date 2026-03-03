import Link from 'next/link';
import { normalizeLanguage, translations } from '@/lib/i18n';
import { fetchGameId, fetchSet, fetchSetLocalization } from './set-data';

export const revalidate = 60;

interface SetPageProps {
	params:
		| { game_id: string; set_id: string }
		| Promise<{ game_id: string; set_id: string }>;
}

export default async function SetDetailPage({
	params,
	searchParams,
}: SetPageProps & {
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
							href={`/catalog/${gameSlug}${langParam}`}
							className="text-sm font-semibold text-blue-600 dark:text-blue-400"
						>
							{t.catalog.backToSets}
						</Link>
						<h1 className="mt-3 text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white">
							{displayName ?? 'Set'}
						</h1>
						<p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
							{t.catalog.setOptionsSubtitle}
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
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
							<Link
								href={`/catalog/${gameSlug}/${setSlug}/cards${langParam}`}
								className="group rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm hover:shadow-md transition-shadow"
							>
								<h2 className="text-xl font-semibold text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
									{t.catalog.viewCards}
								</h2>
								<p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
									{t.catalog.cardsSubtitle}
								</p>
							</Link>
							<Link
								href={`/catalog/${gameSlug}/${setSlug}/products${langParam}`}
								className="group rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm hover:shadow-md transition-shadow"
							>
								<h2 className="text-xl font-semibold text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
									{t.catalog.viewProducts}
								</h2>
								<p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
									{t.catalog.productsSubtitle}
								</p>
							</Link>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
