export function generateCategorySlug(name: string): string {
  return (
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-') +
    '-' +
    Math.random().toString(36).substring(2, 6)
  );
}
