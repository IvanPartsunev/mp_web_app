import React, {useState, useEffect} from "react";
import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {X as XIcon} from "lucide-react";
import {extractApiErrorDetails} from "@/lib/errorUtils";
import {API_BASE_URL} from "@/app-config";

interface NewPasswordFormProps extends React.ComponentProps<"div"> {
  email: string;
  token: string;
}

export function NewPasswordForm({
                                  className,
                                  email,
                                  token,
                                  ...props
                                }: NewPasswordFormProps) {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({
    passwordMatch: false,
    submitted: false,
    api: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear errors when user types
    if (field === "password" || field === "confirmPassword") {
      setErrors((prev) => ({
        ...prev,
        passwordMatch: false,
      }));
    }
    // Clear API error when user types
    if (errors.api) {
      setErrors((prev) => ({
        ...prev,
        api: "",
      }));
    }
  };

  const validatePasswords = () => {
    return (
      formData.password === formData.confirmPassword &&
      formData.password.length > 0
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrors((prev) => ({...prev, submitted: true, api: ""}));

    // Validate passwords
    if (!validatePasswords()) {
      setErrors((prev) => ({
        ...prev,
        passwordMatch: true,
      }));
      return;
    }

    setIsLoading(true);

    try {
      // Prepare data for API
      const payload = {
        token,
        password: formData.password,
      };

      const response = await fetch(
        `${API_BASE_URL}users/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      let result;
      try {
        result = await response.json();
      } catch {
        result = {};
      }

      if (!response.ok) {
        throw {...result, status: response.status};
      }

      setIsSuccess(true);

      // Reset form after successful reset
      setFormData({
        password: "",
        confirmPassword: "",
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

  const passwordsMatch = validatePasswords();
  const showPasswordError =
    errors.submitted &&
    !passwordsMatch &&
    formData.confirmPassword.length > 0;

  // Redirect to login after success message
  useEffect(() => {
    if (isSuccess) {
      const timeout = setTimeout(() => {
        window.location.assign("/login");
      }, 2500); // 2.5 seconds
      return () => clearTimeout(timeout);
    }
  }, [isSuccess]);

  // Show success message if password reset was successful
  if (isSuccess) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              Паролата е сменена успешно!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-green-600 mb-4">
                Можете да влезете с новата си парола.
              </p>
              <p className="text-sm text-gray-500">
                Ще бъдете пренасочени ...
              </p>
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
          <CardTitle>Въведете нова парола</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              {errors.api && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {errors.api}
                </div>
              )}

              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Нова парола</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="confirm-password">Потвърди нова парола</Label>
                </div>
                <Input
                  id="confirm-password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  className={cn(
                    showPasswordError &&
                    "border-red-500 focus-visible:ring-red-500/20"
                  )}
                  disabled={isLoading}
                  required
                />
                {showPasswordError && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <XIcon size={14}/>
                    Паролите не съвпадат
                  </p>
                )}
                {formData.confirmPassword.length > 0 && passwordsMatch && (
                  <p className="text-sm text-green-600">
                    ✓ Паролите съвпадат
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Паролата трябва да е между 8 и 30 символа и да съдържа поне една главна буква, една малка буква,
                  една цифра и един специален символ: !@#$%^&?
                </p>
              </div>

              <CardDescription>
                Моля, въведете новата си парола два пъти за потвърждение.
              </CardDescription>

              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Смяна на парола..." : "Смени паролата"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}