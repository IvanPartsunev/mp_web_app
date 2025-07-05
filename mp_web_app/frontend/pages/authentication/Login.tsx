import {LoginForm} from "@/components/login-form"

export default function Login() {
  return (
    <div className="flex min-h-svh w-full items-top justify-center p-5 md:pt-15">
      <div className="w-full max-w-sm">
        <LoginForm/>
      </div>
    </div>
  )
}
