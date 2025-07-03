// /mp_web_app/frontend/lib/api.ts
// @ts-ignore
import {API_BASE_URL} from "@/app-config";

export async function apiPost<T>(endpoint: string, data: any): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "API error");
  }
  return response.json();
}