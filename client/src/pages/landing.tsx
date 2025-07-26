import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Users, BarChart3, Calendar, Timer } from "lucide-react";

export function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-white mb-6">
            Activity Tracker
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Track your games, study sessions, workouts, reading, and more. 
            Share your progress with friends and discover what others are doing.
          </p>
          <Button 
            size="lg" 
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg"
            onClick={() => window.location.href = "/api/login"}
          >
            Get Started
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Play className="h-8 w-8 text-purple-400" />
                <CardTitle className="text-white">Multi-Activity Tracking</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Track games, study sessions, work projects, exercise, reading, hobbies, and more - all in one place.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Timer className="h-8 w-8 text-blue-400" />
                <CardTitle className="text-white">Built-in Timer</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Start timers directly from your activities, track quality and productivity, and save detailed session notes.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-green-400" />
                <CardTitle className="text-white">Social Features</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                View other users' public activities and sessions. Get inspired by what others are working on.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-yellow-400" />
                <CardTitle className="text-white">Detailed Statistics</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Comprehensive stats by activity type, completion rates, time tracking, and progress visualization.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-red-400" />
                <CardTitle className="text-white">Calendar View</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Visual calendar showing all your activities and sessions over time with color-coded categories.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Play className="h-8 w-8 text-pink-400" />
                <CardTitle className="text-white">Image Support</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Add custom images to your activities for better visual identification and personalization.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to start tracking?</h2>
          <Button 
            size="lg" 
            variant="outline"
            className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white px-8 py-4 text-lg"
            onClick={() => window.location.href = "/api/login"}
          >
            Sign In to Continue
          </Button>
        </div>
      </div>
    </div>
  );
}