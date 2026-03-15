export type MoviesHubSource = 'tmdb' | 'catalog';

export interface MoviesHubTile {
  id: string;
  title: string;
  imageUrl?: string;
  heroImageUrl?: string;
  href: string;
  badge?: string;
  meta?: string;
  ctaLabel?: string;
  playable?: boolean;
  description?: string;
  genres: string[];
  rating?: number;
  source: MoviesHubSource;
  tmdbType?: 'movie' | 'tv';
  kindLabel?: string;
  secondaryMeta?: string;
  rank?: number;
}

export interface MoviesHubSection {
  id: string;
  title: string;
  items: MoviesHubTile[];
  accent?: string;
  eyebrow?: string;
}
