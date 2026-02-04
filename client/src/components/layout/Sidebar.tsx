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
  Menu,
  Bell
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function Sidebar() {
  const [location] = useLocation();
  const { currentUser, setCurrentUser, users, notifications, markNotificationRead } = useStore();
  const [collapsed, setCollapsed] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: FileText, label: "Memos", href: "/memos" },
    { icon: AlertCircle, label: "Issue Tracker", href: "/issues" },
    { icon: Monitor, label: "IT Tickets", href: "/tickets" },
  ];

  return (
    <aside className={cn(
      "h-screen bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 border-r border-sidebar-border",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo Area */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border gap-3">
        <img src="/logo.png" className="w-8 h-8 rounded bg-white p-1" alt="Logo" />
        {!collapsed && <span className="font-heading font-bold text-lg tracking-tight">NexusFlow</span>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-2 space-y-1">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <a className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors group",
              location === item.href 
                ? "bg-sidebar-primary text-white" 
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white"
            )}>
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && location === item.href && (
                <ChevronRight className="ml-auto w-4 h-4 opacity-50" />
              )}
            </a>
          </Link>
        ))}
      </nav>

      {/* Notifications Trigger */}
      <div className="px-2 mb-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 h-auto text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white justify-start",
              collapsed ? "px-0 justify-center" : ""
            )}>
              <div className="relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] text-white">
                    {unreadCount}
                  </span>
                )}
              </div>
              {!collapsed && <span>Notifications</span>}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 ml-2" side="right" align="end">
            <DropdownMenuLabel>Recent Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-64 overflow-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">No new notifications</div>
              ) : (
                notifications.map(n => (
                  <DropdownMenuItem 
                    key={n.id} 
                    className={cn("p-3 cursor-pointer border-b last:border-0", !n.read && "bg-blue-50/50")}
                    onClick={() => markNotificationRead(n.id)}
                  >
                    <div className="flex flex-col gap-1">
                      <p className="text-sm leading-tight">{n.message}</p>
                      <span className="text-[10px] text-slate-400">{new Date(n.date).toLocaleTimeString()}</span>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* User Profile / Role Switcher (Mock) */}
      <div className="p-4 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className={cn(
              "w-full flex items-center gap-3 p-2 h-auto hover:bg-sidebar-accent hover:text-white justify-start",
              collapsed ? "px-0 justify-center" : ""
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
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 ml-2" side="right" align="end">
            <DropdownMenuLabel>Switch Role (Debug)</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {users.map(user => (
              <DropdownMenuItem 
                key={user.id} 
                onClick={() => setCurrentUser(user.role)}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="w-5 h-5">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                  <span>{user.name} ({user.role})</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
