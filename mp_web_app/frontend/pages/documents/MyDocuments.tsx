// pages/MyDocuments.tsx
import {useEffect} from "react";
import {useNavigate} from "react-router-dom";
import {useAuth} from "@/context/AuthContext";
import {useSharedWithMe} from "@/hooks/useFiles";
import {FilesTable} from "@/components/files-table";

export default function MyDocuments() {
  const {isLoggedIn} = useAuth();
  const navigate = useNavigate();
  const {data = [], isLoading, error} = useSharedWithMe();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn) return null;

  return (
    <FilesTable
      title="Моите документи"
      files={data}
      isLoading={isLoading}
      error={error ? "Възникна грешка при зареждане." : null}
    />
  );
}
