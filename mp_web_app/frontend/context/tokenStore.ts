// tokenStore.ts
let accessToken: string | null = localStorage.getItem("access_token");

export function getAccessToken(): string | null {
  return accessToken || localStorage.getItem("access_token");
}

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) localStorage.setItem("access_token", token);
  else localStorage.removeItem("access_token");
}
