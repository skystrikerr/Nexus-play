import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/page-header";
import AddGameModal from "@/components/add-game-modal";
import GameCard from "@/components/game-card";
import type { Activity } from "@shared/schema";

export default function Wishlist() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: activities = [], isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  const wishlistActivities = activities.filter(activity => activity.status === "wishlist");

  const filteredActivities = wishlistActivities.filter(activity =>
    activity.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const gameCount = wishlistActivities.filter(a => a.type === "game").length;
  const otherCount = wishlistActivities.length - gameCount;

  return (
    <>
      <PageHeader
        title="Wishlist"
        subtitle={`${wishlistActivities.length} saved · ${gameCount} games · ${otherCount} other`}
        actions={
          <Button
            className="bg-gradient-aurora text-white hover:opacity-90 shadow-lg shadow-primary/20"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Activity
          </Button>
        }
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Search */}
        <div className="relative sm:w-72 mb-6">
          <Input
            type="text"
            placeholder="Search wishlist..."
            className="bg-muted border-input pl-10 text-foreground placeholder:text-muted-foreground/60"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        </div>

        {/* Activity Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <div key={i} className="shimmer rounded-xl h-32" />)}
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="glass-glow rounded-xl p-12 text-center">
            <Heart className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-lg font-display font-semibold text-foreground mb-1">
              {searchQuery ? "No results found" : "Your wishlist is empty"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? "Try adjusting your search terms"
                : "Add some activities you want to try in the future!"
              }
            </p>
            {!searchQuery && (
              <Button
                className="bg-gradient-aurora text-white hover:opacity-90"
                onClick={() => setShowAddModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Item
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredActivities.map((activity) => (
              <GameCard key={activity.id} game={activity} />
            ))}
          </div>
        )}
      </div>

      <AddGameModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
      />
    </>
  );
}
