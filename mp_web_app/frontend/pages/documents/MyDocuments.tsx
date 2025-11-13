// pages/MyDocuments.tsx
import {FilesTable} from "@/components/files-table";

export default function MyDocuments() {
  return <FilesTable fileType="private_documents" title="Моите документи" />;
}
