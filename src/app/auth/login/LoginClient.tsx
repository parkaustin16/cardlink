'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n-client';

export default function LoginClient() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(true);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { t, withLang } = useLanguage();

  useEffect(() => {
    const remembered = window.localStorage.getItem('cardjang.rememberedEmail');
    if (remembered) {
      setEmail(remembered);
      setRememberEmail(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (rememberEmail) {
        window.localStorage.setItem('cardjang.rememberedEmail', email);
      } else {
        window.localStorage.removeItem('cardjang.rememberedEmail');
      }

      router.push(withLang('/catalog'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t.auth.signInFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setOauthLoading(true);

    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });

      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : t.auth.signInFailed);
      setOauthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-zinc-800 rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6 text-center">
          {t.auth.loginTitle}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
            >
              {t.auth.email}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              autoComplete="email"
              required
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
            >
              {t.auth.password}
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full px-4 py-2 pr-20 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 px-3 text-sm font-medium text-zinc-600 dark:text-zinc-300"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 text-sm">
            <label className="inline-flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={rememberEmail}
                onChange={(e) => setRememberEmail(e.target.checked)}
                className="rounded border-zinc-300 dark:border-zinc-700"
              />
              Remember email
            </label>
            <Link
              href={withLang('/auth/forgot-password')}
              className="text-blue-600 dark:text-blue-400 font-semibold"
            >
              {t.auth.forgotPassword}
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t.auth.signingIn : t.auth.signIn}
          </button>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={oauthLoading}
            className="w-full py-2 px-4 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-700 rounded-lg font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {oauthLoading ? t.auth.signingIn : t.auth.continueWithGoogle}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
          {t.auth.noAccount}{' '}
          <Link
            href={withLang('/auth/signup')}
            className="text-blue-600 dark:text-blue-400 font-semibold"
          >
            {t.auth.signUp}
          </Link>
        </p>

        <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
          <Link
            href={withLang('/auth/forgot-id')}
            className="text-blue-600 dark:text-blue-400 font-semibold"
          >
            {t.auth.forgotId}
          </Link>
        </p>
      </div>
    </div>
  );
}
