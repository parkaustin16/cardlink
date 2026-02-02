import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl md:text-6xl">
              Welcome to <span className="text-blue-600">CardMart</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-zinc-600 dark:text-zinc-400">
              The premier marketplace for trading cards. Buy, sell, and trade
              cards from your favorite games.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Link
                href="/marketplace"
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Browse Marketplace
              </Link>
              <Link
                href="/auth/login"
                className="px-8 py-3 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg font-semibold border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
              >
                Get Started
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
              Wide Selection
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Find cards from various games including Magic: The Gathering,
              Pokémon, Yu-Gi-Oh!, and more.
            </p>
          </div>
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
              Secure Transactions
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Buy and sell with confidence using our secure platform powered by
              Supabase.
            </p>
          </div>
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
              Easy to Use
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              List your cards in minutes and start selling to collectors
              worldwide.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
