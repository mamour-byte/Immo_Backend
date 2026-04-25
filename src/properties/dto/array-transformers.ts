function parseJsonValue(value: unknown): unknown {
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();
  if (!trimmed) return value;

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function normalizeArrayInput(value: unknown): unknown[] | undefined {
  if (value === undefined || value === null || value === '') return undefined;

  if (Array.isArray(value)) {
    return value;
  }

  const parsed = parseJsonValue(value);
  if (Array.isArray(parsed)) {
    return parsed;
  }

  return [parsed];
}

export function toNumberArray(value: unknown): number[] | undefined {
  const items = normalizeArrayInput(value);
  if (!items) return undefined;

  return items
    .map((item) => Number(item))
    .filter((item) => !Number.isNaN(item));
}

export function toStringArray(value: unknown): string[] | undefined {
  const items = normalizeArrayInput(value);
  if (!items) return undefined;

  return items
    .map((item) => String(item).trim())
    .filter((item) => item.length > 0);
}

export function toObjectArray<T extends object>(value: unknown): T[] | undefined {
  const items = normalizeArrayInput(value);
  if (!items) return undefined;

  return items
    .map((item) => parseJsonValue(item))
    .filter((item): item is T => Boolean(item) && typeof item === 'object' && !Array.isArray(item));
}
