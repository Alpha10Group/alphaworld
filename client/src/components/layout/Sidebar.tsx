import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  FileText, 
  AlertCircle, 
  Monitor, 
  Settings, 
  LogOut,
  ChevronRight,
  Users,
  History,
  BarChart3,
  Paperclip
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api } from "@/lib/api";

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const { currentUser, currentEntity, logout } = useStore();
  const [collapsed] = useState(false);

  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
    logout();
    setLocation("/");
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: FileText, label: "Memos", href: "/memos" },
    { icon: AlertCircle, label: "Issue Tracker", href: "/issues" },
    { icon: Monitor, label: "IT Tickets", href: "/tickets" },
    { icon: Paperclip, label: "Attachments Hub", href: "/attachments" },
    { icon: Settings, label: "Settings", href: "/settings" },
    ...(currentUser?.role === 'IT' ? [
      { icon: Users, label: "User Management", href: "/admin/users" },
      { icon: History, label: "Audit Logs", href: "/admin/audit" },
      { icon: BarChart3, label: "Reports", href: "/admin/reports" },
    ] : [])
  ];

  if (!currentUser) return null;

  return (
    <aside className={cn(
      "h-screen bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 border-r border-sidebar-border",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border gap-3">
        <div className="w-8 h-8 rounded bg-[#961A1C] flex items-center justify-center text-white font-bold text-sm">A10</div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="font-heading font-bold text-lg tracking-tight leading-none">Alpha10 World</span>
            <span className="text-[10px] text-sidebar-foreground/60 truncate max-w-[150px]" title={currentEntity || ''}>
              {currentEntity}
            </span>
          </div>
        )}
      </div>

      <nav className="flex-1 py-6 px-2 space-y-1">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors group cursor-pointer",
              location === item.href 
                ? "bg-sidebar-primary text-white" 
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white"
            )}>
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && location === item.href && (
                <ChevronRight className="ml-auto w-4 h-4 opacity-50" />
              )}
            </div>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-2">
        <div className={cn(
          "w-full flex items-center gap-3 p-2 h-auto",
          collapsed ? "px-0 justify-center" : "justify-start"
        )}>
          <Avatar className="w-8 h-8 rounded-full border border-sidebar-border">
            <AvatarImage src={currentUser.avatar} />
            <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex flex-col items-start text-xs text-left overflow-hidden">
              <span className="font-semibold truncate w-32">{currentUser.name}</span>
              <span className="opacity-70 truncate w-32">{currentUser.role}</span>
            </div>
          )}
        </div>

        <Button 
          variant="ghost" 
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:text-red-500 hover:bg-red-50/10 justify-start",
            collapsed ? "px-0 justify-center" : ""
          )}
          onClick={handleLogout}
          data-testid="button-signout"
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </div>
    </aside>
  );
}
