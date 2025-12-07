export function extractApiErrorDetails(error: any): string {
  if (!error) return "Възникна грешка.";

  // Helper for Bulgarian translations of common validation error messages
  const translate = (msg: string): string => {
    // General validation errors
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
      return "Телефонният номер трябва да започва с 0 или +359";
    
    // Email-specific backend errors
    if (/Email address structure is not valid/i.test(msg)) return "Структурата на имейл адреса не е валидна";
    if (/User with this email already exists/i.test(msg)) return "Потребител с този имейл вече съществува";
    
    // Not found errors
    if (/User .* not found/i.test(msg)) return "Потребителят не е намерен";
    if (/News with id .* not found/i.test(msg)) return "Новината не е намерена";
    if (/Product with id .* not found/i.test(msg)) return "Продуктът не е намерен";
    if (/Member with code .* not found/i.test(msg)) return "Членът не е намерен";
    if (/Image not found/i.test(msg)) return "Изображението не е намерено";
    
    // Database errors
    if (/Database error/i.test(msg)) return "Грешка в базата данни";
    
    // File upload errors
    if (/Invalid file type/i.test(msg)) return "Невалиден тип файл";
    if (/Invalid image format/i.test(msg)) return "Невалиден формат на изображение. Разрешени формати: JPG, JPEG, PNG, GIF, WEBP";
    if (/Invalid members list file type/i.test(msg)) return "Невалиден тип файл за списък с членове. Разрешен тип: .csv";
    if (/File too large/i.test(msg)) {
      // Extract size info if present
      const match = msg.match(/Maximum size: (\d+)MB.*Your file: ([\d.]+)MB/i);
      if (match) {
        return `Файлът е твърде голям. Максимален размер: ${match[1]}MB. Вашият файл: ${match[2]}MB`;
      }
      return "Файлът е твърде голям";
    }
    if (/Image upload failed/i.test(msg)) return "Неуспешно качване на снимката";
    
    // Token errors
    if (/Invalid or expired token/i.test(msg)) return "Невалиден или изтекъл токен";
    
    // Permission errors
    if (/Cannot delete your own account/i.test(msg)) return "Не можете да изтриете собствения си акаунт";
    if (/You do not have access to this resource/i.test(msg)) return "Нямате достъп до този ресурс";
    
    // Auth errors
    if (/Invalid credentials/i.test(msg)) return "Невалидни данни за вход";
    if (/Invalid or expired token/i.test(msg)) return "Невалиден или изтекъл токен";
    if (/Invalid refresh token/i.test(msg)) return "Невалиден токен за обновяване";
    if (/Invalid token type/i.test(msg)) return "Невалиден тип токен";
    if (/Refresh token not found/i.test(msg)) return "Токенът за обновяване не е намерен";
    if (/This token does not belong to the user/i.test(msg)) return "Този токен не принадлежи на потребителя";
    if (/Refresh token expired/i.test(msg)) return "Токенът за обновяване е изтекъл";
    if (/Missing refresh token/i.test(msg)) return "Липсва токен за обновяване";
    
    // File errors
    if (/Missing allowed users/i.test(msg)) return "Липсват разрешени потребители";
    if (/Invalid file extension/i.test(msg)) return "Невалидно файлово разширение";
    if (/File upload error/i.test(msg)) return "Грешка при качване на файл";
    if (/Metadata error/i.test(msg)) return "Грешка в метаданните";
    if (/File access denied/i.test(msg)) return "Достъпът до файла е отказан";
    if (/File not found/i.test(msg)) return "Файлът не е намерен";
    if (/Invalid metadata/i.test(msg)) return "Невалидни метаданни";
    
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
