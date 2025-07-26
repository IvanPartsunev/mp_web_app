import {useSearchParams} from "react-router-dom";
import {NewPasswordForm} from "@/components/new-password";

export default function NewPassword() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";

  return (
    <div className="flex min-h-svh w-full items-top justify-center p-5 md:pt-15">
      <div className="w-full max-w-sm">
        <NewPasswordForm email={email} token={token}/>
      </div>
    </div>
  );
}