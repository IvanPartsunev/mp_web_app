import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {getAccessToken} from "@/context/tokenStore";
import {getUserRole} from "@/context/jwt";
import NewsManagement from "./NewsManagement";
import UserManagement from "./UserManagement";
import ProductsManagement from "./ProductsManagement";
import DocumentsManagement from "./DocumentsManagement";
import GalleryManagement from "./GalleryManagement";
import MembersManagement from "./MembersManagement";
import EmailsManagement from "./EmailsManagement";

export default function AdminPanel() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  // Load active tab from localStorage or default to "news"
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("adminActiveTab") || "news";
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1200);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1200);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("adminActiveTab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    const token = getAccessToken();
    const role = getUserRole(token);

    if (role !== "admin") {
      navigate("/", {replace: true});
    } else {
      setIsAdmin(true);
    }
    setLoading(false);
  }, [navigate]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">Зареждане...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-white to-primary/10 dark:from-gray-900 dark:via-gray-800 dark:to-primary/5 border-b border-gray-200/50">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4 py-12 md:py-16 relative">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-primary to-gray-900 dark:from-white dark:via-primary dark:to-white bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-1000">
              Административен панел
            </h1>
          </div>
        </div>
      </section>

      <div className="w-full px-2 xl:container xl:mx-auto xl:px-4 py-8">

      {isMobile ? (
        <div className="w-full">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full mb-6">
              <SelectValue placeholder="Изберете секция" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="news">Новини</SelectItem>
              <SelectItem value="users">Потребители</SelectItem>
              <SelectItem value="products">Продукти</SelectItem>
              <SelectItem value="gallery">Галерия</SelectItem>
              <SelectItem value="members">Членове</SelectItem>
              <SelectItem value="emails">Мейл</SelectItem>
              <SelectItem value="documents">Документи</SelectItem>
            </SelectContent>
          </Select>

          <div className="mt-6">
            {activeTab === "news" && <NewsManagement />}
            {activeTab === "users" && <UserManagement />}
            {activeTab === "products" && <ProductsManagement />}
            {activeTab === "documents" && <DocumentsManagement />}
            {activeTab === "gallery" && <GalleryManagement />}
            {activeTab === "members" && <MembersManagement />}
            {activeTab === "emails" && <EmailsManagement />}
          </div>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="news">Новини</TabsTrigger>
            <TabsTrigger value="users">Потребители</TabsTrigger>
            <TabsTrigger value="products">Продукти</TabsTrigger>
            <TabsTrigger value="documents">Документи</TabsTrigger>
            <TabsTrigger value="gallery">Галерия</TabsTrigger>
            <TabsTrigger value="members">Членове</TabsTrigger>
            <TabsTrigger value="emails">Мейл</TabsTrigger>
          </TabsList>

          <TabsContent value="news" className="mt-6">
            <NewsManagement />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="products" className="mt-6">
            <ProductsManagement />
          </TabsContent>

          <TabsContent value="documents" className="mt-6">
            <DocumentsManagement />
          </TabsContent>

          <TabsContent value="gallery" className="mt-6">
            <GalleryManagement />
          </TabsContent>

          <TabsContent value="members" className="mt-6">
            <MembersManagement />
          </TabsContent>

          <TabsContent value="emails" className="mt-6">
            <EmailsManagement />
          </TabsContent>
        </Tabs>
      )}
      </div>
    </div>
  );
}
