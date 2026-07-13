import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { AuthGuard } from "@/components/AuthGuard";
import { ToastProvider } from "@/components/Toast";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  try {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");
  } catch {
    redirect("/sign-in");
  }

  return (
    <AuthGuard>
      <ToastProvider />
      <Sidebar />
      {/*
        Content pushed right: sidebar (240px) + left margin (12px) + gap (8px)
        On collapsed sidebar: sidebar (68px) + left margin (12px) + gap (8px)
        We handle this in globals.css via a class on <body> toggled by Sidebar
        For SSR simplicity we use the expanded width as default.
      */}
      <div id="app-content" className="app-content flex flex-col min-h-screen overflow-hidden w-full">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6 subtle-grid w-full">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
