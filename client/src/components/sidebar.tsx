import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Gamepad2, 
  Home, 
  Library, 
  Calendar, 
  BarChart3, 
  Heart 
} from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Activity Library", href: "/library", icon: Library },
    { name: "Calendar", href: "/calendar", icon: Calendar },
    { name: "Statistics", href: "/stats", icon: BarChart3 },
    { name: "Wishlist", href: "/wishlist", icon: Heart },
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
      </div>
    </aside>
  );
}
