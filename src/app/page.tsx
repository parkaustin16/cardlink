"use client";

import Link from 'next/link';
import LanguageToggle from '@/components/LanguageToggle';
import { useLanguage } from '@/lib/i18n-client';

export default function Home() {
  const { t, withLang } = useLanguage();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="flex justify-end">
            <LanguageToggle />
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl md:text-6xl">
              {t.home.titlePrefix}{' '}
              <span className="text-blue-600">{t.home.titleName}</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-zinc-600 dark:text-zinc-400">
              {t.home.subtitle}
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                href={withLang('/marketplace')}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                {t.home.browseMarketplace}
              </Link>
              <Link
                href={withLang('/catalog')}
                className="px-8 py-3 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg font-semibold border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
              >
                {t.home.browseCatalog}
              </Link>
              <Link
                href={withLang('/auth/login')}
                className="px-8 py-3 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg font-semibold border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
              >
                {t.home.getStarted}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
              {t.home.featuresTitle1}
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              {t.home.featuresBody1}
            </p>
          </div>
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
              {t.home.featuresTitle2}
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              {t.home.featuresBody2}
            </p>
          </div>
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
              {t.home.featuresTitle3}
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              {t.home.featuresBody3}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
