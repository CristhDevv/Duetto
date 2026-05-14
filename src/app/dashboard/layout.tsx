import BottomNav from "./BottomNav";
import { GlobalDataProvider } from "@/context/GlobalDataContext";
import { Toaster } from "react-hot-toast";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <GlobalDataProvider>
      <div className="flex justify-center min-h-screen bg-surface">
        <div className="w-full max-w-md bg-white min-h-screen relative flex flex-col shadow-sm">
          <main className="flex-1 pb-16">
            {children}
          </main>
          <BottomNav />
        </div>
      </div>
      <Toaster position="top-center" />
    </GlobalDataProvider>
  );
}
