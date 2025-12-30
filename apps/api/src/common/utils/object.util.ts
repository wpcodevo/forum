/**
 * Removes undefined and null values from an object.
 * Useful for partial updates where you only want to update provided fields.
 */
export function removeUndefinedAndNull<T extends Record<string, any>>(
  obj: T
): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined && value !== null)
  ) as Partial<T>
}

