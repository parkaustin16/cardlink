'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { useLanguage } from '@/lib/i18n-client';

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const { t, withLang } = useLanguage();

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

  return (
    <nav className="bg-white border-b border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href={withLang('/')} className="flex items-center">
              <span className="text-xl font-bold text-zinc-900 dark:text-white">
                CardMart
              </span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href={withLang('/marketplace')}
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100"
              >
                {t.nav.marketplace}
              </Link>
              {user && (
                <Link
                  href={withLang('/sell')}
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100"
                >
                  {t.nav.sellCard}
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center">
            {user ? (
              <>
                <Link
                  href={withLang('/profile')}
                  className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mr-4"
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
              <Link
                href={withLang('/auth/login')}
                className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
              >
                {t.nav.signIn}
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
