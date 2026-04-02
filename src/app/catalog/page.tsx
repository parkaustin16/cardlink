'use client';

import { useMemo } from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Game } from '@/lib/supabase';
import { useLanguage } from '@/lib/i18n-client';

type GameLanguageOption = {
	label: string;
	slug: string;
	gameId: string;
	sortOrder: number;
};

type GroupedGame = {
	key: string;
	name: string;
	sortName: string;
	options: GameLanguageOption[];
};

const LANGUAGE_ORDER: Record<string, number> = {
	en: 0,
	kr: 1,
	jp: 2,
};

const extractLanguageCode = (slug: string): string => {
	const trimmedSlug = slug.trim().toLowerCase();
	const parts = trimmedSlug.split('-');
	const suffix = parts[parts.length - 1];
	return suffix.length === 2 ? suffix : 'en';
};

const removeLanguageSuffix = (slug: string): string =>
	slug.trim().replace(/-[a-z]{2}$/i, '');

export default function CatalogPage() {
	const { t, withLang } = useLanguage();
	const [games, setGames] = useState<Game[]>([]);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [openGameKey, setOpenGameKey] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [languageFilter, setLanguageFilter] = useState('all');

	useEffect(() => {
		let isMounted = true;

		const fetchGames = async () => {
			const { data, error } = await supabase
				.from('games')
				.select('game_id, name, slug')
				.order('name');

			if (!isMounted) return;

			if (error || !data) {
				setGames([]);
				setErrorMessage(error?.message ?? 'Unknown error fetching games');
			} else {
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

	const groupedGames = useMemo<GroupedGame[]>(() => {
		const groups = new Map<string, GroupedGame>();

		for (const game of games) {
			const rawSlug = game.slug?.trim() ?? '';
			if (!rawSlug) continue;

			const baseSlug = removeLanguageSuffix(rawSlug);
			const languageCode = extractLanguageCode(rawSlug);
			const gameKey = (baseSlug || game.name)
				.trim()
				.toLowerCase()
				.replace(/\s+/g, '-');
			const displayName = t.games?.[gameKey] ?? baseSlug
				.split('-')
				.map((segment) =>
					segment.length > 0
						? segment.charAt(0).toUpperCase() + segment.slice(1)
						: segment
				)
				.join(' ');

			const existing = groups.get(baseSlug);
			const option: GameLanguageOption = {
				label: t.languageNames?.[languageCode] ?? languageCode.toUpperCase(),
				slug: rawSlug,
				gameId: game.game_id,
				sortOrder: LANGUAGE_ORDER[languageCode] ?? 99,
			};

			if (existing) {
				existing.options.push(option);
				continue;
			}

			groups.set(baseSlug, {
				key: baseSlug,
				name: displayName,
				sortName: baseSlug.replace(/-/g, ' '),
				options: [option],
			});
		}

		return Array.from(groups.values())
			.map((group) => ({
				...group,
				options: group.options.sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label)),
			}))
			.sort((a, b) => a.sortName.localeCompare(b.sortName));
	}, [games, t.games, t.languageNames]);

	const visibleGames = useMemo(() => {
		const normalizedQuery = searchQuery.trim().toLowerCase();

		return groupedGames.filter((game) => {
			const matchesLanguage =
				languageFilter === 'all' ||
				game.options.some((option) => option.slug.endsWith(`-${languageFilter}`));

			if (!matchesLanguage) {
				return false;
			}

			if (!normalizedQuery) {
				return true;
			}

			const haystacks = [
				game.name,
				game.sortName,
				...game.options.map((option) => `${option.label} ${option.slug}`),
			];

			return haystacks.some((value) => value.toLowerCase().includes(normalizedQuery));
		});
	}, [groupedGames, languageFilter, searchQuery]);

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
						<div className="mt-4">
							<Link
								href={withLang('/sell')}
								className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
							>
								{t.nav.sellCard}
							</Link>
						</div>
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
						<>
							<div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-5">
								<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
									<label className="flex flex-col gap-2 text-sm text-zinc-700 dark:text-zinc-300">
										<span className="font-semibold">{t.catalog.searchLabel}</span>
										<input
											type="search"
											value={searchQuery}
											onChange={(event) => setSearchQuery(event.target.value)}
											placeholder={t.catalog.searchGamesPlaceholder}
											className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
										/>
									</label>

									<label className="flex flex-col gap-2 text-sm text-zinc-700 dark:text-zinc-300">
										<span className="font-semibold">{t.catalog.filterLanguage}</span>
										<select
											value={languageFilter}
											onChange={(event) => setLanguageFilter(event.target.value)}
											className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
										>
											<option value="all">{t.catalog.allLanguages}</option>
											<option value="en">{t.languageNames.en}</option>
											<option value="kr">{t.languageNames.kr}</option>
											<option value="jp">{t.languageNames.jp}</option>
										</select>
									</label>

									<div className="flex flex-col justify-end rounded-lg bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-950/50">
										<span className="font-semibold text-zinc-700 dark:text-zinc-300">
											{t.catalog.visibleResults}
										</span>
										<span className="mt-1 text-lg font-semibold text-zinc-900 dark:text-white">
											{visibleGames.length}
										</span>
									</div>
								</div>
							</div>

							{visibleGames.length === 0 ? (
								<div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-10 text-center">
									<p className="text-zinc-600 dark:text-zinc-400">
										{t.catalog.gamesEmptyFiltered}
									</p>
								</div>
							) : (
								<div className="grid grid-cols-1 items-start sm:grid-cols-2 lg:grid-cols-3 gap-6">
									{visibleGames.map((game) => (
								<div
									key={game.key}
									className="group self-start rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm"
								>
									<button
										type="button"
										onClick={() =>
											setOpenGameKey((current) =>
												current === game.key ? null : game.key
											)
										}
										className="flex w-full cursor-pointer items-center justify-between gap-4 text-left"
										aria-expanded={openGameKey === game.key}
									>
										<div>
											<h2 className={`text-xl font-semibold ${
												openGameKey === game.key
													? 'text-blue-600 dark:text-blue-400'
													: 'text-zinc-900 dark:text-white'
											}`}>
												{game.name}
											</h2>
											<p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
												{t.catalog.viewSets}
											</p>
										</div>
										<div className="flex items-center gap-3">
											<span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
												{game.options.length} option{game.options.length === 1 ? '' : 's'}
											</span>
											<span
												className={`text-zinc-500 transition-transform dark:text-zinc-400 ${
													openGameKey === game.key ? 'rotate-180' : ''
												}`}
												aria-hidden="true"
											>
												▾
											</span>
										</div>
									</button>
									{openGameKey === game.key ? (
									<div className="mt-4 flex flex-col gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
										{game.options.map((option) => (
											<Link
												key={option.gameId}
												href={withLang(`/catalog/${option.slug}`)}
												prefetch
												className="flex items-center rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-700 transition-colors hover:border-blue-300 hover:text-blue-600 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-blue-700 dark:hover:text-blue-400"
											>
												<span>{option.label}</span>
											</Link>
										))}
									</div>
									) : null}
								</div>
							))}
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	);
}
