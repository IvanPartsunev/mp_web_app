import {useEffect} from "react";
import {useNavigate} from "react-router-dom";
import {useAuth} from "@/context/AuthContext";
import {useMyInquiries} from "@/hooks/useInquiries";
import {InquiriesTable} from "./InquiriesTable";

export default function MyInquiries() {
  const {isLoggedIn} = useAuth();
  const navigate = useNavigate();
  const {data = [], isLoading, error} = useMyInquiries();

  useEffect(() => {
    if (!isLoggedIn) navigate("/login");
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn) return null;

  return (
    <InquiriesTable
      title="Моите запитвания"
      inquiries={data}
      isLoading={isLoading}
      error={error ? "Възникна грешка при зареждане." : null}
    />
  );
}
