import Sidebar from "@/components/layout/Sidebar";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Link } from "wouter";
import { FileText, AlertCircle, Monitor, Clock, ArrowRight } from "lucide-react";

export default function Dashboard() {
  const { currentUser, memos, issues, tickets } = useStore();

  // Filter items relevant to the current user
  const myMemos = memos.filter(m => m.initiator === currentUser.name);
  const pendingMemos = memos.filter(m => m.currentHandler === currentUser.role && m.status.includes('Pending'));
  
  const myIssues = issues.filter(i => i.assignedTo.includes(currentUser.role));
  const myTickets = tickets.filter(t => t.assignedTo === currentUser.role || currentUser.role === 'Initiator');

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

  return (
    <div className="flex h-screen w-full bg-slate-50/50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-7xl mx-auto space-y-8">
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-heading font-bold text-slate-900">
                Welcome back, {currentUser.name.split(' ')[0]}
              </h1>
              <p className="text-slate-500 mt-1">
                Here is what's happening in your workspace today.
              </p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-sm font-medium text-slate-600">
                {currentUser.role} View
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <Card key={stat.title} className="border-none shadow-sm hover:shadow-md transition-shadow">
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Attention Required */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Requires Attention</CardTitle>
                <CardDescription>Items waiting for your approval or action</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingMemos.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                        <Clock className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p>No pending items found</p>
                    </div>
                )}
                {pendingMemos.map(memo => (
                  <div key={memo.id} className="flex items-center justify-between p-4 rounded-lg bg-white border border-slate-100 hover:border-slate-200 transition-colors">
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

            {/* Recent Activity */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Recent Memos</CardTitle>
                <CardDescription>Latest updates on your initiated memos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                    {myMemos.slice(0, 5).map(memo => (
                        <div key={memo.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                            <div>
                                <h4 className="font-medium text-sm text-slate-800">{memo.title}</h4>
                                <p className="text-xs text-slate-500">{memo.id}</p>
                            </div>
                            <StatusBadge status={memo.status} />
                        </div>
                    ))}
                    {myMemos.length === 0 && <p className="text-slate-500 text-sm text-center py-4">No recent activity.</p>}
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
}
