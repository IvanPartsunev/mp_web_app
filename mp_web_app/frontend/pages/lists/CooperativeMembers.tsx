import {useEffect, useState} from "react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {User as UserIcon} from "lucide-react";
import apiClient from "@/context/apiClient";

interface Member {
  first_name: string;
  last_name: string;
  proxy: boolean;
}

export default function CooperativeMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await apiClient.get("members/list", {
          params: {proxy_only: false},
        });
        setMembers(response.data || []);
      } catch (error) {
        console.error("Failed to fetch cooperative members:", error);
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
          <CardTitle>Списък на член кооператорите</CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Няма налични данни</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">№</TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4" />
                        Име
                      </div>
                    </TableHead>
                    <TableHead>Фамилия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{member.first_name}</TableCell>
                      <TableCell>{member.last_name}</TableCell>
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
