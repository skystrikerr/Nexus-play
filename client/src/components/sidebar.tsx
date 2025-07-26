import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Gamepad2, 
  Home, 
  Library, 
  Calendar, 
  BarChart3, 
  Heart,
  Users,
  LogOut
} from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth() as { user?: User };

  const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Activity Library", href: "/library", icon: Library },
    { name: "Calendar", href: "/calendar", icon: Calendar },
    { name: "Statistics", href: "/stats", icon: BarChart3 },
    { name: "Wishlist", href: "/wishlist", icon: Heart },
    { name: "Community", href: "/users", icon: Users },
  ];

  return (
    <aside className="w-64 bg-dark-surface border-r border-slate-700 hidden lg:block">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Gamepad2 className="text-white text-lg" />
          </div>
          <h1 className="text-xl font-bold text-white">ActivityTracker</h1>
        </div>
        
        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer",
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
        </nav>

        {/* User Profile Section */}
        {user && (
          <div className="mt-8 pt-6 border-t border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.profileImageUrl || undefined} />
                <AvatarFallback className="text-xs">
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
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700"
              onClick={() => window.location.href = "/api/logout"}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
