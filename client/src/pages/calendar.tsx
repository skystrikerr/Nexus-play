import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/sidebar";
import GamingCalendar from "@/components/gaming-calendar";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Game } from "@shared/schema";

export default function Calendar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const { data: games = [] } = useQuery<Game[]>({
    queryKey: ["/api/games"],
  });

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      
      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20" onClick={() => setSidebarOpen(false)} />
      )}

      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <header className="bg-dark-surface border-b border-slate-700 px-6 py-4">
          <div className="flex items-center space-x-4">
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                className="p-2 lg:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="w-5 h-5" />
              </Button>
            )}
            <h2 className="text-2xl font-bold text-white">Gaming Calendar</h2>
          </div>
        </header>

        <div className="p-6">
          <div className="max-w-md mx-auto">
            <GamingCalendar games={games} />
          </div>
        </div>
      </main>
    </div>
  );
}
