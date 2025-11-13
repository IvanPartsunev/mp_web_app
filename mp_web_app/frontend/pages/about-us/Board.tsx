import {useEffect, useState} from "react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Mail, Phone, User as UserIcon} from "lucide-react";
import apiClient from "@/context/apiClient";
import {useAuth} from "@/context/AuthContext";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
}

export default function Board() {
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const {isLoggedIn} = useAuth();

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await apiClient.get("users/board");
        setMembers(response.data || []);
      } catch (error) {
        console.error("Failed to fetch board members:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  if (loading) {
    return (
      <section className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">Зареждане...</p>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 py-8">

      <Card>
        <CardHeader>
          <CardTitle>Членове на управителния съвет</CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Няма налични данни</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4" />
                        Име
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Имейл
                      </div>
                    </TableHead>
                    {isLoggedIn && (
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Телефон
                        </div>
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.first_name} {member.last_name}
                      </TableCell>
                      <TableCell>
                        <a href={`mailto:${member.email}`} className="text-primary hover:underline">
                          {member.email}
                        </a>
                      </TableCell>
                      {isLoggedIn && (
                        <TableCell>
                          <a href={`tel:${member.phone}`} className="text-primary hover:underline">
                            {member.phone}
                          </a>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
