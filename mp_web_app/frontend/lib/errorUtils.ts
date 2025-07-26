/**
 * Extracts a user-friendly error message from an API error.
 * - For validation errors (detail is array): shows translated messages.
 * - For HTTP errors (detail is string): shows HTTP code and original message (e.g. 404 Not Found).
 * - Falls back to error.message or generic error.
 */
export function extractApiErrorDetails(error: any): string {
  if (!error) return "Възникна грешка.";

  // Helper for Bulgarian translations of common validation error messages
  const translate = (msg: string): string => {
    if (/field required/i.test(msg)) return "Полето е задължително";
    if (/not a valid email address/i.test(msg)) return "Невалиден имейл адрес";
    if (/already exists/i.test(msg)) return "Вече съществува";
    if (/invalid credentials/i.test(msg)) return "Невалидни данни за вход";
    if (/too short/i.test(msg)) return "Стойността е твърде кратка";
    if (/too long/i.test(msg)) return "Стойността е твърде дълга";
    if (/value is not a valid/i.test(msg)) return "Невалидна стойност";
    if (/unprocessable entity/i.test(msg)) return "Невалидни данни";
    return msg;
  };

  // Extract status code if present
  const status = error.status || error.status_code || error.statusCode;

  // If error is a string, just return it (with status)
  if (typeof error === "string") return `${error}${status ? ` (Код: ${status})` : ""}`;

  // If error has a 'detail' field
  if (error.detail) {
    if (typeof error.detail === "string") {
      // Translate known errors
      return `${status ? status + " " : ""}${translate(error.detail)}`;
    }
    if (Array.isArray(error.detail)) {
      // FastAPI validation errors: show translated messages
      return (error.detail as any[]).map((d: any) => {
        if (typeof d === "string") return translate(d);
        if (d.msg) return translate(d.msg);
        if (d.message) return translate(d.message);
        return JSON.stringify(d);
      }).join("; ");
    }
  }
  // Fallback to error.message
  if (error.message) return `${error.message}${status ? ` (Код: ${status})` : ""}`;
  return `Възникна грешка.${status ? ` (Код: ${status})` : ""}`;
}