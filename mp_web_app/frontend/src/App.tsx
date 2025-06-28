import React from "react";
import {ThemeProvider} from "@/components/theme-provider";
import {AuthProvider} from "@/context/AuthContext";
import Layout from "@/pages/Layout";

function App() {
  return (
    <AuthProvider>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <Layout>

        </Layout>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
