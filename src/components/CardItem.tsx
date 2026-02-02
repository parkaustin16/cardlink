'use client';

import { Card } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';

interface CardItemProps {
  card: Card;
}

export default function CardItem({ card }: CardItemProps) {
  return (
    <Link href={`/card/${card.id}`}>
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
        <div className="aspect-w-3 aspect-h-4 bg-zinc-200 dark:bg-zinc-700">
          {card.image_url ? (
            <Image
              src={card.image_url}
              alt={card.name}
              width={300}
              height={400}
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="w-full h-48 flex items-center justify-center text-zinc-400">
              No Image
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">
            {card.name}
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            {card.game}
          </p>
          <div className="flex justify-between items-center">
            <span className="text-xs text-zinc-500 dark:text-zinc-500">
              {card.rarity} • {card.condition}
            </span>
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
              ${card.price.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
