import React from "react";
import { ThemeProvider } from "@/components/theme-provider";
import Layout from "@/pages/Layout";

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <Layout></Layout>
    </ThemeProvider>
  );
}

export default App;
