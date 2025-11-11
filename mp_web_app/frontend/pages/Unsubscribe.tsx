import React, {useEffect, useState} from "react";
import {useSearchParams, Link} from "react-router-dom";
import {Card} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {CheckCircle2, XCircle, Loader2} from "lucide-react";
import apiClient from "@/context/apiClient";

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const email = searchParams.get("email");
    const token = searchParams.get("token");

    if (!email || !token) {
      setStatus("error");
      setMessage("Невалиден линк за отписване");
      return;
    }

    const unsubscribe = async () => {
      try {
        await apiClient.get(`mail/unsubscribe?email=${email}&token=${token}`);
        setStatus("success");
        setMessage("Успешно се отписахте от новините");
      } catch (err: any) {
        setStatus("error");
        setMessage(err.response?.data?.detail || "Грешка при отписване");
      }
    };

    unsubscribe();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="max-w-md w-full p-8 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="h-16 w-16 mx-auto mb-4 text-primary animate-spin" />
            <h1 className="text-2xl font-bold mb-2">Обработка...</h1>
            <p className="text-muted-foreground">Моля изчакайте</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-600" />
            <h1 className="text-2xl font-bold mb-2">Успешно отписване</h1>
            <p className="text-muted-foreground mb-6">{message}</p>
            <p className="text-sm text-muted-foreground mb-6">Няма да получавате повече имейли с новини от нас.</p>
            <Link to="/">
              <Button>Към началната страница</Button>
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="h-16 w-16 mx-auto mb-4 text-destructive" />
            <h1 className="text-2xl font-bold mb-2">Грешка</h1>
            <p className="text-muted-foreground mb-6">{message}</p>
            <Link to="/">
              <Button>Към началната страница</Button>
            </Link>
          </>
        )}
      </Card>
    </div>
  );
}
