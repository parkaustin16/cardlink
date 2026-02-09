'use client';

import { useLanguage } from '@/lib/i18n-client';

export default function LanguageToggle() {
  const { lang, setLanguage } = useLanguage();

  return (
    <div className="inline-flex rounded-full border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/80 p-1 shadow-sm">
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
          lang === 'en'
            ? 'bg-blue-600 text-white'
            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
        }`}
        aria-pressed={lang === 'en'}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage('kr')}
        className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
          lang === 'kr'
            ? 'bg-blue-600 text-white'
            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
        }`}
        aria-pressed={lang === 'kr'}
      >
        KR
      </button>
    </div>
  );
}
