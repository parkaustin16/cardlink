'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { useLanguage } from '@/lib/i18n-client';
import { usePathname } from 'next/navigation';
import LanguageToggle from '@/components/LanguageToggle';

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t, withLang } = useLanguage();
  const pathname = usePathname();

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const navLinkClass = (href: string) => {
    const isActive = pathname === href;
    return `inline-flex items-center px-1 pt-1 text-sm font-medium ${
      isActive
        ? 'text-blue-600 dark:text-blue-400'
        : 'text-zinc-900 dark:text-zinc-100'
    }`;
  };

  return (
    <nav className="bg-white border-b border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href={withLang('/')} className="flex items-center">
              <span className="text-xl font-bold text-zinc-900 dark:text-white">
                CardJang
              </span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href={withLang('/catalog')}
                className={navLinkClass('/catalog')}
              >
                {t.nav.marketplace}
              </Link>
              {user && (
                <Link
                  href={withLang('/sell')}
                  className={navLinkClass('/sell')}
                >
                  {t.nav.sellCard}
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <LanguageToggle />
            </div>
            {user ? (
              <>
                <Link
                  href={withLang('/profile')}
                  className={navLinkClass('/profile') + ' mr-4'}
                >
                  {t.nav.profile}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
                >
                  {t.nav.signOut}
                </button>
              </>
            ) : (
                <div className="hidden sm:block">
                  <Link
                    href={withLang('/auth/login')}
                    className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
                  >
                    {t.nav.signIn}
                  </Link>
                </div>
            )}

              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="sm:hidden ml-3 p-2 rounded-md border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200"
                aria-label={isMenuOpen ? t.nav.closeMenu : t.nav.menu}
              >
                {isMenuOpen ? '✕' : '☰'}
              </button>
          </div>
        </div>
      </div>

        {isMenuOpen ? (
          <div className="sm:hidden border-t border-zinc-200 dark:border-zinc-800 px-4 py-3 space-y-2">
            <div className="pb-2">
              <LanguageToggle />
            </div>
            <Link
              href={withLang('/catalog')}
              onClick={() => setIsMenuOpen(false)}
              className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
            >
              {t.nav.marketplace}
            </Link>
            {user ? (
              <>
                <Link
                  href={withLang('/sell')}
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
                >
                  {t.nav.sellCard}
                </Link>
                <Link
                  href={withLang('/profile')}
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
                >
                  {t.nav.profile}
                </Link>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleSignOut();
                  }}
                  className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
                >
                  {t.nav.signOut}
                </button>
              </>
            ) : (
              <>
                <Link
                  href={withLang('/auth/login')}
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
                >
                  {t.nav.signIn}
                </Link>
                <Link
                  href={withLang('/auth/signup')}
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
                >
                  {t.auth.signUp}
                </Link>
              </>
            )}
          </div>
        ) : null}
    </nav>
  );
}
