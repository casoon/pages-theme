import type { Lang } from './i18n';

const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');

/** Prefix a site-internal path with the Pages base path ("/<repo>/"). */
export function url(path = ''): string {
  return base + path.replace(/^\//, '');
}

/** casoon.de, canonical host. */
export const CASOON_URL = 'https://www.casoon.de/';

/** The author's profile on casoon.de and the schema.org ids casoon.de gives person and company. */
export const AUTHOR_URL = `${CASOON_URL}joern-seidel/`;
export const PERSON_ID = `${AUTHOR_URL}#person`;
export const ORGANIZATION_ID = `${CASOON_URL}#organization`;

/** The project catalog on casoon.dev (canonical host), or one project's entry in it. */
export function catalogUrl(lang: Lang, slug = ''): string {
  return `https://casoon.dev/${lang === 'en' ? 'en/' : ''}${slug && `#projekt-${slug}`}`;
}
