import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Card, CardSet } from '@/lib/supabase';
import { normalizeLanguage, type Language } from '@/lib/i18n';

export const revalidate = 60;

interface SetPageProps {
	params:
		| { game_id: string; set_id: string }
		| Promise<{ game_id: string; set_id: string }>;
}

const fetchGameId = async (
	gameSlug: string
): Promise<{ gameId: string | null; errorMessage: string | null }> => {
	const normalizedSlug = gameSlug?.trim();
	if (!normalizedSlug || normalizedSlug === 'undefined') {
		return {
			gameId: null,
			errorMessage: 'Missing game slug in URL',
		};
	}

	const { data: slugData, error: slugError } = await supabase
		.from('games')
		.select('game_id')
		.ilike('slug', `${normalizedSlug}%`)
		.maybeSingle();

	if (slugError) {
		return {
			gameId: null,
			errorMessage: slugError.message,
		};
	}

	if (slugData) {
		return { gameId: slugData.game_id, errorMessage: null };
	}

	const isUuid =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
			normalizedSlug
		);

	if (!isUuid) {
		return {
			gameId: null,
			errorMessage: 'No game found for this slug or id',
		};
	}

	const { data: idData, error: idError } = await supabase
		.from('games')
		.select('game_id')
		.eq('game_id', normalizedSlug)
		.maybeSingle();

	if (idError) {
		return {
			gameId: null,
			errorMessage: idError.message,
		};
	}

	if (!idData) {
		return {
			gameId: null,
			errorMessage: 'No game found for this slug or id',
		};
	}

	return { gameId: idData.game_id, errorMessage: null };
};

const fetchSet = async (
	gameId: string | null,
	setSlug: string
): Promise<{ set: CardSet | null; errorMessage: string | null }> => {
	const normalizedSlug = setSlug?.trim();
	if (!normalizedSlug || normalizedSlug === 'undefined') {
		return {
			set: null,
			errorMessage: 'Missing set slug in URL',
		};
	}

	if (!gameId) {
		return {
			set: null,
			errorMessage: 'Missing game_id for set query',
		};
	}

	const { data, error } = await supabase
		.from('sets')
		.select('set_id, game_id, name, code, slug')
		.eq('game_id', gameId)
		.ilike('slug', `${normalizedSlug}%`)
		.single();

	if (error || !data) {
		return {
			set: null,
			errorMessage: error?.message ?? 'Unknown error fetching set',
		};
	}

	return { set: data, errorMessage: null };
};

const fetchCards = async (setId: string): Promise<Card[]> => {
	const { data, error } = await supabase
		.from('cards')
		.select('id, set_id, name, number, set_code')
		.eq('set_id', setId)
		.order('number');

	if (error || !data) {
		return [];
	}

	return data;
};

const fetchSetLocalization = async (
	setId: string,
	language: Language
): Promise<string | null> => {
	if (language === 'en') return null;

	const { data, error } = await supabase
		.from('set_localizations')
		.select('name, language')
		.eq('set_id', setId)
		.eq('language', language)
		.maybeSingle();

	if (error || !data) {
		return null;
	}

	return data.name;
};

export default async function SetDetailPage({
	params,
	searchParams,
}: SetPageProps & { searchParams?: { lang?: string } }) {
	const resolvedParams = await Promise.resolve(params);
	const setSlug = resolvedParams.set_id;
	const gameSlug = resolvedParams.game_id;
	const language = normalizeLanguage(searchParams?.lang);
	const gameResult = await fetchGameId(gameSlug);
	const setResult = await fetchSet(gameResult.gameId, setSlug);
	const cards = setResult.set
		? await fetchCards(setResult.set.set_id)
		: [];
	const localizedSetName = setResult.set
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
							Back to Sets
						</Link>
						<h1 className="mt-3 text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white">
							{displayName ?? 'Set'} Cards
						</h1>
						<p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
							Browse all cards in this set.
						</p>
					</div>

					{errorMessage ? (
						<div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-6 text-center">
							<p className="text-sm font-semibold text-red-700 dark:text-red-300">
								Unable to load set
							</p>
							<p className="mt-2 text-sm text-red-600 dark:text-red-400">
								{errorMessage}
							</p>
						</div>
					) : cards.length === 0 ? (
						<div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-10 text-center">
							<p className="text-zinc-600 dark:text-zinc-400">
								No cards have been added for this set yet.
							</p>
						</div>
					) : (
						<div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
							<div className="divide-y divide-zinc-200 dark:divide-zinc-800">
								{cards.map((card) => (
									<div
										key={card.id}
										className="flex items-center justify-between px-6 py-4"
									>
										<div>
											<p className="text-sm text-zinc-500 dark:text-zinc-400">
												{card.number}
											</p>
											<p className="text-base font-semibold text-zinc-900 dark:text-white">
												{card.name}
											</p>
										</div>
										<div className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
											{card.set_code}
										</div>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
