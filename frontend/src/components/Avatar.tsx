import { useState } from 'react'

/**
 * The local image that takes the place of an avatar that cannot be loaded.
 *
 * It is a file of the application and not a data URL, so the browser can
 * cache it and the placeholder costs no extra request per broken avatar.
 */
const PLACEHOLDER_SRC = '/avatar-placeholder.svg'

interface AvatarProps {
  /** The address of the avatar. */
  src: string
  /** The description of the avatar for a screen reader. */
  alt: string
  /** The width of the image in pixels, used to reserve the space. */
  width: number
  /** The height of the image in pixels, used to reserve the space. */
  height: number
  /** The classes of the image, usually the size and the rounding. */
  className?: string
  /** Whether the browser should wait before loading the image. */
  loading?: 'eager' | 'lazy'
}

/**
 * The avatar of a GitHub account.
 *
 * GitHub serves the avatars from its own servers, and an avatar can be
 * missing: the account was deleted, the picture was replaced, or the server
 * did not answer. A broken image would leave a hole in the layout and show
 * the browser's own error icon, so the placeholder takes its place when the
 * load fails.
 *
 * The address that failed is remembered instead of a plain "failed" flag,
 * so a different account, with a working avatar, is not blocked by the
 * failure of the previous one.
 */
export function Avatar({ src, alt, width, height, className, loading }: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  const hasFailed = failedSrc === src

  return (
    <img
      src={hasFailed ? PLACEHOLDER_SRC : src}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      onError={() => setFailedSrc(src)}
      className={className}
    />
  )
}
