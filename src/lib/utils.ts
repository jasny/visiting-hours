export function partialMatch<T>(input: Partial<T>, expect: Partial<T>) {
  const keys = Object.keys(expect) as Array<keyof T>;
  return !keys.some((key) => input[key] !== expect[key] && input[key] !== undefined);
}
