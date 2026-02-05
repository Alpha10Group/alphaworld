import Sidebar from "@/components/layout/Sidebar";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Link } from "wouter";
import { FileText, AlertCircle, Monitor, Clock, ArrowRight, TrendingUp, BarChart3, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell
} from "recharts";

export default function Dashboard() {
  const { currentUser, memos, issues, tickets } = useStore();

  const myMemos = memos.filter(m => m.initiator === currentUser.name);
  const pendingMemos = memos.filter(m => m.currentHandler === currentUser.role && m.status.includes('Pending'));
  
  const stats = [
    { 
      title: "Pending My Action", 
      value: pendingMemos.length + (currentUser.role === 'IT' ? tickets.filter(t => t.status === 'Open').length : 0),
      icon: Clock,
      color: "text-amber-600 bg-amber-50"
    },
    { 
      title: "Active Memos", 
      value: memos.filter(m => !['Approved', 'Rejected'].includes(m.status)).length,
      icon: FileText,
      color: "text-blue-600 bg-blue-50"
    },
    { 
      title: "Open Issues", 
      value: issues.filter(i => i.status !== 'Resolved').length,
      icon: AlertCircle,
      color: "text-rose-600 bg-rose-50"
    },
    { 
      title: "Active Tickets", 
      value: tickets.filter(t => t.status !== 'Closed').length,
      icon: Monitor,
      color: "text-emerald-600 bg-emerald-50"
    },
  ];

  const chartData = [
    { name: 'Memos', count: memos.length },
    { name: 'Issues', count: issues.length },
    { name: 'Tickets', count: tickets.length },
  ];

  const pieData = [
    { name: 'Approved', value: memos.filter(m => m.status === 'Approved').length || 1 },
    { name: 'Pending', value: memos.filter(m => m.status.includes('Pending')).length || 1 },
    { name: 'Rejected', value: memos.filter(m => m.status === 'Rejected').length || 0 },
  ];

  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  const notifications = useStore(state => state.notifications);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex h-screen w-full bg-slate-50/50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-7xl mx-auto space-y-8">
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-heading font-bold text-slate-900">
                Workplace Analytics
              </h1>
              <p className="text-slate-500 mt-1">
                Overview of workflow performance and task status.
              </p>
            </div>
            {unreadCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 animate-pulse">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">{unreadCount} New Notifications</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <Card key={stat.title} className="border-none shadow-sm">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                    <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 border-none shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Volume by Module
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-amber-600" />
                  Memo Success Rate
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Action Required</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingMemos.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    <Clock className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p>No pending items found</p>
                  </div>
                )}
                {pendingMemos.map(memo => (
                  <div key={memo.id} className="flex items-center justify-between p-4 rounded-lg bg-white border border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-full bg-blue-50 text-blue-600">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 text-sm">{memo.title}</h4>
                        <p className="text-xs text-slate-500">{memo.initiator} • {memo.date}</p>
                      </div>
                    </div>
                    <Link href={`/memos/${memo.id}`}>
                      <Button size="sm" variant="outline" className="gap-2">
                        Review <ArrowRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {memos.slice(0, 5).map(memo => (
                  <div key={memo.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <h4 className="font-medium text-sm">{memo.title}</h4>
                      <p className="text-xs text-slate-500">{memo.id}</p>
                    </div>
                    <StatusBadge status={memo.status} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
}
