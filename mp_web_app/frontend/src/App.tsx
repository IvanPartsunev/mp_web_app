import React, {lazy} from "react";
import {AuthProvider} from "@/context/AuthContext";
import Navigation from "@/pages/Navigation";
import Base from "@/pages/Base";
import {Route, Routes} from "react-router-dom";
import PageLoadingWrapper from "@/components/page-loading-wrapper";
import {Toaster} from "@/components/ui/toaster";

// Regular imports for pages that don't need API calls
import Home from "@/pages/Home";
import Products from "@/pages/Products";
import Contacts from "@/pages/Contacts";
import Gallery from "@/pages/Gallery";
import Upload from "@/pages/UploadFile";
import Login from "@/pages/authentication/Login";
import Register from "@/pages/authentication/Register";
import ForgotPassword from "@/pages/authentication/ForgotPassword";
import NewPassword from "@/pages/authentication/NewPassword";
import Unsubscribe from "@/pages/Unsubscribe";


// Lazy imports for pages that make API calls
// @ts-ignore
const Board = lazy(() => import("@/pages/about-us/Board"));
// @ts-ignore
const Control = lazy(() => import("@/pages/about-us/Control"));
// @ts-ignore
const Proxies = lazy(() => import("@/pages/lists/Proxies"));
// @ts-ignore
const Cooperative = lazy(() => import("@/pages/lists/CooperativeMembers"));
// @ts-ignore
const GoverningDocuments = lazy(() => import("@/pages/documents/GoverningDocuments"));
// @ts-ignore
const Forms = lazy(() => import("@/pages/documents/Forms"));
// @ts-ignore
const Minutes = lazy(() => import("@/pages/documents/Minutes"));
// @ts-ignore
const Transcripts = lazy(() => import("@/pages/documents/Transcripts"));
// @ts-ignore
const AccountingDocuments = lazy(() => import("@/pages/documents/AccountingDocuments"));
// @ts-ignore
const Others = lazy(() => import("@/pages/documents/Others"));
// @ts-ignore
const MyDocuments = lazy(() => import("@/pages/documents/MyDocuments"))
// @ts-ignore
const AdminPanel = lazy(() => import("@/pages/admin/AdminPanel"))


function App() {
  return (
    <AuthProvider>
      <Toaster />
      <Routes>
        <Route path="/" element={<Base/>}>
          <Route element={<Navigation/>}>
            <Route index element={<Home/>}/>
            <Route path="home" element={<Home/>}/>
            <Route path="products" element={<Products/>}/>
            <Route path="contacts" element={<Contacts/>}/>
            <Route path="gallery" element={<Gallery/>}/>
            <Route path="upload" element={<Upload/>}/>
            <Route
              path="board"
              element={
                <PageLoadingWrapper loadingText="Зареждане на управителния съвет...">
                  <Board/>
                </PageLoadingWrapper>
              }
            />
            <Route
              path="control"
              element={
                <PageLoadingWrapper loadingText="Зареждане на контролния съвет...">
                  <Control/>
                </PageLoadingWrapper>
              }
            />

            <Route
              path="proxies"
              element={
                <PageLoadingWrapper loadingText="Зареждане на пълномощниците...">
                  <Proxies/>
                </PageLoadingWrapper>
              }
            />
            <Route
              path="cooperative"
              element={
                <PageLoadingWrapper loadingText="Зареждане на член кооператорите...">
                  <Cooperative/>
                </PageLoadingWrapper>
              }
            />

            <Route
              path="governing-documents"
              element={
                <PageLoadingWrapper loadingText="Зареждане на нормативните документи...">
                  <GoverningDocuments/>
                </PageLoadingWrapper>
              }
            />
            <Route
              path="forms"
              element={
                <PageLoadingWrapper loadingText="Зареждане на бланките...">
                  <Forms/>
                </PageLoadingWrapper>
              }
            />
            <Route
              path="minutes"
              element={
                <PageLoadingWrapper loadingText="Зареждане на протоколите...">
                  <Minutes/>
                </PageLoadingWrapper>
              }
            />
            <Route
              path="transcripts"
              element={
                <PageLoadingWrapper loadingText="Зареждане на стенограмите...">
                  <Transcripts/>
                </PageLoadingWrapper>
              }
            />
            <Route
              path="accounting-documents"
              element={
                <PageLoadingWrapper loadingText="Зареждане на счетоводните документи...">
                  <AccountingDocuments/>
                </PageLoadingWrapper>
              }
            />
            <Route
              path="mydocuments"
              element={
                <PageLoadingWrapper loadingText="Зареждане на моите документи...">
                  <MyDocuments/>
                </PageLoadingWrapper>
              }
            />
            <Route
              path="others"
              element={
                <PageLoadingWrapper loadingText="Зареждане на документите...">
                  <Others/>
                </PageLoadingWrapper>
              }
            />
            {/* Admin routes */}
            <Route
              path="admin"
              element={
                <PageLoadingWrapper loadingText="Зареждане на админ панела...">
                  <AdminPanel/>
                </PageLoadingWrapper>
              }
            />

            {/* Authentication routes */}
            <Route path="login" element={<Login/>}/>
            <Route path="register" element={<Register/>}/>
            <Route path="forgot-password" element={<ForgotPassword/>}/>
            <Route path="new-password" element={<NewPassword/>}/>
            <Route path="unsubscribe" element={<Unsubscribe/>}/>
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
