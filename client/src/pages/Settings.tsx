import Sidebar from "@/components/layout/Sidebar";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, Mail, MessageSquare, Monitor, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { notificationSettings, updateNotificationSettings, currentUser } = useStore();
  const { toast } = useToast();

  const [settings, setSettings] = useState(notificationSettings);

  // Sync with store when it changes (or on mount)
  useEffect(() => {
    setSettings(notificationSettings);
  }, [notificationSettings]);

  const handleSave = () => {
    updateNotificationSettings(settings);
    toast({ 
      title: "Settings Saved", 
      description: "Your notification preferences have been updated." 
    });
  };

  return (
    <div className="flex h-screen w-full bg-slate-50/50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-heading font-bold text-slate-900">Settings</h1>
            <p className="text-slate-500 mt-1">Manage your account preferences and notifications.</p>
          </div>

          <Card className="border-none shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-white">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                <CardTitle>Notification Preferences</CardTitle>
              </div>
              <CardDescription>
                Choose how you want to be notified about important updates.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              
              {/* Desktop Notifications */}
              <div className="flex items-start justify-between space-x-4">
                <div className="flex items-start space-x-4">
                  <div className="mt-1 bg-slate-100 p-2 rounded-lg">
                    <Monitor className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="desktop-notif" className="text-base font-medium">Desktop Notifications</Label>
                    <p className="text-sm text-slate-500 max-w-sm">
                      Receive push notifications on your desktop when the app is open.
                    </p>
                  </div>
                </div>
                <Switch 
                  id="desktop-notif" 
                  checked={settings.desktop}
                  onCheckedChange={(checked) => setSettings({ ...settings, desktop: checked })}
                />
              </div>

              <div className="h-px bg-slate-100" />

              {/* Email Notifications */}
              <div className="space-y-4">
                <div className="flex items-start justify-between space-x-4">
                  <div className="flex items-start space-x-4">
                    <div className="mt-1 bg-slate-100 p-2 rounded-lg">
                      <Mail className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="email-notif" className="text-base font-medium">Email Notifications</Label>
                      <p className="text-sm text-slate-500 max-w-sm">
                        Receive daily summaries and critical alerts via email.
                      </p>
                    </div>
                  </div>
                  <Switch 
                    id="email-notif" 
                    checked={settings.email}
                    onCheckedChange={(checked) => setSettings({ ...settings, email: checked })}
                  />
                </div>
                
                {settings.email && (
                  <div className="ml-14 pl-1">
                    <Label htmlFor="email-address" className="text-sm text-slate-600 mb-1.5 block">Email Address</Label>
                    <Input 
                      id="email-address" 
                      value={settings.emailAddress}
                      onChange={(e) => setSettings({ ...settings, emailAddress: e.target.value })}
                      className="max-w-md bg-slate-50"
                    />
                  </div>
                )}
              </div>

              <div className="h-px bg-slate-100" />

              {/* SMS Notifications */}
              <div className="space-y-4">
                <div className="flex items-start justify-between space-x-4">
                  <div className="flex items-start space-x-4">
                    <div className="mt-1 bg-slate-100 p-2 rounded-lg">
                      <MessageSquare className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="sms-notif" className="text-base font-medium">SMS Notifications</Label>
                      <p className="text-sm text-slate-500 max-w-sm">
                        Get instant text messages for urgent items requiring your approval.
                      </p>
                    </div>
                  </div>
                  <Switch 
                    id="sms-notif" 
                    checked={settings.sms}
                    onCheckedChange={(checked) => setSettings({ ...settings, sms: checked })}
                  />
                </div>

                {settings.sms && (
                  <div className="ml-14 pl-1">
                    <Label htmlFor="phone-number" className="text-sm text-slate-600 mb-1.5 block">Phone Number</Label>
                    <Input 
                      id="phone-number" 
                      value={settings.phoneNumber}
                      onChange={(e) => setSettings({ ...settings, phoneNumber: e.target.value })}
                      className="max-w-md bg-slate-50"
                    />
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end">
                <Button onClick={handleSave} className="gap-2">
                  <Save className="w-4 h-4" /> Save Preferences
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
