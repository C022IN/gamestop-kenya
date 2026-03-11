import 'server-only';

export interface ArchiveItem {
  identifier: string;
  title: string;
  description?: string;
  year?: string;
  subject?: string | string[];
  creator?: string | string[];
  thumbUrl: string;
  embedUrl: string;
}

interface ArchiveDoc {
  identifier: string;
  title?: string;
  description?: string | string[];
  year?: string | number;
  subject?: string | string[];
  creator?: string | string[];
}

function mapDoc(doc: ArchiveDoc): ArchiveItem {
  return {
    identifier: doc.identifier,
    title: doc.title ?? doc.identifier,
    description: Array.isArray(doc.description)
      ? doc.description[0]
      : (doc.description ?? ''),
    year: String(doc.year ?? ''),
    subject: doc.subject,
    creator: doc.creator,
    thumbUrl: `https://archive.org/services/img/${doc.identifier}`,
    embedUrl: `https://archive.org/embed/${doc.identifier}`,
  };
}

/**
 * Search Internet Archive for public-domain movies.
 * Uses the Scrape API (no auth required).
 */
export async function searchArchive(
  query: string,
  rows = 20,
  page = 1
): Promise<ArchiveItem[]> {
  const params = new URLSearchParams({
    q: `(${query}) AND mediatype:movies AND licenseurl:(creativecommons OR "public domain" OR "No Known Copyright")`,
    fl: 'identifier,title,description,year,subject,creator',
    sort: 'downloads desc',
    rows: String(rows),
    page: String(page),
    output: 'json',
  });

  try {
    const res = await fetch(
      `https://archive.org/advancedsearch.php?${params.toString()}`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return [];
    const json = (await res.json()) as { response?: { docs: ArchiveDoc[] } };
    return (json?.response?.docs ?? []).map(mapDoc);
  } catch {
    return [];
  }
}

/** Curated collections of public-domain classic films */
export const ARCHIVE_COLLECTIONS: Record<string, { label: string; query: string; emoji: string }> = {
  noir:       { label: 'Film Noir',      query: 'collection:film_noir OR subject:"film noir"',          emoji: '🕵️' },
  westerns:   { label: 'Westerns',       query: 'subject:western AND mediatype:movies',                  emoji: '🤠' },
  scifi:      { label: 'Sci-Fi Classics', query: 'subject:"science fiction" AND mediatype:movies',       emoji: '🚀' },
  comedy:     { label: 'Classic Comedy', query: 'subject:comedy AND mediatype:movies',                   emoji: '😂' },
  horror:     { label: 'Horror',         query: 'subject:horror AND mediatype:movies',                   emoji: '👻' },
  adventure:  { label: 'Adventure',      query: 'subject:adventure AND mediatype:movies',                emoji: '⚔️' },
  animation:  { label: 'Animation',      query: 'subject:animation AND mediatype:movies',                emoji: '🎨' },
  documentary: { label: 'Documentary',   query: 'subject:documentary AND mediatype:movies',              emoji: '📽️' },
};

export async function fetchArchiveCollection(
  collectionKey: string,
  rows = 20
): Promise<ArchiveItem[]> {
  const col = ARCHIVE_COLLECTIONS[collectionKey];
  if (!col) return [];
  return searchArchive(col.query, rows);
}
