import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Административен панел</h1>

      <Tabs defaultValue="news" className="w-full">
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
    </div>
  );
}
