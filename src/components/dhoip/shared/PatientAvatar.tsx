"use client";

import { User } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * PatientAvatar — a single, restrained human silhouette.
 * No gender-tinted backgrounds, no decorative color — just the icon
 * in the ink color, on a quiet surface. Clinical, uniform, scannable.
 */
export function PatientAvatar({
  patient,
  size = "md",
  className,
}: {
  patient: { gender?: string; firstName?: string; lastName?: string };
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizes: Record<string, string> = {
    sm: "size-7",
    md: "size-9",
    lg: "size-12",
    xl: "size-16",
  };
  const iconSizes: Record<string, string> = {
    sm: "size-3.5",
    md: "size-4",
    lg: "size-5",
    xl: "size-7",
  };
  const name = patient.firstName
    ? `${patient.firstName} ${patient.lastName || ""}`.trim()
    : "Patient";

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center bg-surface text-slate",
        sizes[size],
        className
      )}
      title={name}
      aria-label={name}
    >
      <User className={iconSizes[size]} />
    </div>
  );
}
