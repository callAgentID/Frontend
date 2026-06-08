import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Animated smoke wave background */}
      <div className="smoke-particle" />
      <div className="smoke-particle" />
      <div className="smoke-particle" />

      <Sidebar />
      <div
        className="flex-1 flex flex-col min-h-screen overflow-hidden relative w-full lg:w-auto"
        style={{ background: '#0A1931' }}
      >
        <Navbar />
        <main
          className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 subtle-grid backdrop-blur-sm w-full"
          style={{ background: '#0A1931' }}
        >
          {children}
        </main>
      </div>
    </>
  );
}
