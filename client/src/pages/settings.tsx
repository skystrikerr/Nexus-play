import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { 
  Settings as SettingsIcon, 
  User, 
  Palette, 
  Bell, 
  Shield, 
  Monitor,
  Sun,
  Moon,
  Key
} from "lucide-react";
import { ChangePasswordModal } from "@/components/change-password-modal";

interface UserSettings {
  theme: "light" | "dark" | "system";
  isPublic: boolean;
  bio: string;
  firstName: string;
  lastName: string;
  notifications: {
    achievements: boolean;
    reminders: boolean;
    social: boolean;
  };
}

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("profile");
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Load user settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/settings"],
    enabled: !!user,
  });

  const form = useForm<UserSettings>({
    defaultValues: {
      theme: theme,
      isPublic: true,
      bio: "",
      firstName: "",
      lastName: "",
      notifications: {
        achievements: true,
        reminders: true,
        social: true,
      },
    },
  });

  // Update form when settings are loaded
  useEffect(() => {
    if (settings) {
      form.reset({
        theme: (settings as any)?.theme || theme,
        isPublic: (settings as any)?.isPublic ?? true,
        bio: (settings as any)?.bio || "",
        firstName: (settings as any)?.firstName || "",
        lastName: (settings as any)?.lastName || "",
        notifications: (settings as any)?.notifications || {
          achievements: true,
          reminders: true,
          social: true,
        },
      });
    }
  }, [settings, theme, form]);

  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<UserSettings>) => 
      apiRequest("PUT", "/api/settings", data),
    onSuccess: (_, variables) => {
      // Update local theme if it was changed
      if (variables.theme) {
        setTheme(variables.theme);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Settings Updated",
        description: "Your settings have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UserSettings) => {
    updateSettingsMutation.mutate(data);
  };

  // Handle theme change immediately
  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    form.setValue("theme", newTheme);
    setTheme(newTheme);
    updateSettingsMutation.mutate({ theme: newTheme });
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Shield },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <SettingsIcon className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="md:col-span-1">
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="md:col-span-3">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Profile Settings */}
              {activeTab === "profile" && (
                <Card className="glass border-border/60">
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Profile Information
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Update your personal information and bio
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">First Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Your first name"
                                className="bg-muted border-input text-foreground"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">Last Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Your last name"
                                className="bg-muted border-input text-foreground"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">Bio</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Tell others about yourself..."
                              className="bg-muted border-input text-foreground"
                              rows={4}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Appearance Settings */}
              {activeTab === "appearance" && (
                <Card className="glass border-border/60">
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      Appearance
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Customize the look and feel of NexusPlay
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="theme"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">Theme</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              handleThemeChange(value as "light" | "dark" | "system");
                            }} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-muted border-input text-foreground">
                                <SelectValue placeholder="Select theme" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-muted border-input">
                              <SelectItem value="light" className="flex items-center">
                                <div className="flex items-center gap-2">
                                  <Sun className="w-4 h-4" />
                                  Light
                                </div>
                              </SelectItem>
                              <SelectItem value="dark" className="flex items-center">
                                <div className="flex items-center gap-2">
                                  <Moon className="w-4 h-4" />
                                  Dark
                                </div>
                              </SelectItem>
                              <SelectItem value="system" className="flex items-center">
                                <div className="flex items-center gap-2">
                                  <Monitor className="w-4 h-4" />
                                  System
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="w-20 h-12 bg-muted border-2 border-blue-600 rounded-lg mb-2 mx-auto"></div>
                        <p className="text-sm text-muted-foreground">Dark (Current)</p>
                      </div>
                      <div className="text-center">
                        <div className="w-20 h-12 bg-white border-2 border-slate-300 rounded-lg mb-2 mx-auto"></div>
                        <p className="text-sm text-muted-foreground">Light</p>
                      </div>
                      <div className="text-center">
                        <div className="w-20 h-12 bg-gradient-to-r from-white to-slate-800 border-2 border-slate-500 rounded-lg mb-2 mx-auto"></div>
                        <p className="text-sm text-muted-foreground">System</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notification Settings */}
              {activeTab === "notifications" && (
                <Card className="glass border-border/60">
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <Bell className="w-5 h-5" />
                      Notifications
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Manage your notification preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="notifications.achievements"
                      render={({ field }) => (
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <FormLabel className="text-foreground">Achievement Notifications</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Get notified when you complete games or reach milestones
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </div>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="notifications.reminders"
                      render={({ field }) => (
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <FormLabel className="text-foreground">Activity Reminders</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Remind you to log your activity sessions
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </div>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="notifications.social"
                      render={({ field }) => (
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <FormLabel className="text-foreground">Social Updates</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Get notified about friend activities and community updates
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </div>
                      )}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Privacy Settings */}
              {activeTab === "privacy" && (
                <Card className="glass border-border/60">
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Privacy & Security
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Control your privacy and data sharing preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="isPublic"
                      render={({ field }) => (
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <FormLabel className="text-foreground">Public Profile</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              {field.value 
                                ? "Your profile is visible to everyone. Other users can see your activities, sessions, and reviews."
                                : "Your profile is private. You won't appear in community searches and only you can see your data."}
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </div>
                      )}
                    />
                    
                    {/* Password Management - only for local accounts */}
                    {(user as any)?.provider === 'local' && (
                      <div className="p-4 bg-muted rounded-lg border border-border">
                        <h4 className="text-foreground font-medium mb-2 flex items-center gap-2">
                          <Key className="w-4 h-4" />
                          Password Management
                        </h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Change your account password for better security
                        </p>
                        <Button 
                          onClick={() => setShowChangePassword(true)}
                          variant="outline" 
                          className="border-border text-foreground hover:bg-muted"
                        >
                          Change Password
                        </Button>
                      </div>
                    )}

                    <div className="p-4 bg-muted rounded-lg border border-border">
                      <h4 className="text-foreground font-medium mb-2">Data Export</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Download a copy of all your NexusPlay data
                      </p>
                      <Button variant="outline" className="border-border text-foreground hover:bg-muted">
                        Download My Data
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Save Button */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="bg-gradient-aurora hover:opacity-90 text-foreground"
                  disabled={updateSettingsMutation.isPending}
                >
                  {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal 
        open={showChangePassword} 
        onOpenChange={setShowChangePassword} 
      />
    </div>
  );
}