"use client";

import React from "react";

interface UserAvatarProps {
  fullName?: string;
  email?: string;
  profilePicture?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function getInitials(fullName?: string, email?: string): string {
  const source = (fullName || email || "U").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function resizeImageToAvatarDataUrl(file: File, maxSize = 160): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Invalid image file."));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context unavailable."));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}

export function UserAvatar({
  fullName,
  email,
  profilePicture,
  size = "sm",
  className = "",
}: UserAvatarProps) {
  const sizeClasses =
    size === "lg"
      ? "w-14 h-14 text-base"
      : size === "md"
      ? "w-9 h-9 text-xs"
      : "w-7 h-7 text-[10px]";

  if (profilePicture && (profilePicture.startsWith("data:image/") || profilePicture.startsWith("https://"))) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={profilePicture}
        alt={fullName || email || "User avatar"}
        className={`${sizeClasses} rounded-full object-cover border border-line-accent shrink-0 ${className}`}
      />
    );
  }

  return (
    <span
      className={`${sizeClasses} rounded-full bg-cyan-500/15 border border-line-accent text-accent-text font-bold inline-flex items-center justify-center shrink-0 select-none ${className}`}
    >
      {getInitials(fullName, email)}
    </span>
  );
}
