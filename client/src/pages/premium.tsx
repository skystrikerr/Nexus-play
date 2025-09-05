import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, BarChart3, Users, Trophy, Download, Palette, Award, Star } from "lucide-react";

export function Premium() {
  const features = [
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Detailed insights with custom date ranges, activity comparisons, and productivity trends",
      color: "text-purple-400"
    },
    {
      icon: Download,
      title: "Data Export",
      description: "Export your data to CSV, PDF, or JSON formats for external analysis",
      color: "text-blue-400"
    },
    {
      icon: Palette,
      title: "Custom Themes",
      description: "Personalize your experience with exclusive themes and layout options",
      color: "text-pink-400"
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Share activities with team members, group analytics, and collaborative goals",
      color: "text-green-400"
    },
    {
      icon: Award,
      title: "Achievement System",
      description: "Unlock exclusive badges, streaks, and milestone celebrations",
      color: "text-yellow-400"
    },
    {
      icon: Zap,
      title: "API Access",
      description: "Connect with external tools and services through our API",
      color: "text-orange-400"
    }
  ];

  return (
    <div className="min-h-screen bg-dark-bg p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Star className="h-8 w-8 text-yellow-400" />
            <h1 className="text-3xl font-bold text-white">NexusPlay Features</h1>
          </div>
          <p className="text-xl text-gray-400 mb-6">
            All features are available for free, supported by ads
          </p>
          <Badge variant="secondary" className="text-lg px-4 py-2 bg-green-600 text-white">
            100% Free with Ads
          </Badge>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {features.map((feature, index) => (
            <Card key={index} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-white">
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-400">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-slate-800/50 border-slate-700 text-center">
          <CardHeader>
            <CardTitle className="text-white text-2xl">Coming Soon!</CardTitle>
            <CardDescription className="text-gray-400 text-lg">
              We're working hard to bring you these amazing features. Stay tuned for updates!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">
              Our app is supported by ads to keep everything free for you.
              Thank you for your support!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}