export const searchQueryKeys = {
  all: ['search'] as const,
  query: (q: string) => ['search', q] as const,
}
