'use client';

import { useLanguage } from '@/lib/i18n-client';

export default function MarketplacePage() {
	const { t } = useLanguage();

	return (
		<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
				<div className="flex flex-col gap-6">
					<div>
						<h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white">
							{t.marketplace.title}
						</h1>
						<p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
							{t.marketplace.subtitle}
						</p>
					</div>

					<div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-10 text-center">
						<p className="text-zinc-600 dark:text-zinc-400">
							{t.marketplace.empty}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
