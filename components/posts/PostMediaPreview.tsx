import Image from "next/image"

type PostMediaPreviewProps = {
  mediaUrls: string[]
}

const MAX_VISIBLE = 4

export function PostMediaPreview({ mediaUrls }: PostMediaPreviewProps) {
  if (mediaUrls.length === 0) return null

  const visible = mediaUrls.slice(0, MAX_VISIBLE)
  const overflow = mediaUrls.length - MAX_VISIBLE

  return (
    <div className="flex gap-1.5">
      {visible.map((url, i) => (
        <div
          key={url}
          className="relative size-12 shrink-0 overflow-hidden rounded-md border bg-muted"
        >
          {i === MAX_VISIBLE - 1 && overflow > 0 ? (
            <>
              <Image
                src={url}
                alt=""
                fill
                className="object-cover opacity-40"
                loading="lazy"
                sizes="48px"
              />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
                +{overflow}
              </span>
            </>
          ) : (
            <Image
              src={url}
              alt=""
              fill
              className="object-cover"
              loading="lazy"
              sizes="48px"
            />
          )}
        </div>
      ))}
    </div>
  )
}
