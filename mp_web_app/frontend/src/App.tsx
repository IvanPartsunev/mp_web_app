import {lazy} from "react";
import {AuthProvider} from "@/context/AuthContext";
import Base from "@/pages/Base";
import {Route, Routes} from "react-router-dom";
import PageLoadingWrapper from "@/components/page-loading-wrapper";
import {Toaster} from "@/components/ui/toaster";
import {QueryClientProvider} from "@tanstack/react-query";
import {queryClient} from "@/lib/queryClient";

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
const Board = lazy(() => import("@/pages/about-us/Board"));
const Control = lazy(() => import("@/pages/about-us/Control"));
const Proxies = lazy(() => import("@/pages/lists/Proxies"));
const Cooperative = lazy(() => import("@/pages/lists/CooperativeMembers"));
const GoverningDocuments = lazy(() => import("@/pages/documents/GoverningDocuments"));
const Forms = lazy(() => import("@/pages/documents/Forms"));
const Minutes = lazy(() => import("@/pages/documents/Minutes"));
const Transcripts = lazy(() => import("@/pages/documents/Transcripts"));
const AccountingDocuments = lazy(() => import("@/pages/documents/AccountingDocuments"));
const Others = lazy(() => import("@/pages/documents/Others"));
const MyDocuments = lazy(() => import("@/pages/documents/MyDocuments"));
const AdminPanel = lazy(() => import("@/pages/admin/AdminPanel"));

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster />
        <Routes>
        <Route path="/" element={<Base />}>
            <Route index element={<Home />} />
            <Route path="home" element={<Home />} />
            <Route path="products" element={<Products />} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="upload" element={<Upload />} />
            <Route
              path="board"
              element={
                <PageLoadingWrapper loadingText="Зареждане на управителния съвет...">
                  <Board />
                </PageLoadingWrapper>
              }
            />
            <Route
              path="control"
              element={
                <PageLoadingWrapper loadingText="Зареждане на контролния съвет...">
                  <Control />
                </PageLoadingWrapper>
              }
            />

            <Route
              path="proxies"
              element={
                <PageLoadingWrapper loadingText="Зареждане на пълномощниците...">
                  <Proxies />
                </PageLoadingWrapper>
              }
            />
            <Route
              path="cooperative"
              element={
                <PageLoadingWrapper loadingText="Зареждане на член кооператорите...">
                  <Cooperative />
                </PageLoadingWrapper>
              }
            />

            <Route
              path="governing-documents"
              element={
                <PageLoadingWrapper loadingText="Зареждане на нормативните документи...">
                  <GoverningDocuments />
                </PageLoadingWrapper>
              }
            />
            <Route
              path="forms"
              element={
                <PageLoadingWrapper loadingText="Зареждане на бланките...">
                  <Forms />
                </PageLoadingWrapper>
              }
            />
            <Route
              path="minutes"
              element={
                <PageLoadingWrapper loadingText="Зареждане на протоколите...">
                  <Minutes />
                </PageLoadingWrapper>
              }
            />
            <Route
              path="transcripts"
              element={
                <PageLoadingWrapper loadingText="Зареждане на стенограмите...">
                  <Transcripts />
                </PageLoadingWrapper>
              }
            />
            <Route
              path="accounting-documents"
              element={
                <PageLoadingWrapper loadingText="Зареждане на счетоводните документи...">
                  <AccountingDocuments />
                </PageLoadingWrapper>
              }
            />
            <Route
              path="mydocuments"
              element={
                <PageLoadingWrapper loadingText="Зареждане на моите документи...">
                  <MyDocuments />
                </PageLoadingWrapper>
              }
            />
            <Route
              path="others"
              element={
                <PageLoadingWrapper loadingText="Зареждане на документите...">
                  <Others />
                </PageLoadingWrapper>
              }
            />
            {/* Admin routes */}
            <Route
              path="admin"
              element={
                <PageLoadingWrapper loadingText="Зареждане на админ панела...">
                  <AdminPanel />
                </PageLoadingWrapper>
              }
            />

            {/* Authentication routes */}
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="new-password" element={<NewPassword />} />
            <Route path="unsubscribe" element={<Unsubscribe />} />
        </Route>
      </Routes>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
