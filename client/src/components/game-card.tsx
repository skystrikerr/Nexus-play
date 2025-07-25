import { Star, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Game } from "@shared/schema";

interface GameCardProps {
  game: Game;
  onClick?: () => void;
}

const statusColors = {
  playing: "bg-primary/20 text-primary",
  completed: "bg-green-500/20 text-green-400",
  dropped: "bg-red-500/20 text-red-400",
  wishlist: "bg-yellow-500/20 text-yellow-400",
};

const statusLabels = {
  playing: "Playing",
  completed: "Completed",
  dropped: "Dropped",
  wishlist: "Wishlist",
};

export default function GameCard({ game, onClick }: GameCardProps) {
  const progressColor = 
    game.status === "completed" ? "bg-green-500" :
    game.status === "dropped" ? "bg-red-500" : 
    "bg-primary";

  return (
    <div 
      className="bg-dark-surface rounded-xl p-6 border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center space-x-4">
        {game.coverImage ? (
          <img
            src={game.coverImage}
            alt={`${game.title} cover`}
            className="w-16 h-20 rounded-lg object-cover"
          />
        ) : (
          <div className="w-16 h-20 rounded-lg bg-slate-700 flex items-center justify-center">
            <span className="text-slate-400 text-xs">No Image</span>
          </div>
        )}
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-lg font-semibold text-white">{game.title}</h4>
              <p className="text-slate-400 text-sm">
                {game.platform} {game.genre && `• ${game.genre}`}
              </p>
              
              <div className="flex items-center space-x-4 mt-2">
                {game.rating && (
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          "w-4 h-4",
                          star <= game.rating! ? "text-yellow-400 fill-current" : "text-slate-600"
                        )}
                      />
                    ))}
                    <span className="text-slate-400 text-sm ml-1">{game.rating}.0</span>
                  </div>
                )}
                
                <span className={cn("px-2 py-1 rounded-full text-xs font-medium", statusColors[game.status as keyof typeof statusColors])}>
                  {statusLabels[game.status as keyof typeof statusLabels]}
                </span>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-slate-400 text-sm">Progress</p>
              <p className="text-white font-semibold">{game.progress}%</p>
              <p className="text-slate-400 text-xs flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {game.hoursPlayed}h played
              </p>
            </div>
          </div>
          
          <div className="mt-3">
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div 
                className={cn("h-2 rounded-full", progressColor)} 
                style={{ width: `${game.progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
