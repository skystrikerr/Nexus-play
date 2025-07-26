import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Menu, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Sidebar from "@/components/sidebar";
import AddGameModal from "@/components/add-game-modal";
import GameCard from "@/components/game-card";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Activity } from "@shared/schema";

export default function Wishlist() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const { data: activities = [], isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  // Filter for wishlist items
  const wishlistActivities = activities.filter(activity => activity.status === "wishlist");
  
  const filteredActivities = wishlistActivities.filter(activity => 
    activity.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <div className="flex items-center justify-between">
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
              <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                <Heart className="w-6 h-6 text-red-400" />
                <span>Wishlist</span>
              </h2>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative hidden md:block">
                <Input
                  type="text"
                  placeholder="Search wishlist..."
                  className="bg-dark-bg border-slate-600 pl-10 w-80"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              </div>
              
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-primary hover:bg-primary/80 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Activity
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Mobile Search */}
          {isMobile && (
            <div className="mb-6">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search wishlist..."
                  className="bg-dark-bg border-slate-600 pl-10 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              </div>
            </div>
          )}

          {/* Stats Bar */}
          <div className="bg-dark-surface rounded-xl p-4 mb-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div>
                  <p className="text-slate-400 text-sm">Total Wishlist Items</p>
                  <p className="text-xl font-bold text-white">{wishlistActivities.length}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Games</p>
                  <p className="text-xl font-bold text-blue-400">
                    {wishlistActivities.filter(a => a.type === 'game').length}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Other Activities</p>
                  <p className="text-xl font-bold text-green-400">
                    {wishlistActivities.filter(a => a.type !== 'game').length}
                  </p>
                </div>
              </div>
              
              <Heart className="w-8 h-8 text-red-400" />
            </div>
          </div>

          {/* Activity Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-slate-400">Loading wishlist...</div>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchQuery ? "No results found" : "Your wishlist is empty"}
              </h3>
              <p className="text-slate-400 mb-6">
                {searchQuery 
                  ? "Try adjusting your search terms" 
                  : "Add some activities you want to try in the future!"
                }
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => setShowAddModal(true)}
                  className="bg-primary hover:bg-primary/80 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Item
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredActivities.map((activity) => (
                <GameCard key={activity.id} game={activity} />
              ))}
            </div>
          )}
        </div>
      </main>

      <AddGameModal 
        open={showAddModal} 
        onOpenChange={setShowAddModal} 
      />
    </div>
  );
}