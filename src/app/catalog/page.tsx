'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Game } from '@/lib/supabase';
import { useLanguage } from '@/lib/i18n-client';

export default function CatalogPage() {
	const { t, withLang } = useLanguage();
	const [games, setGames] = useState<Game[]>([]);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let isMounted = true;

		const fetchGames = async () => {
			const { data, error } = await supabase
				.from('games')
				.select('game_id, name, slug')
				.order('name');

			if (!isMounted) return;

			if (error || !data) {
				console.log('[catalog] games fetch error', {
					error: error?.message ?? null,
				});
				setGames([]);
				setErrorMessage(error?.message ?? 'Unknown error fetching games');
			} else {
				console.log('[catalog] games fetch', { count: data.length });
				setGames(data);
				setErrorMessage(null);
			}

			setLoading(false);
		};

		fetchGames();

		return () => {
			isMounted = false;
		};
	}, []);

	return (
		<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
				<div className="flex flex-col gap-8">
					<div>
						<h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white">
							{t.catalog.title}
						</h1>
						<p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
							{t.catalog.subtitle}
						</p>
					</div>

					{errorMessage ? (
						<div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-6 text-center">
							<p className="text-sm font-semibold text-red-700 dark:text-red-300">
								{t.catalog.errorTitle}
							</p>
							<p className="mt-2 text-sm text-red-600 dark:text-red-400">
								{errorMessage}
							</p>
						</div>
					) : loading ? (
						<div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-10 text-center">
							<p className="text-zinc-600 dark:text-zinc-400">
								...
							</p>
						</div>
					) : games.length === 0 ? (
						<div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-10 text-center">
							<p className="text-zinc-600 dark:text-zinc-400">
								{t.catalog.empty}
							</p>
						</div>
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
							{games.map((game) => {
								const gameSlug = game.slug?.trim() ?? '';
								const gameKey = (gameSlug || game.name)
									.trim()
									.toLowerCase()
									.replace(/\s+/g, '-');
								const gameName = t.games?.[gameKey] ?? game.name;

								return (
									<Link
										key={game.game_id}
										href={withLang(`/catalog/${gameSlug}`)}
										className="group rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm hover:shadow-md transition-shadow"
									>
										<h2 className="text-xl font-semibold text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
											{gameName}
										</h2>
										<p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
											{t.catalog.viewSets}
										</p>
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
