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