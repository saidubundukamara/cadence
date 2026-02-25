"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CSVImporter } from "@/components/import/CSVImporter"

const CSV_TEMPLATE = `platform,content,scheduled_at,media_url
TWITTER,"Check out our latest update!",2026-03-01T10:00:00Z,
FACEBOOK,"Big announcement coming soon. Stay tuned!",2026-03-01T12:00:00Z,https://example.com/image.jpg
INSTAGRAM,"Beautiful day",2026-03-02T09:00:00Z,https://example.com/photo.jpg
YOUTUBE,"My Video Title\nCheck out this amazing video!",2026-03-03T14:00:00Z,`

function downloadTemplate() {
  const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "cadence-import-template.csv"
  a.click()
  URL.revokeObjectURL(url)
}

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Import Posts</h2>
          <p className="text-muted-foreground">
            Bulk import posts from a CSV file.
          </p>
        </div>
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="mr-2 size-4" />
          Download Template
        </Button>
      </div>
      <CSVImporter />
    </div>
  )
}
