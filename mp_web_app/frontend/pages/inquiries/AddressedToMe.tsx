import {useEffect} from "react";
import {useNavigate} from "react-router-dom";
import {useAuth} from "@/context/AuthContext";
import {useAddressedToMe} from "@/hooks/useInquiries";
import {getAccessToken} from "@/context/tokenStore";
import {getUserRole} from "@/context/jwt";
import {InquiriesTable} from "./InquiriesTable";

const ALLOWED_ROLES = ["board", "control", "admin"];

export default function AddressedToMe() {
  const {isLoggedIn} = useAuth();
  const navigate = useNavigate();
  const {data = [], isLoading, error} = useAddressedToMe();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    const role = getUserRole(getAccessToken());
    if (!role || !ALLOWED_ROLES.includes(role)) {
      navigate("/home");
    }
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn) return null;

  return (
    <InquiriesTable
      title="Адресирани до мен"
      inquiries={data}
      isLoading={isLoading}
      error={error ? "Възникна грешка при зареждане." : null}
    />
  );
}
