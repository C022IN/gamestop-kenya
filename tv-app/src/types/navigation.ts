import type { CatalogItem, TmdbItem } from '@/api/client';

export type AnyItem = CatalogItem | TmdbItem;

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Detail: { item: AnyItem };
  Player: { item: AnyItem; season?: number; episode?: number };
  Search: undefined;
};
