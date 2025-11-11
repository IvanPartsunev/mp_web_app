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
    if (/User code don't exists or its already used/i.test(msg))
      return "Индивидуалният код не съществува или е вече използван";
    // Password-specific backend errors
    if (/Password must be at least 8 characters long/i.test(msg)) return "Паролата трябва да е поне 8 символа.";
    if (/Password must be at less than 30 characters long/i.test(msg))
      return "Паролата трябва да е по-къса от 30 символа.";
    if (/Password must contain at least one uppercase letter/i.test(msg))
      return "Паролата трябва да съдържа поне една главна буква.";
    if (/Password must contain at least one lowercase letter/i.test(msg))
      return "Паролата трябва да съдържа поне една малка буква.";
    if (/Password must contain at least one digit/i.test(msg)) return "Паролата трябва да съдържа поне една цифра.";
    if (/Password must contain at least one special symbol/i.test(msg))
      return "Паролата трябва да съдържа поне един специален символ: !@#$%^&?";
    // Phone-specific backend errors
    if (/Phone number must be 10 or 13 digits/i.test(msg)) return "Телефонният номер трябва да е 10 или 13 цифри.";
    if (/Phone number must start with '0' or '+359'/i.test(msg))
      return "Телефонният номер трябва да запозва с 0 или +359";
    return msg;
  };

  // If error is a string, just return the translated message
  if (typeof error === "string") return translate(error);

  // If error has a 'detail' field
  if (error.detail) {
    if (typeof error.detail === "string") {
      // HTTP error: show translated message
      return translate(error.detail);
    }
    if (Array.isArray(error.detail)) {
      // FastAPI validation errors: show translated messages
      return (error.detail as any[])
        .map((d: any) => {
          if (typeof d === "string") return translate(d);
          if (d.msg) return translate(d.msg);
          if (d.message) return translate(d.message);
          return JSON.stringify(d);
        })
        .join("; ");
    }
  }
  // Fallback to error.message
  if (error.message) return translate(error.message);
  return "Възникна грешка.";
}
