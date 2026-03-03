import { redirect } from 'next/navigation';

type MarketplacePageProps = {
	searchParams?:
		| { lang?: string | string[] }
		| Promise<{ lang?: string | string[] }>;
};

export default async function MarketplacePage({
	searchParams,
}: MarketplacePageProps) {
	const resolvedSearchParams = await Promise.resolve(searchParams);
	const rawLang = Array.isArray(resolvedSearchParams?.lang)
		? resolvedSearchParams?.lang[0]
		: resolvedSearchParams?.lang;

	if (rawLang && rawLang.trim().length > 0) {
		redirect(`/catalog?lang=${encodeURIComponent(rawLang)}`);
	}

	redirect('/catalog');
}
