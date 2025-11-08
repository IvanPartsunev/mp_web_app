// jwt.ts
export function isJwtExpired(token: string): boolean {
  try {
    const [, payloadB64] = token.split(".");
    const payloadJson = JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")));
    const expSec = payloadJson?.exp;
    if (!expSec) return true;
    const nowSec = Math.floor(Date.now() / 1000);
    return nowSec >= expSec;
  } catch {
    return true;
  }
}

export function decodeJwt(token: string): any {
  try {
    const [, payloadB64] = token.split(".");
    const payloadJson = JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")));
    return payloadJson;
  } catch {
    return null;
  }
}

export function getUserRole(token: string | null): string | null {
  if (!token) return null;
  const payload = decodeJwt(token);
  return payload?.role || null;
}