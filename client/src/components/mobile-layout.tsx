import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Gamepad2, 
  Home, 
  Library, 
  Calendar, 
  BarChart3, 
  Heart,
  Users,
  Settings,
  Target,
  TrendingUp,
  LogOut,
  Menu,
  MessageSquare,
  BookOpen,
  Trophy
} from "lucide-react";

interface MobileLayoutProps {
  children: ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth() as { user?: User };

  const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Tasks", href: "/tasks", icon: Target },
    { name: "Library", href: "/library", icon: Library },
    { name: "Tier List", href: "/tier-list", icon: Trophy },
    { name: "Calendar", href: "/calendar", icon: Calendar },
    { name: "Statistics", href: "/stats", icon: BarChart3 },
    { name: "Analytics", href: "/analytics", icon: TrendingUp },
    { name: "Reviews", href: "/reviews", icon: MessageSquare },
    { name: "Wishlist", href: "/wishlist", icon: Heart },
    { name: "Community", href: "/users", icon: Users },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const MobileNavigation = () => (
    <nav className="space-y-1">
      {navigation.map((item) => {
        const isActive = location === item.href;
        return (
          <Link key={item.name} href={item.href}>
            <div
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors cursor-pointer",
                isActive
                  ? "bg-primary/20 text-primary"
                  : "text-slate-300 hover:text-white hover:bg-slate-700"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </div>
          </Link>
        );
      })}
      
      {/* User Profile Section */}
      {user && (
        <div className="mt-6 pt-6 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-4 px-4">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user.profileImageUrl || undefined} />
              <AvatarFallback className="text-sm">
                {user.firstName?.[0] || user.email?.[0] || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {user.firstName || user.lastName 
                  ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                  : user.email?.split("@")[0] || "User"
                }
              </div>
              <div className="text-xs text-slate-400 truncate">
                {user.email}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700 mx-4"
            onClick={() => window.location.href = "/api/logout"}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      )}
    </nav>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-950 to-black">
      {/* Mobile Header */}
      <header className="lg:hidden bg-slate-900/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Gamepad2 className="text-white text-sm" />
            </div>
            <h1 className="text-lg font-bold text-white">NexusPlay</h1>
          </div>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="text-white">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 bg-slate-900 border-slate-700 p-0">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                    <Gamepad2 className="text-white text-lg" />
                  </div>
                  <h1 className="text-xl font-bold text-white">NexusPlay</h1>
                </div>
                <MobileNavigation />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Desktop Sidebar (Hidden on mobile) */}
      <div className="hidden lg:flex">
        <aside className="w-64 bg-dark-surface border-r border-slate-700">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Gamepad2 className="text-white text-lg" />
              </div>
              <h1 className="text-xl font-bold text-white">NexusPlay</h1>
            </div>
            <MobileNavigation />
          </div>
        </aside>
      </div>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        {children}
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700 z-50">
        <div className="grid grid-cols-5 gap-1 px-2 py-2">
          {navigation.slice(0, 5).map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    "flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors cursor-pointer",
                    isActive
                      ? "text-primary"
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  <item.icon className="w-5 h-5 mb-1" />
                  <span className="text-xs font-medium truncate max-w-full">
                    {item.name}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom padding to account for mobile navigation */}
      <div className="lg:hidden h-20"></div>
    </div>
  );
}