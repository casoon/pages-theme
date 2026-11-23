export interface UseCase {
  /** Anchor on the /use-cases/ page, e.g. "ci-logs". */
  slug: string;
  title: string;
  /** One or two sentences. Takes the changelog's inline Markdown subset. */
  body: string;
  /** Small line above the title, e.g. "CI · GitHub Actions". */
  eyebrow?: string;
  /** Shown as badges on the start page's `UseCases` rows. */
  tags?: string[];
  /** Numbered steps. With `code` they match its `marks`; the use case is then set as a panel. */
  steps?: string[];
  /** A code block beside the steps (the first use case with one is set as a panel). */
  code?: {
    code: string;
    lang?: string;
    /** File name in the bar. */
    title?: string;
    /** Language label in the bar. */
    label?: string;
    marks?: { line: number; n: number }[];
  };
  /** A short data sheet beside the text: what goes in, where it runs, what it ships. */
  specs?: { term: string; value: string }[];
  /** Text links with an arrow below the text. */
  links?: { label: string; href: string }[];
}

/** Optional page-level exports of the use-cases module, next to `useCases`. */
export interface UseCasesPage {
  /** Lead beside the page title. */
  lead?: string;
  /** A closing `Tradeoffs` panel: what the project is not for. */
  tradeoffs?: { title: string; items: string[]; lead?: string; eyebrow?: string };
}
