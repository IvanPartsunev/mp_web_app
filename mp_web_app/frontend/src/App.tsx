import React, {lazy} from "react";
import {AuthProvider} from "@/context/AuthContext";
import Navigation from "@/pages/Navigation";
import Base from "@/pages/Base";
import {Route, Routes} from "react-router-dom";
import LoadingSpinner from "@/components/ui/loading-spinner";
import PageLoadingWrapper from "@/components/page-loading-wrapper";

// Regular imports for pages that don't need API calls
import Home from "@/pages/Home";
import Products from "@/pages/Products";
import Contacts from "@/pages/Contacts";
import Gallery from "@/pages/Gallery";
import Login from "@/pages/authentication/Login";
import Register from "@/pages/authentication/Register";
import ForgotPassword from "@/pages/authentication/ForgotPassword";


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

// Global loading fallback
const GlobalLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner size="lg" text="Зареждане..."/>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Base/>}>
          <Route element={<Navigation/>}>
            <Route index element={<Home/>}/>
            <Route path="home" element={<Home/>}/>
            <Route path="products" element={<Products/>}/>
            <Route path="contacts" element={<Contacts/>}/>
            <Route path="gallery" element={<Gallery/>}/>

            {/* About us routes - with loading */}
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

            {/* Lists routes - with loading */}
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

            {/* Documents routes - with loading */}
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
              path="others"
              element={
                <PageLoadingWrapper loadingText="Зареждане на документите...">
                  <Others/>
                </PageLoadingWrapper>
              }
            />

            {/* Authentication routes */}
            <Route path="login" element={<Login/>}/>
            <Route path="register" element={<Register/>}/>
            <Route path="forgot-password" element={<ForgotPassword/>}/>
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
