// pages/MyDocuments.tsx
import {useEffect} from "react";
import {useNavigate} from "react-router-dom";
import {FilesTable} from "@/components/files-table";
import {useAuth} from "@/context/AuthContext";

export default function MyDocuments() {
  const {isLoggedIn} = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn) return null;

  return <FilesTable fileType="private_documents" title="Моите документи" />;
}
