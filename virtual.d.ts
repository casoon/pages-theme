declare module 'virtual:casoon-pages/config' {
  const config: import('./index').ResolvedConfig;
  export default config;
}

declare module 'virtual:casoon-pages/showcase' {
  export const examples: import('./lib/showcase').ShowcaseExample[];
}

declare module 'virtual:casoon-pages/use-cases' {
  export const useCases: import('./lib/use-cases').UseCase[];
  export const lead: import('./lib/use-cases').UseCasesPage['lead'];
  export const tradeoffs: import('./lib/use-cases').UseCasesPage['tradeoffs'];
}

declare module 'virtual:casoon-pages/mdx-components' {
  export const components: Record<string, unknown>;
}
