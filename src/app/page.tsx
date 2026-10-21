"use client";

import { useDHOIP, useHydrated } from "@/lib/store";
import { LandingPage } from "@/components/dhoip/LandingPage";
import { DirectorWorkspace } from "@/components/dhoip/director/DirectorWorkspace";
import { DoctorWorkspace } from "@/components/dhoip/doctor/DoctorWorkspace";
import { AdminWorkspace } from "@/components/dhoip/admin/AdminWorkspace";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

export default function Home() {
  const hydrated = useHydrated();
  const role = useDHOIP((s) => s.activeRole);

  return (
    <>
      <SonnerToaster position="top-right" />
      {!hydrated ? (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="size-2 rounded-full bg-primary" />
            Loading D-HOIP workspace…
          </div>
        </div>
      ) : !role ? (
        <LandingPage />
      ) : role === "director" ? (
        <DirectorWorkspace />
      ) : role === "doctor" ? (
        <DoctorWorkspace />
      ) : (
        <AdminWorkspace />
      )}
    </>
  );
}
