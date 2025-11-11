import React, {useState, useEffect} from "react";
import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {X as XIcon, Check as CheckIcon} from "lucide-react";
import {apiPost} from "@/lib/api";
import {extractApiErrorDetails} from "@/lib/errorUtils";
import LoadingSpinner from "@/components/ui/loading-spinner";

// Bulgarian phone validation: +359XXXXXXXXX or 0XXXXXXXXX
function getPhoneError(phone: string): string | null {
  const normalized = phone.replace(/\s+/g, "");
  if (!/^(\+359|0)\d{9}$/.test(normalized)) {
    return "Телефонният номер трябва да е във формат +359XXXXXXXXX или 0XXXXXXXXX.";
  }
  return null;
}

export function RegisterForm({className, ...props}: React.ComponentProps<"div">) {
  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    phone: "",
    confirmPassword: "",
    member_code: "",
  });

  const [errors, setErrors] = useState({
    passwordMatch: false,
    submitted: false,
    api: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Real-time validation states
  const phoneError = formData.phone ? getPhoneError(formData.phone) : null;
  const passwordsMatch = formData.password === formData.confirmPassword && formData.password.length > 0;

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear API error when user types
    if (errors.api) {
      setErrors((prev) => ({
        ...prev,
        api: "",
      }));
    }
    // Reset password match error if editing password fields
    if (field === "password" || field === "confirmPassword") {
      setErrors((prev) => ({
        ...prev,
        passwordMatch: false,
      }));
    }
  };

  const registerUser = async (userData: {email: string; password: string; phone: string; member_code: string}) => {
    return apiPost("users/register", userData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrors((prev) => ({
      ...prev,
      submitted: true,
      api: "",
      passwordMatch: false,
    }));

    // Validate passwords match
    if (!passwordsMatch) {
      setErrors((prev) => ({
        ...prev,
        passwordMatch: true,
      }));
      return;
    }
    // Validate phone
    if (phoneError) {
      return;
    }

    setIsLoading(true);

    try {
      // Prepare data for API (exclude confirmPassword)
      const userData = {
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        password: formData.password,
        phone: formData.phone,
        member_code: formData.member_code,
      };

      await registerUser(userData);

      setIsSuccess(true);

      // Reset form after successful registration
      setFormData({
        email: "",
        first_name: "",
        last_name: "",
        password: "",
        phone: "",
        confirmPassword: "",
        member_code: "",
      });
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        api: extractApiErrorDetails(error),
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect to log in after a success message
  useEffect(() => {
    if (isSuccess) {
      const timeout = setTimeout(() => {
        window.location.assign("/login");
      }, 2500); // 2.5 seconds
      return () => clearTimeout(timeout);
    }
  }, [isSuccess]);

  // Show a success message if registration was successful
  if (isSuccess) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Регистрацията е успешна!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-green-600 mb-4">Вашият акаунт беше създаден успешно.</p>
              <p className="text-sm text-gray-500">Ще бъдете пренасочени ...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Създай своя акаунт</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="flex flex-col gap-6">
              {errors.api && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{errors.api}</div>
              )}

              <div className="grid gap-3">
                <Label htmlFor="email">Имейл:</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  disabled={isLoading}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="first-name">Име:</Label>
                <Input
                  id="first-name"
                  type="Wrap with {}"
                  placeholder="Иван"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange("first_name", e.target.value)}
                  disabled={isLoading}
                  required
                  autoComplete="first-name"
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="last-name">Фамилия:</Label>
                <Input
                  id="last-name"
                  type="Wrap with {}"
                  placeholder="Иванов"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange("last_name", e.target.value)}
                  disabled={isLoading}
                  required
                  autoComplete="last-name"
                />
              </div>

              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Парола:</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  disabled={isLoading}
                  required
                  autoComplete="new-password"
                />
              </div>

              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="confirm-password">Потвърди парола:</Label>
                </div>
                <Input
                  id="confirm-password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  className={cn(errors.passwordMatch && "border-red-500 focus-visible:ring-red-500/20")}
                  disabled={isLoading}
                  required
                  autoComplete="new-password"
                />
                {formData.confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <XIcon size={14} />
                    Паролите не съвпадат
                  </p>
                )}
                {formData.confirmPassword.length > 0 && passwordsMatch && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <CheckIcon size={14} />
                    Паролите съвпадат
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Паролата трябва да е между 8 и 30 символа и да съдържа поне една главна буква, една малка буква, една
                  цифра и един специален символ: !@#$%^&?
                </p>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="phone">Телефон:</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+359 8XXXXXXXX"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  disabled={isLoading}
                  required
                  autoComplete="tel"
                />
                {formData.phone && phoneError && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <XIcon size={14} />
                    {phoneError}
                  </p>
                )}
                {formData.phone && !phoneError && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <CheckIcon size={14} />
                    Телефонният номер е валиден
                  </p>
                )}
              </div>

              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="id-number">Индивидуален регистрационен код:</Label>
                </div>
                <Input
                  id="id-number"
                  type="text"
                  value={formData.member_code}
                  onChange={(e) => handleInputChange("member_code", e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <CardDescription>
                За да заявите индивидуален код можете да използвате имейл или телефон, които можете да намерите в секция
                контакти.
              </CardDescription>

              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && (
                    <div className="fixed inset-0 bg-white/70 flex items-center justify-center z-50">
                      <LoadingSpinner size="lg" text="Регистриране..." />
                    </div>
                  )}{" "}
                  Регистрация
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
