// pages/AccountingDocuments.tsx
import React from "react"
import { FilesTable } from "@/components/files-table"

export default function AccountingDocuments() {
  return (
    <FilesTable
      fileType="accounting"
      title="Счетоводни документи"
    />
  )
}