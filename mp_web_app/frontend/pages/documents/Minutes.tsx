// pages/Minutes.tsx
import React from "react"
import { FilesTable } from "@/components/files-table"

export default function Minutes() {
  return (
    <FilesTable
      fileType="minutes"
      title="Протоколи"
    />
  )
}