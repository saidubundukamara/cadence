import { CheckCircle2, XCircle } from "lucide-react"
import { platformConfig } from "@/lib/platform-config"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import type { PostWithResults } from "@/types"

type PostResultsSummaryProps = {
  results: PostWithResults["results"]
}

export function PostResultsSummary({ results }: PostResultsSummaryProps) {
  if (results.length === 0) return null

  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 rounded-md bg-muted/50 px-3 py-2 text-xs">
      {results.map((result) => {
        const config = platformConfig[result.platform]
        const Icon = config.icon
        const isSuccess = result.status === "PUBLISHED"

        const content = (
          <div key={result.id} className="flex items-center gap-1.5">
            <Icon className={`size-3.5 ${config.color}`} />
            {isSuccess ? (
              <CheckCircle2 className="size-3.5 text-emerald-500" />
            ) : (
              <XCircle className="size-3.5 text-destructive" />
            )}
            <span className="text-muted-foreground">
              {isSuccess ? "Published" : "Failed"}
            </span>
          </div>
        )

        if (!isSuccess && result.error) {
          return (
            <Tooltip key={result.id}>
              <TooltipTrigger asChild>
                <div className="cursor-help">{content}</div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{result.error}</p>
              </TooltipContent>
            </Tooltip>
          )
        }

        return content
      })}
    </div>
  )
}
