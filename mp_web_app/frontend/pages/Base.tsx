import {Outlet} from "react-router-dom";
import {Logo} from "@/components/logo";

export default function Base() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Example: header or logo can go here */}
      <header>
        <Logo/>
      </header>

      {/* This is where child routes render */}
      <main className="flex-grow">
        <Outlet/>
      </main>

      <footer>
        <p>&copy; 2025</p>
      </footer>
    </div>
  );
}
