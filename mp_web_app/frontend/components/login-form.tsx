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
import {extractApiErrorDetails} from "@/lib/errorUtils";
import {API_BASE_URL} from "@/app-config";

export function LoginForm({
                            className,
                            ...props
                          }: React.ComponentProps<"div">) {
  const [formData, setFormData] = useState({username: "", password: ""});
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({...prev, [field]: value}));
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const body = new URLSearchParams();
      body.append("username", formData.username);
      body.append("password", formData.password);

      const response = await fetch(`${API_BASE_URL}auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });

      let result;
      try {
        result = await response.json();
      } catch {
        result = {};
      }

      if (!response.ok) {
        throw {...result, status: response.status};
      }

      // Save token, redirect, etc.
      // Example: localStorage.setItem("token", result.access_token);
      setIsSuccess(true);
    } catch (err: any) {
      setError(extractApiErrorDetails(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect to home after successful login
  useEffect(() => {
    if (isSuccess) {
      const timeout = setTimeout(() => {
        window.location.assign("/");
      }, 1500); // 1.5 seconds
      return () => clearTimeout(timeout);
    }
  }, [isSuccess]);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Влез в своя акаунт</CardTitle>
          <CardDescription>
            Въведете своите имейл и парола
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}
              {isSuccess && (
                <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md text-center">
                  Успешен вход! Пренасочване към началната страница...
                </div>
              )}
              <div className="grid gap-3">
                <Label htmlFor="username">Имейл</Label>
                <Input
                  id="username"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Парола</Label>
                  <a
                    href="/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Забравена парола?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={isLoading || isSuccess}>
                  {isLoading ? "Влизане..." : "Вход"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}