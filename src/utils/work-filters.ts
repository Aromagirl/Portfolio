export const filterGroups = ['expertise', 'industries'] as const;
export type FilterState = Record<(typeof filterGroups)[number], string[]>;

export function matchesFilters(tags: FilterState, selected: FilterState): boolean {
  return filterGroups.every(group =>
    selected[group].length === 0 || selected[group].some(tag => tags[group].includes(tag)),
  );
}

export function readFilters(params: URLSearchParams, available: FilterState): FilterState {
  return Object.fromEntries(filterGroups.map(group => [
    group, [...new Set(params.getAll(group))].filter(tag => available[group].includes(tag)),
  ])) as FilterState;
}

export function writeFilters(url: URL, selected: FilterState): URL {
  const result = new URL(url);
  for (const group of filterGroups) {
    result.searchParams.delete(group);
    for (const tag of selected[group]) result.searchParams.append(group, tag);
  }
  return result;
}
