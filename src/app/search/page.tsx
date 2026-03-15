import { redirect } from 'next/navigation';

interface SearchAliasPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function toSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SearchAliasPage({ searchParams }: SearchAliasPageProps) {
  const params = await searchParams;
  const query = toSingleValue(params.q)?.trim();
  const type = toSingleValue(params.type)?.trim();
  const nextParams = new URLSearchParams();

  if (query) {
    nextParams.set('q', query);
  }

  if (type) {
    nextParams.set('type', type);
  }

  const search = nextParams.toString();
  redirect(search ? `/movies/search?${search}` : '/movies/search');
}
