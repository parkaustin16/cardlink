import { Suspense } from 'react';
import SignupClient from './SignupClient';

export default function Signup() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white dark:bg-zinc-800 rounded-lg shadow-md p-8">
            <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-700 rounded mx-auto mb-6" />
            <div className="space-y-4">
              <div className="h-10 w-full bg-zinc-200 dark:bg-zinc-700 rounded" />
              <div className="h-10 w-full bg-zinc-200 dark:bg-zinc-700 rounded" />
              <div className="h-10 w-full bg-zinc-200 dark:bg-zinc-700 rounded" />
            </div>
          </div>
        </div>
      }
    >
      <SignupClient />
    </Suspense>
  );
}
