import {RegisterForm} from "@/components/register"

export default function Register() {
  return (
    <div className="flex min-h-svh w-full items-top justify-center p-5 md:pt-15">
      <div className="w-full max-w-sm">
        <RegisterForm/>
      </div>
    </div>
  )
}
