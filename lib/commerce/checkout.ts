// Pure validation; callers supply server-side environment values.
export function checkoutDestination(rawUrl: string | undefined, rawHost: string | undefined): string | null {
 if (!rawUrl || !rawHost) return null;
 try {
  const host=rawHost.trim().toLowerCase();
  if (!/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(host) || !host.includes(".")) return null;
  const url=new URL(rawUrl);
  if(url.protocol!=="https:" || url.hostname!==host || url.port || url.username || url.password || url.hash) return null;
  return url.href;
 } catch { return null; }
}
