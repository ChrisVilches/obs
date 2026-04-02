const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'opus']);
const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'avi', 'mov', 'mkv', 'wmv', 'flv']);
const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'ico', 'avif']);
const MARKDOWN_EXTENSIONS = new Set(['md', 'mdx', 'markdown']);

export function getFileType(filename) {
  const ext = filename?.split('.').pop()?.toLowerCase();
  if (!ext) return 'text';
  if (IMAGE_EXTENSIONS.has(ext)) return 'image';
  if (AUDIO_EXTENSIONS.has(ext)) return 'audio';
  if (VIDEO_EXTENSIONS.has(ext)) return 'video';
  if (MARKDOWN_EXTENSIONS.has(ext)) return 'markdown';
  return 'text';
}
