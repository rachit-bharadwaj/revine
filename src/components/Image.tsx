import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";

type ObjectFit = "contain" | "cover" | "fill" | "none" | "scale-down";

export interface ImageProps extends Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "src" | "width" | "height" | "placeholder"
> {
  /** Image source URL or import (e.g. import logo from './logo.png') */
  src: string;
  /** Alt text — required for accessibility */
  alt: string;
  /** Intrinsic width in px. Required unless fill={true} */
  width?: number;
  /** Intrinsic height in px. Required unless fill={true} */
  height?: number;
  /**
   * Stretch the image to fill its parent container (parent must be position:relative).
   * When true, width/height are not required.
   */
  fill?: boolean;
  /** CSS object-fit when fill is true. Defaults to "cover" */
  objectFit?: ObjectFit;
  /** CSS object-position when fill is true. Defaults to "center" */
  objectPosition?: string;
  /**
   * Eagerly load the image and skip lazy loading.
   * Use for above-the-fold images (hero, LCP element).
   */
  priority?: boolean;
  /**
   * Show a blurred low-quality placeholder while the image loads.
   * Pass a base64 data URL or a solid color string like "#e5e7eb".
   * Defaults to a subtle gray shimmer if not provided.
   */
  placeholder?: string;
  /** Called when the image fails to load */
  onError?: () => void;
  /** Custom fallback element shown on error */
  fallback?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  quality?: never; // reserved for future CDN support — not implemented yet
}

const shimmerBase64 =
  "data:image/svg+xml;base64," +
  btoa(`<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'>
    <defs>
      <linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='0%'>
        <stop offset='0%' stop-color='#e8e8e8'/>
        <stop offset='50%' stop-color='#f0f0f0'/>
        <stop offset='100%' stop-color='#e8e8e8'/>
      </linearGradient>
    </defs>
    <rect width='400' height='300' fill='url(#g)'/>
  </svg>`);

export function Image({
  src,
  alt,
  width,
  height,
  fill = false,
  objectFit = "cover",
  objectPosition = "center",
  priority = false,
  placeholder,
  onError,
  fallback,
  className,
  style,
  ...rest
}: ImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // If image is already cached (e.g. browser back-nav), mark loaded immediately
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, []);

  const handleError = () => {
    setErrored(true);
    onError?.();
  };

  const placeholderSrc = placeholder ?? shimmerBase64;

  // ── Fill mode: stretch to parent container
  if (fill) {
    return (
      <span
        style={{
          position: "absolute",
          inset: 0,
          display: "block",
          overflow: "hidden",
        }}
      >
        {/* Placeholder layer */}
        {!loaded && !errored && (
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: placeholder
                ? `url(${placeholderSrc})`
                : undefined,
              backgroundColor: placeholder ? undefined : "#e8e8e8",
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: placeholder ? "blur(8px)" : undefined,
              transform: "scale(1.05)",
            }}
          />
        )}
        {!errored ? (
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            loading={priority ? "eager" : "lazy"}
            decoding={priority ? "sync" : "async"}
            fetchPriority={priority ? "high" : "auto"}
            onLoad={() => setLoaded(true)}
            onError={handleError}
            className={className}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit,
              objectPosition,
              opacity: loaded ? 1 : 0,
              transition: "opacity 300ms ease",
              ...style,
            }}
            {...rest}
          />
        ) : fallback ? (
          <>{fallback}</>
        ) : (
          <DefaultFallback fill />
        )}
      </span>
    );
  }

  // ── Fixed size mode
  if (!width || !height) {
    console.warn(
      "[Revine <Image>] `width` and `height` are required when `fill` is not set. " +
        `Missing on: ${src}`,
    );
  }

  return (
    <span
      style={{
        display: "inline-block",
        position: "relative",
        width: width ? `${width}px` : undefined,
        height: height ? `${height}px` : undefined,
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {/* Placeholder layer */}
      {!loaded && !errored && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: placeholder ? `url(${placeholderSrc})` : undefined,
            backgroundColor: placeholder ? undefined : "#e8e8e8",
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: placeholder ? "blur(8px)" : undefined,
            transform: "scale(1.05)",
          }}
        />
      )}
      {!errored ? (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          fetchPriority={priority ? "high" : "auto"}
          onLoad={() => setLoaded(true)}
          onError={handleError}
          className={className}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: loaded ? 1 : 0,
            transition: "opacity 300ms ease",
            ...style,
          }}
          {...rest}
        />
      ) : fallback ? (
        <>{fallback}</>
      ) : (
        <DefaultFallback width={width} height={height} />
      )}
    </span>
  );
}

function DefaultFallback({
  width,
  height,
  fill,
}: {
  width?: number;
  height?: number;
  fill?: boolean;
}) {
  return (
    <span
      role="img"
      aria-label="Image failed to load"
      style={{
        position: fill ? "absolute" : "relative",
        inset: fill ? 0 : undefined,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: fill ? "100%" : width ? `${width}px` : "100%",
        height: fill ? "100%" : height ? `${height}px` : "100%",
        background: "#f3f4f6",
        color: "#9ca3af",
        fontSize: "12px",
        fontFamily: "system-ui, sans-serif",
        gap: "6px",
        flexDirection: "column",
      }}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
      <span>Failed to load</span>
    </span>
  );
}
