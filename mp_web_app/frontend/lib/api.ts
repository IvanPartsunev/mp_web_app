import {API_BASE_URL} from "@/app-config";

/**
 * Makes a POST request to the API and returns the parsed JSON response.
 * Throws the full error response if the response is not ok,
 * including handling for non-JSON and empty error responses.
 */
export async function apiPost<T>(endpoint: string, data: any): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(data),
  });

  // Try to parse JSON if possible, otherwise fallback to text
  let responseBody: any = null;
  let isJson = false;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      responseBody = await response.json();
      isJson = true;
    } catch {
      responseBody = null;
    }
  } else {
    try {
      responseBody = await response.text();
    } catch {
      responseBody = null;
    }
  }

  if (!response.ok) {
    // Attach status code to the error object
    if (responseBody && typeof responseBody === "object") {
      throw {...responseBody, status: response.status};
    } else {
      throw {message: responseBody || `HTTP ${response.status} ${response.statusText}`, status: response.status};
    }
  }

  // If no content (204), return null
  if (response.status === 204) return null as T;

  // If JSON, return parsed object, else return text
  if (isJson) return responseBody as T;
  return responseBody as T;
}