import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Camera, Shield, Eye, EyeOff, Save, UserIcon } from "lucide-react";
import type { User } from "@shared/schema";

export default function Profile() {
  const { user } = useAuth() as { user?: User };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [profileImageUrl, setProfileImageUrl] = useState("");

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setBio(user.bio || "");
      setIsPublic(Boolean(user.isPublic));
      setProfileImageUrl(user.profileImageUrl || "");
    }
  }, [user]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PUT", "/api/profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Profile photo upload
  const uploadPhotoMutation = useMutation({
    mutationFn: (photoUrl: string) => apiRequest("PUT", "/api/profile/photo", { 
      profileImageUrl: photoUrl 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Photo Updated",
        description: "Your profile photo has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile photo.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateProfileMutation.mutate({
      firstName,
      lastName,
      bio,
      isPublic: isPublic ? 1 : 0,
    });
  };

  const handlePhotoSave = () => {
    const url = profileImageUrl.trim();
    if (!url.startsWith("https://")) {
      toast({
        title: "Invalid URL",
        description: "Please enter an https:// image URL.",
        variant: "destructive",
      });
      return;
    }
    uploadPhotoMutation.mutate(url);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-white text-center">
          <UserIcon className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <p>Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your profile information and privacy settings
          </p>
        </div>

        {/* Profile Photo Section */}
        <Card className="bg-slate-900 border-border">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Profile Photo
            </CardTitle>
            <CardDescription>
              Paste a link to an image to personalize your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profileImageUrl} alt="Profile" />
                <AvatarFallback className="text-2xl">
                  {firstName?.[0] || lastName?.[0] || user.email?.[0] || "?"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="https://example.com/photo.jpg"
                    value={profileImageUrl}
                    onChange={(e) => setProfileImageUrl(e.target.value)}
                    className="bg-muted border-input text-foreground placeholder:text-muted-foreground/60"
                  />
                  <Button
                    onClick={handlePhotoSave}
                    disabled={uploadPhotoMutation.isPending}
                    className="bg-gradient-aurora text-white hover:opacity-90 shrink-0"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {uploadPhotoMutation.isPending ? "Saving..." : "Save Photo"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use a direct https image link (JPG, PNG, or GIF)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card className="bg-slate-900 border-border">
          <CardHeader>
            <CardTitle className="text-white">Basic Information</CardTitle>
            <CardDescription>
              Update your personal details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-white">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="bg-slate-800 border-border text-white"
                  placeholder="Enter your first name"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-white">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="bg-slate-800 border-border text-white"
                  placeholder="Enter your last name"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input
                id="email"
                value={user.email || ""}
                disabled
                className="bg-slate-800 border-border text-muted-foreground"
              />
              <p className="text-xs text-slate-500 mt-1">
                Email cannot be changed for security reasons
              </p>
            </div>

            <div>
              <Label htmlFor="bio" className="text-white">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="bg-slate-800 border-border text-white min-h-[100px]"
                placeholder="Tell others about yourself..."
                maxLength={500}
              />
              <p className="text-xs text-slate-500 mt-1">
                {bio.length}/500 characters
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card className="bg-slate-900 border-border">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Privacy & Security
            </CardTitle>
            <CardDescription>
              Control who can see your profile and activities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
              <div className="flex items-center gap-3">
                {isPublic ? (
                  <Eye className="w-5 h-5 text-green-400" />
                ) : (
                  <EyeOff className="w-5 h-5 text-red-400" />
                )}
                <div>
                  <h3 className="text-white font-medium">
                    {isPublic ? "Public Profile" : "Private Profile"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isPublic 
                      ? "Others can see your profile, activities, and progress"
                      : "Your profile is hidden from other users"
                    }
                  </p>
                </div>
              </div>
              <Switch
                checked={isPublic}
                onCheckedChange={setIsPublic}
                className="data-[state=checked]:bg-green-600"
              />
            </div>

            <div className="p-4 bg-slate-800 rounded-lg border border-yellow-500/20">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div>
                  <h4 className="text-white font-medium">Security Notice</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your profile photo and uploaded content are stored securely with encryption.
                    Only you can control who sees your information.
                  </p>
                </div>
              </div>
            </div>

            {!isPublic && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <Badge variant="outline" className="border-red-500 text-red-400 mb-2">
                  Private Mode
                </Badge>
                <p className="text-sm text-muted-foreground">
                  When your profile is private:
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1 ml-4">
                  <li>• Other users cannot see your profile or activities</li>
                  <li>• You won't appear in community searches</li>
                  <li>• Your game progress and stats remain hidden</li>
                  <li>• You can still use all features privately</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={updateProfileMutation.isPending}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}