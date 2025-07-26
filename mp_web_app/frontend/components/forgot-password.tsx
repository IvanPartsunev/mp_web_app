import React, {useState} from "react";
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

export function ForgotPasswordForm({
                                     className,
                                     ...props
                                   }: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const body = new URLSearchParams();
      body.append("email", email);

      const response = await fetch(`${API_BASE_URL}auth/forgot-password`, {
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

      setIsSuccess(true);
    } catch (err: any) {
      setError(extractApiErrorDetails(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Забравена парола</CardTitle>
          <CardDescription>
            Въведете вашия имейл за възстановяване на парола.
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
                  Изпратихме инструкции на вашия имейл.
                </div>
              )}
              <div className="grid gap-3">
                <Label htmlFor="email">Имейл</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  required
                  disabled={isLoading || isSuccess}
                  autoComplete="email"
                />
              </div>
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={isLoading || isSuccess}>
                  {isLoading ? "Изпращане..." : "Изпрати линк за възстановяване"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
