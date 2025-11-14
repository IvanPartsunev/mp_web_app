import { Outlet } from "react-router-dom";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function Base() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Modern Header with hero image and parallax effect */}
      <Header />

      {/* Main content area - child routes render here */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Modern Footer with company information */}
      <Footer />
    </div>
  );
}
