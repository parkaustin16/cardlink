'use client';

import { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { normalizeLanguage, translations, type Language } from '@/lib/i18n';

const applyLangToHref = (href: string, lang: Language): string => {
  const [path, rawQuery] = href.split('?');
  const params = new URLSearchParams(rawQuery ?? '');

  if (lang === 'en') {
    params.delete('lang');
  } else {
    params.set('lang', lang);
  }

  const query = params.toString();
  return query ? `${path}?${query}` : path;
};

export const useLanguage = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const lang = useMemo(
    () => normalizeLanguage(searchParams?.get('lang')),
    [searchParams]
  );

  const t = translations[lang];

  const withLang = (href: string) => applyLangToHref(href, lang);

  const setLanguage = (next: Language) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');

    if (next === 'en') {
      params.delete('lang');
    } else {
      params.set('lang', next);
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  return { lang, t, withLang, setLanguage };
};
