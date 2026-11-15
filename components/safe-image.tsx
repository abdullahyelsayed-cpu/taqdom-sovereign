"use client";

import React, { useEffect, useState } from "react";
import Image, { ImageProps } from "next/image";

interface SafeImageProps extends Omit<ImageProps, "onError" | "src"> {
  src?: string | null;
  fallbackSrc?: string;
}

export function SafeImage({
  src,
  fallbackSrc = "/images/ultra/haven-hero.webp",
  alt,
  ...rest
}: SafeImageProps) {
  const resolved = typeof src === "string" && src.trim() ? src.trim() : fallbackSrc;
  const [currentSrc, setCurrentSrc] = useState<string>(resolved);

  useEffect(() => {
    setCurrentSrc(typeof src === "string" && src.trim() ? src.trim() : fallbackSrc);
  }, [src, fallbackSrc]);

  return (
    <Image
      {...rest}
      src={currentSrc}
      alt={alt}
      onError={() => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
    />
  );
}
