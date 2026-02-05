import Sidebar from "@/components/layout/Sidebar";
import { useStore, Memo, Issue, Ticket } from "@/lib/store";
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
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { requestNotificationPermission, getNotificationPermissionStatus } from "@/lib/notifications";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { currentUser } = useStore();
  const [memos, setMemos] = useState<Memo[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [memosData, issuesData, ticketsData] = await Promise.all([
          api.memos.getAll(),
          api.issues.getAll(),
          api.tickets.getAll()
        ]);
        setMemos(memosData);
        setIssues(issuesData);
        setTickets(ticketsData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Request notification permission on first visit
  useEffect(() => {
    const checkNotificationPermission = async () => {
      const status = getNotificationPermissionStatus();
      if (status === 'default') {
        const permission = await requestNotificationPermission();
        if (permission === 'granted') {
          toast({
            title: "Notifications Enabled",
            description: "You'll receive desktop notifications for important updates.",
          });
        }
      }
    };
    checkNotificationPermission();
  }, []);

  if (loading || !currentUser) {
    return (
      <div className="flex h-screen w-full bg-slate-50/50">
        <Sidebar />
        <main className="flex-1 overflow-auto flex items-center justify-center">
          <div className="text-slate-500">Loading...</div>
        </main>
      </div>
    );
  }

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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <Card key={stat.title} className="border-none shadow-sm" data-testid={`stat-card-${stat.title.replace(/\s+/g, '-').toLowerCase()}`}>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm">
              <CardHeader className="border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <CardTitle>Activity Overview</CardTitle>
                </div>
                <CardDescription>Total count of each workflow type</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader className="border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-blue-600" />
                  <CardTitle>Memo Status Distribution</CardTitle>
                </div>
                <CardDescription>Breakdown by approval status</CardDescription>
              </CardHeader>
              <CardContent className="p-6 flex items-center justify-center">
                <ResponsiveContainer width="100%" height={200}>
                  <RePieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => entry.name}
                      outerRadius={80}
                      fill="#8884d8"
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

          <Card className="border-none shadow-sm">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <CardTitle>Pending Your Action</CardTitle>
                </div>
                <Link href="/memos">
                  <Button variant="ghost" size="sm" className="gap-2" data-testid="button-view-all-memos">
                    View All <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <CardDescription>Memos awaiting your review and approval</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {pendingMemos.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">No pending items</p>
              ) : (
                <div className="space-y-3">
                  {pendingMemos.slice(0, 3).map((memo) => (
                    <Link key={memo.id} href={`/memos/${memo.memoId}`}>
                      <div 
                        className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-all cursor-pointer group border border-slate-100"
                        data-testid={`memo-item-${memo.memoId}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono font-medium text-slate-500">{memo.memoId}</span>
                              <StatusBadge status={memo.status} />
                            </div>
                            <p className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                              {memo.title}
                            </p>
                            <p className="text-sm text-slate-500 mt-1">From: {memo.initiator}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}
