// Hostinger (and most hosts) sit the app behind a reverse proxy, so the
// socket's own address is always the proxy's — the real client IP only
// shows up in these headers. x-forwarded-for can carry a proxy chain
// ("client, proxy1, proxy2"); the first entry is the original client.
export function getClientIp(request: Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip");
}
