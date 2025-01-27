/**
 * Filters out null and undefined values from an object
 * @param obj - Object to filter
 * @returns New object without null/undefined values
 */
export function filterNullProps<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value != null),
  ) as T;
}
