const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'ico', 'avif']);
const MARKDOWN_EXTENSIONS = new Set(['md', 'mdx', 'markdown']);

export function getFileType(filename) {
  const ext = filename?.split('.').pop()?.toLowerCase();
  if (!ext) return 'text';
  if (IMAGE_EXTENSIONS.has(ext)) return 'image';
  if (MARKDOWN_EXTENSIONS.has(ext)) return 'markdown';
  return 'text';
}
