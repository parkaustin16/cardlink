import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { CardSet, Game } from '@/lib/supabase';
import { normalizeLanguage, type Language } from '@/lib/i18n';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface GamePageProps {
	params: { game_id: string } | Promise<{ game_id: string }>;
}

const fetchGame = async (
	gameSlug: string
): Promise<{ game: Game | null; errorMessage: string | null }> => {
	const normalizedSlug = gameSlug?.trim();
	if (!normalizedSlug || normalizedSlug === 'undefined') {
		return {
			game: null,
			errorMessage: 'Missing game slug in URL',
		};
	}

	const { data: slugData, error: slugError } = await supabase
		.from('games')
		.select('game_id, name, slug')
		.ilike('slug', `${normalizedSlug}%`)
		.maybeSingle();

	if (slugError) {
		return {
			game: null,
			errorMessage: slugError.message,
		};
	}

	if (slugData) {
		return { game: slugData, errorMessage: null };
	}

	const isUuid =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
			normalizedSlug
		);

	if (!isUuid) {
		return {
			game: null,
			errorMessage: 'No game found for this slug or id',
		};
	}

	const { data: idData, error: idError } = await supabase
		.from('games')
		.select('game_id, name, slug')
		.eq('game_id', normalizedSlug)
		.maybeSingle();

	if (idError) {
		return {
			game: null,
			errorMessage: idError.message,
		};
	}

	if (!idData) {
		return {
			game: null,
			errorMessage: 'No game found for this slug or id',
		};
	}

	return { game: idData, errorMessage: null };
};

const fetchSets = async (
	gameId: string | null,
	language: Language
): Promise<{
	sets: CardSet[];
	localizations: Record<string, { name: string; localSetSlug?: string }>;
	errorMessage: string | null;
}> => {
	if (!gameId) {
		return {
			sets: [],
			localizations: {},
			errorMessage: 'Missing game_id for sets query',
		};
	}

	const { data, error } = await supabase
		.from('sets')
		.select('set_id, game_id, name, code, slug')
		.eq('game_id', gameId)
		.order('code');

	if (error || !data) {
		return {
			sets: [],
			localizations: {},
			errorMessage: error?.message ?? 'Unknown error fetching sets',
		};
	}

	if (language === 'en' || data.length === 0) {
		return {
			sets: data,
			localizations: {},
			errorMessage: null,
		};
	}

	const setIds = data.map((set) => set.set_id);
	const { data: localizationData, error: localizationError } = await supabase
		.from('set_localizations')
		.select('set_id, name, language, local_set_slug, master_set_slug')
		.eq('language', language)
		.in('set_id', setIds);

	console.log('[catalog] set_localizations fetch', {
		language,
		setCount: setIds.length,
		localizationCount: localizationData?.length ?? 0,
		error: localizationError?.message ?? null,
	});

	if (localizationError || !localizationData) {
		return {
			sets: data,
			localizations: {},
			errorMessage: null,
		};
	}

	const localizations = localizationData.reduce<
		Record<string, { name: string; localSetSlug?: string }>
	>(
		(acc, localization) => {
			acc[localization.set_id] = {
				name: localization.name,
				localSetSlug: localization.local_set_slug ?? undefined,
			};
			return acc;
		},
		{}
	);

	return { sets: data, localizations, errorMessage: null };
};

export default async function GameDetailPage({
	params,
	searchParams,
}: GamePageProps & {
	searchParams?: { lang?: string | string[] } | Promise<{ lang?: string | string[] }>;
}) {
	const resolvedParams = await Promise.resolve(params);
	const resolvedSearchParams = await Promise.resolve(searchParams);
	const gameSlug = resolvedParams.game_id;
	const rawLang = Array.isArray(resolvedSearchParams?.lang)
		? resolvedSearchParams?.lang[0]
		: resolvedSearchParams?.lang;
	const language = normalizeLanguage(rawLang);
	const gameResult = await fetchGame(gameSlug);
	const setsResult = await fetchSets(
		gameResult.game?.game_id ?? null,
		language
	);

	const { game, errorMessage: gameError } = gameResult;
	const { sets, localizations, errorMessage: setsError } = setsResult;
	const langParam = language === 'en' ? '' : `?lang=${language}`;

	return (
		<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
				<div className="flex flex-col gap-8">
					<div>
						<Link
							href={`/catalog${langParam}`}
							className="text-sm font-semibold text-blue-600 dark:text-blue-400"
						>
							Back to Catalog
						</Link>
						<h1 className="mt-3 text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white">
							{game?.name ?? 'Game'} Sets
						</h1>
						<p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
							Select a set to browse the cards.
						</p>
					</div>

					{gameError || setsError ? (
						<div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-6 text-center">
							<p className="text-sm font-semibold text-red-700 dark:text-red-300">
								Unable to load sets
							</p>
							<p className="mt-2 text-sm text-red-600 dark:text-red-400">
								{gameError ?? setsError}
							</p>
							<p className="mt-2 text-xs text-red-500 dark:text-red-400">
								slug: {gameSlug}
							</p>
						</div>
					) : sets.length === 0 ? (
						<div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-10 text-center">
							<p className="text-zinc-600 dark:text-zinc-400">
								No sets have been added for this game yet.
							</p>
						</div>
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
							{sets.map((set) => {
								const setSlug = set.slug?.trim() ?? '';
								const localization = localizations[set.set_id];
								const setName =
									language === 'en'
										? set.name
										: localization?.name ?? set.name;
								const localizedSlug = localization?.localSetSlug?.trim();
								const hrefSlug =
									language === 'en' || !localizedSlug
										? setSlug
										: localizedSlug;

								return (
									<Link
										key={set.set_id}
										href={`/catalog/${gameSlug}/${hrefSlug}${langParam}`}
										className="group rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm hover:shadow-md transition-shadow"
									>
										<p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
											{set.code}
										</p>
										<h2 className="mt-2 text-xl font-semibold text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
											{setName}
										</h2>
									</Link>
								);
							})}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
