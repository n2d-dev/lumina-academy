'use client';

import { CATEGORIES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface CategoryFilterProps {
  selected: string;
  onSelect: (slug: string) => void;
}

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 sm:mx-0 px-4 sm:px-0 scrollbar-none">
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const isActive = selected === cat.slug;

        return (
          <button
            key={cat.slug}
            onClick={() => onSelect(cat.slug)}
            aria-pressed={isActive}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-full text-sm whitespace-nowrap transition-all touch-manipulation',
              isActive
                ? 'bg-primary text-primary-foreground font-semibold shadow-soft'
                : 'bg-muted hover:bg-border text-muted-foreground font-medium'
            )}
          >
            <Icon className="w-4 h-4" />
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}
