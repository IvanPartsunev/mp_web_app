import React from "react";
import {ThemeProvider} from "@/components/theme-provider";
import {AuthProvider} from "@/context/AuthContext";
import Layout from "@/pages/Layout";
import {Route, Routes} from "react-router-dom";
import Home from "@/pages/Home";
import Products from "@/pages/Products";
import Contacts from "@/pages/Contacts";
import Gallery from "@/pages/Gallery";
import Board from "@/pages/about-us/Board";
import Control from "@/pages/about-us/Control";
import Proxies from "@/pages/lists/Proxies";
import Cooperative from "@/pages/lists/CooperativeMembers";
import GoverningDocuments from "@/pages/documents/GoverningDocuments";
import Forms from "@/pages/documents/Forms";
import Minutes from "@/pages/documents/Minutes";
import Transcripts from "@/pages/documents/Transcripts";
import AccountingDocuments from "@/pages/documents/AccountingDocuments";
import Others from "@/pages/documents/Others";
import Login from "@/pages/authentication/Login";
import Register from "@/pages/authentication/Register";

function App() {
  return (
    <AuthProvider>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <Routes>
          <Route path="/" element={<Layout/>}>
            <Route index element={<Home/>}/>
            <Route path="home" element={<Home/>}/>
            <Route path="products" element={<Products/>}/>
            <Route path="contacts" element={<Contacts/>}/>
            <Route path="gallery" element={<Gallery/>}/>

            {/* About us routes */}
            <Route path="board" element={<Board/>}/>
            <Route path="control" element={<Control/>}/>

            {/* Lists routes */}
            <Route path="proxies" element={<Proxies/>}/>
            <Route path="cooperative" element={<Cooperative/>}/>

            {/* Documents routes */}
            <Route path="governing-documents" element={<GoverningDocuments/>}/>
            <Route path="forms" element={<Forms/>}/>
            <Route path="minutes" element={<Minutes/>}/>
            <Route path="transcripts" element={<Transcripts/>}/>
            <Route path="accounting-documents" element={<AccountingDocuments/>}/>
            <Route path="others" element={<Others/>}/>

            {/* Authentication routes */}
            <Route path="login" element={<Login/>}/>
            <Route path="register" element={<Register/>}/>
          </Route>
        </Routes>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
