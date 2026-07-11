import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Gamepad2,
  LayoutDashboard,
  Library,
  Calendar,
  BarChart3,
  Heart,
  Users,
  Settings,
  CheckSquare,
  TrendingUp,
  LogOut,
  Menu,
  Trophy,
  Star,
  MessageCircle,
  ListTodo,
  UserIcon,
  ChevronsUpDown,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
}

interface NavSection {
  label?: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    items: [{ name: "Dashboard", href: "/", icon: LayoutDashboard }],
  },
  {
    label: "Track",
    items: [
      { name: "Library", href: "/library", icon: Library },
      { name: "Tasks", href: "/tasks", icon: CheckSquare },
      { name: "Calendar", href: "/calendar", icon: Calendar },
    ],
  },
  {
    label: "Games",
    items: [
      { name: "Backlog", href: "/game-backlog", icon: ListTodo },
      { name: "Wishlist", href: "/wishlist", icon: Heart },
      { name: "Tier Lists", href: "/tier-list", icon: Trophy },
      { name: "Platforms", href: "/gaming-platforms", icon: Gamepad2 },
    ],
  },
  {
    label: "Insights",
    items: [
      { name: "Statistics", href: "/stats", icon: BarChart3 },
      { name: "Analytics", href: "/analytics", icon: TrendingUp },
    ],
  },
  {
    label: "Community",
    items: [
      { name: "Feed", href: "/posts", icon: MessageCircle },
      { name: "Members", href: "/users", icon: Users },
      { name: "Reviews", href: "/reviews", icon: Star },
    ],
  },
];

const bottomNavItems: NavItem[] = [
  { name: "Home", href: "/", icon: LayoutDashboard },
  { name: "Library", href: "/library", icon: Library },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Stats", href: "/stats", icon: BarChart3 },
];

function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "bg-gradient-aurora rounded-xl flex items-center justify-center shadow-lg shadow-primary/25",
          size === "md" ? "w-9 h-9" : "w-8 h-8"
        )}
      >
        <Gamepad2 className={cn("text-white", size === "md" ? "w-5 h-5" : "w-4 h-4")} />
      </div>
      <span className={cn("font-display font-bold tracking-tight", size === "md" ? "text-lg" : "text-base")}>
        <span className="text-foreground">Nexus</span>
        <span className="text-gradient-aurora">Play</span>
      </span>
    </div>
  );
}

function displayName(user?: User) {
  if (!user) return "User";
  if (user.firstName || user.lastName) {
    return `${user.firstName || ""} ${user.lastName || ""}`.trim();
  }
  return user.email?.split("@")[0] || "User";
}

function UserMenu({ user }: { user?: User }) {
  if (!user) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 transition-smooth hover:bg-muted text-left">
          <Avatar className="w-8 h-8 ring-2 ring-primary/30">
            <AvatarImage src={user.profileImageUrl || undefined} />
            <AvatarFallback className="text-xs bg-muted text-muted-foreground">
              {user.firstName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-foreground truncate">{displayName(user)}</div>
            <div className="text-xs text-muted-foreground truncate">{user.email}</div>
          </div>
          <ChevronsUpDown className="w-4 h-4 text-muted-foreground shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-56">
        <Link href="/profile">
          <DropdownMenuItem className="cursor-pointer">
            <UserIcon className="w-4 h-4 mr-2" />
            Profile
          </DropdownMenuItem>
        </Link>
        <Link href="/settings">
          <DropdownMenuItem className="cursor-pointer">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onClick={() => (window.location.href = "/api/logout")}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const [location] = useLocation();

  return (
    <nav className="space-y-5">
      {navSections.map((section, i) => (
        <div key={section.label || i}>
          {section.label && (
            <div className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              {section.label}
            </div>
          )}
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-smooth cursor-pointer",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <item.icon className={cn("w-[18px] h-[18px]", isActive && "text-primary")} />
                    <span>{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth() as { user?: User };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-40 glass border-b border-border/60">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/">
            <div className="cursor-pointer">
              <Logo size="sm" />
            </div>
          </Link>
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="text-foreground">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-background border-border p-0 flex flex-col">
              <div className="p-5 border-b border-border/60">
                <Logo />
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <NavLinks onNavigate={() => setMenuOpen(false)} />
              </div>
              <div className="p-3 border-t border-border/60">
                <UserMenu user={user} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-64 flex-col border-r border-border/60 bg-card/30 backdrop-blur-xl">
        <div className="px-5 py-5">
          <Link href="/">
            <div className="cursor-pointer">
              <Logo />
            </div>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <NavLinks />
        </div>
        <div className="p-3 border-t border-border/60">
          <UserMenu user={user} />
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:pl-64 min-h-screen pb-20 lg:pb-0">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 glass border-t border-border/60 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5">
          {bottomNavItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 py-2.5 cursor-pointer transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
