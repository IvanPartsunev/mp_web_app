import React, {useState, useEffect} from "react"
import {cn} from "@/lib/utils"
import {Button} from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {X as XIcon} from "lucide-react"
import {apiPost} from "@/lib/api";
import {extractApiErrorDetails} from "@/lib/errorUtils";

export function RegisterForm({
                               className,
                               ...props
                             }: React.ComponentProps<"div">) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    phone: "",
    confirmPassword: "",
    id_number: ""
  })

  const [errors, setErrors] = useState({
    passwordMatch: false,
    phoneInvalid: false,
    submitted: false,
    api: ""
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Clear errors when user types
    if (field === 'password' || field === 'confirmPassword') {
      setErrors(prev => ({
        ...prev,
        passwordMatch: false
      }))
    }
    if (field === 'phone') {
      setErrors(prev => ({
        ...prev,
        phoneInvalid: false
      }))
    }
    // Clear API error when user types
    if (errors.api) {
      setErrors(prev => ({
        ...prev,
        api: ""
      }))
    }
  }

  const validatePasswords = () => {
    return formData.password === formData.confirmPassword && formData.password.length > 0
  }

  // Bulgarian phone validation: +359XXXXXXXXX or 08XXXXXXXX
  const validatePhone = (phone: string) => {
    return /^(\+359|0)\d{9}$/.test(phone.replace(/\s+/g, ""));
  }

  const registerUser = async (userData: { email: string; password: string; phone: string; id_number: string }) => {
    return apiPost("users/register", userData);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setErrors(prev => ({...prev, submitted: true, api: ""}))

    // Validate passwords
    if (!validatePasswords()) {
      setErrors(prev => ({
        ...prev,
        passwordMatch: true
      }))
      return
    }

    // Validate phone
    if (!validatePhone(formData.phone)) {
      setErrors(prev => ({
        ...prev,
        phoneInvalid: true
      }))
      return
    }

    setIsLoading(true)

    try {
      // Prepare data for API (exclude confirmPassword)
      const userData = {
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        id_number: formData.id_number
      }

      const result = await registerUser(userData)

      console.log("Registration successful:", result)
      setIsSuccess(true)

      // Reset form after successful registration
      setFormData({
        email: "",
        password: "",
        phone: "",
        confirmPassword: "",
        id_number: ""
      })

    } catch (error) {
      console.error("Registration error:", error)
      setErrors(prev => ({
        ...prev,
        api: extractApiErrorDetails(error)
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const passwordsMatch = validatePasswords()
  const showPasswordError = errors.submitted && !passwordsMatch && formData.confirmPassword.length > 0
  const showPhoneError = errors.submitted && errors.phoneInvalid

  // Redirect to login after success message
  useEffect(() => {
    if (isSuccess) {
      const timeout = setTimeout(() => {
        window.location.assign("/login");
      }, 2500); // 2.5 seconds
      return () => clearTimeout(timeout);
    }
  }, [isSuccess]);

  // Show success message if registration was successful
  if (isSuccess) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Регистрацията е успешна!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-green-600 mb-4">
                Вашият акаунт беше създаден успешно.
              </p>
              <p className="text-sm text-gray-500">Ще бъдете пренасочени ...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Създай своя акаунт</CardTitle>
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
                <Label htmlFor="email">Имейл</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="phone">Телефон</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+359 8XXXXXXXX"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={isLoading}
                  required
                />
                {showPhoneError && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <XIcon size={14}/>
                    Невалиден телефонен номер
                  </p>
                )}
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Парола</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="confirm-password">Потвърди парола</Label>
                </div>
                <Input
                  id="confirm-password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={cn(
                    showPasswordError && "border-red-500 focus-visible:ring-red-500/20"
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
              </div>

              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="id-number">Индивидуален регистрационен код</Label>
                </div>
                <Input
                  id="id-number"
                  type="text"
                  value={formData.id_number}
                  onChange={(e) => handleInputChange('id_number', e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <CardDescription>
                За да заявите индивидуален код можете да използвате имейл или телефон, които можете да
                намерите в секция контакти.
              </CardDescription>

              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Регистриране..." : "Регистрация"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}