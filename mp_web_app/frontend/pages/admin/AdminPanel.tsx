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

export default function AdminPanel() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("news");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1200);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1200);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    <div className="w-full px-2 xl:container xl:mx-auto xl:px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Административен панел</h1>

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
              <SelectItem value="documents">Документи</SelectItem>
              <SelectItem value="gallery">Галерия</SelectItem>
            </SelectContent>
          </Select>

          <div className="mt-6">
            {activeTab === "news" && <NewsManagement />}
            {activeTab === "users" && <UserManagement />}
            {activeTab === "products" && <ProductsManagement />}
            {activeTab === "documents" && <DocumentsManagement />}
            {activeTab === "gallery" && <GalleryManagement />}
          </div>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="news">Новини</TabsTrigger>
            <TabsTrigger value="users">Потребители</TabsTrigger>
            <TabsTrigger value="products">Продукти</TabsTrigger>
            <TabsTrigger value="documents">Документи</TabsTrigger>
            <TabsTrigger value="gallery">Галерия</TabsTrigger>
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
        </Tabs>
      )}
    </div>
  );
}
