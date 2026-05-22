import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient();

export async function apiFetch(url) {
  const res = await fetch(url);
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json;
}
