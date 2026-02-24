"use client"

import { useState, useCallback } from "react"
import Papa from "papaparse"
import { Upload, FileSpreadsheet, AlertCircle, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface CSVRow {
  platform: string
  content: string
  scheduled_at: string
  media_url?: string
}

interface ValidatedRow extends CSVRow {
  errors: string[]
  valid: boolean
}

const VALID_PLATFORMS = ["TWITTER", "FACEBOOK", "INSTAGRAM"]

function validateRow(row: CSVRow, index: number): ValidatedRow {
  const errors: string[] = []

  if (!row.platform || !VALID_PLATFORMS.includes(row.platform.toUpperCase())) {
    errors.push(`Row ${index + 1}: Invalid platform "${row.platform}"`)
  }

  if (!row.content || row.content.trim().length === 0) {
    errors.push(`Row ${index + 1}: Content is required`)
  }

  if (!row.scheduled_at) {
    errors.push(`Row ${index + 1}: Scheduled date is required`)
  } else {
    const date = new Date(row.scheduled_at)
    if (isNaN(date.getTime())) {
      errors.push(`Row ${index + 1}: Invalid date format`)
    } else if (date <= new Date()) {
      errors.push(`Row ${index + 1}: Date must be in the future`)
    }
  }

  if (row.media_url && row.media_url.trim()) {
    try {
      new URL(row.media_url)
    } catch {
      errors.push(`Row ${index + 1}: Invalid media URL`)
    }
  }

  return {
    ...row,
    platform: row.platform?.toUpperCase() || "",
    errors,
    valid: errors.length === 0,
  }
}

export function CSVImporter() {
  const [rows, setRows] = useState<ValidatedRow[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{
    imported: number
    failed: number
  } | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = useCallback((file: File) => {
    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const validated = results.data.map((row, i) => validateRow(row, i))
        setRows(validated)
        setResult(null)
      },
      error: () => {
        toast.error("Failed to parse CSV file")
      },
    })
  }, [])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file?.name.endsWith(".csv")) {
      handleFile(file)
    } else {
      toast.error("Please upload a CSV file")
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  async function handleImport() {
    const validRows = rows.filter((r) => r.valid)
    if (validRows.length === 0) {
      toast.error("No valid rows to import")
      return
    }

    setImporting(true)
    try {
      const res = await fetch("/api/posts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          posts: validRows.map((r) => ({
            content: r.content,
            platforms: [r.platform],
            scheduledAt: new Date(r.scheduled_at).toISOString(),
            mediaUrls: r.media_url ? [r.media_url] : [],
          })),
        }),
      })

      const data = await res.json()
      setResult({ imported: data.imported, failed: data.failed })
      toast.success(`Imported ${data.imported} posts`)
    } catch {
      toast.error("Import failed")
    } finally {
      setImporting(false)
    }
  }

  const validCount = rows.filter((r) => r.valid).length
  const errorCount = rows.filter((r) => !r.valid).length

  return (
    <div className="space-y-6">
      {rows.length === 0 ? (
        <Card
          className={`border-2 border-dashed transition-colors ${
            dragOver ? "border-primary bg-primary/5" : "border-border"
          }`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Upload className="mb-4 size-10 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium">
              Drag & drop your CSV file
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              or click to browse
            </p>
            <label>
              <Button variant="outline" asChild>
                <span>
                  <FileSpreadsheet className="mr-2 size-4" />
                  Browse Files
                </span>
              </Button>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileInput}
              />
            </label>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <Badge variant="default">{validCount} valid</Badge>
              {errorCount > 0 && (
                <Badge variant="destructive">{errorCount} errors</Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setRows([])
                  setResult(null)
                }}
              >
                Clear
              </Button>
              <Button
                onClick={handleImport}
                disabled={importing || validCount === 0}
              >
                {importing ? "Importing..." : `Import ${validCount} Posts`}
              </Button>
            </div>
          </div>

          {result && (
            <Card className="border-green-500/30 bg-green-500/5">
              <CardContent className="flex items-center gap-2 py-3">
                <Check className="size-4 text-green-500" />
                <span>
                  Imported {result.imported} posts.{" "}
                  {result.failed > 0 && `${result.failed} failed.`}
                </span>
              </CardContent>
            </Card>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Scheduled At</TableHead>
                  <TableHead>Media</TableHead>
                  <TableHead className="w-8">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, i) => (
                  <TableRow
                    key={i}
                    className={row.valid ? "" : "bg-destructive/5"}
                  >
                    <TableCell className="text-muted-foreground">
                      {i + 1}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{row.platform}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {row.content}
                    </TableCell>
                    <TableCell className="text-sm">{row.scheduled_at}</TableCell>
                    <TableCell className="max-w-32 truncate text-sm">
                      {row.media_url || "-"}
                    </TableCell>
                    <TableCell>
                      {row.valid ? (
                        <Check className="size-4 text-green-500" />
                      ) : (
                        <span title={row.errors.join("\n")}>
                          <AlertCircle className="size-4 text-destructive" />
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}
