import {useEffect, useState} from "react";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import apiClient from "@/context/apiClient";

interface Member {
  first_name: string;
  last_name: string;
  proxy: boolean;
}

export default function Proxies() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProxies = async () => {
      try {
        setLoading(true);
        // Fetch members with proxy_only=true filter
        const response = await apiClient.get("members/list", {
          params: {proxy_only: true},
        });
        setMembers(response.data || []);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Неуспешно зареждане на пълномощниците");
      } finally {
        setLoading(false);
      }
    };

    fetchProxies();
  }, []);

  return (
    <section className="container mx-auto px-4 py-8">

      {loading ? (
        <p className="text-center text-muted-foreground">Зареждане...</p>
      ) : error ? (
        <p className="text-center text-destructive">{error}</p>
      ) : members.length === 0 ? (
        <p className="text-center text-muted-foreground">Няма налични пълномощници</p>
      ) : (
        <div className="rounded-lg border bg-card shadow-sm p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">№</TableHead>
                <TableHead>Име</TableHead>
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
    </section>
  );
}
