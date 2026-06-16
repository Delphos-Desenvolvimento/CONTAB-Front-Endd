export function asArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    for (const key of ['data', 'items', 'news', 'results']) {
      if (Array.isArray(record[key])) {
        return record[key] as T[];
      }
    }
  }

  return [];
}
