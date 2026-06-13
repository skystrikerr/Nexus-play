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
  Settings,
  Target,
  TrendingUp,
  LogOut,
  Trophy,
  Crown,
  UserIcon,
  MessageCircle
} from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth() as { user?: User };

  const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Posts", href: "/posts", icon: MessageCircle },
    { name: "Task Manager", href: "/tasks", icon: Target },
    { name: "Activity Library", href: "/library", icon: Library },
    { name: "Calendar", href: "/calendar", icon: Calendar },
    { name: "Statistics", href: "/stats", icon: BarChart3 },
    { name: "Analytics", href: "/analytics", icon: TrendingUp },
    { name: "Wishlist", href: "/wishlist", icon: Heart },
    { name: "Game Backlog", href: "/game-backlog", icon: Gamepad2 },
    { name: "Community", href: "/users", icon: Users },
    { name: "Gaming Platforms", href: "/gaming-platforms", icon: Trophy },
    { name: "Profile", href: "/profile", icon: UserIcon },
    { name: "Features", href: "/premium", icon: Crown },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-card border-r border-border hidden lg:block">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-gradient-aurora rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Gamepad2 className="text-white text-lg" />
          </div>
          <h1 className="text-xl font-display font-bold text-foreground">NexusPlay</h1>
        </div>
        
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2.5 rounded-lg font-medium transition-smooth cursor-pointer",
                    isActive
                      ? "nav-active-aurora text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {user && (
          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="w-8 h-8 ring-2 ring-primary/30">
                <AvatarImage src={user.profileImageUrl || undefined} />
                <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                  {user.firstName?.[0] || user.email?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">
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
              className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted"
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
