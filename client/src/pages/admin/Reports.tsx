import Sidebar from "@/components/layout/Sidebar";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, BarChart3, PieChart, Loader2 } from "lucide-react";
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
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";
import { useRef, useState, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useToast } from "@/hooks/use-toast";

export default function Reports() {
  const { currentUser } = useStore();
  const reportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [memos, setMemos] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [riskReports, setRiskReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/memos', { credentials: 'include' }).then(r => r.json()).catch(() => []),
      fetch('/api/issues', { credentials: 'include' }).then(r => r.json()).catch(() => []),
      fetch('/api/tickets', { credentials: 'include' }).then(r => r.json()).catch(() => []),
      fetch('/api/risk-reports', { credentials: 'include' }).then(r => r.json()).catch(() => []),
    ]).then(([m, i, t, r]) => {
      setMemos(Array.isArray(m) ? m : []);
      setIssues(Array.isArray(i) ? i : []);
      setTickets(Array.isArray(t) ? t : []);
      setRiskReports(Array.isArray(r) ? r : []);
      setLoading(false);
    });
  }, []);

  if (!currentUser || currentUser.role !== 'IT') {
    return (
      <div className="flex h-screen w-full bg-slate-50/50 items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
          <p className="text-slate-500">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen w-full bg-slate-50/50">
        <Sidebar />
        <main className="flex-1 overflow-auto p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </main>
      </div>
    );
  }

  const chartData = [
    { name: 'Memos', count: memos.length },
    { name: 'Issues', count: issues.length },
    { name: 'Tickets', count: tickets.length },
    { name: 'Risk Reports', count: riskReports.length },
  ];

  const pieData = [
    { name: 'Approved', value: memos.filter(m => m.status === 'Approved').length || 0 },
    { name: 'Pending', value: memos.filter(m => (m.status || '').includes('Pending')).length || 0 },
    { name: 'Rejected', value: memos.filter(m => m.status === 'Rejected').length || 0 },
  ].filter(d => d.value > 0);

  const trendData = [
    { name: 'Mon', volume: 4 },
    { name: 'Tue', volume: 3 },
    { name: 'Wed', volume: 7 },
    { name: 'Thu', volume: 5 },
    { name: 'Fri', volume: 8 },
    { name: 'Sat', volume: 2 },
    { name: 'Sun', volume: 1 },
  ];

  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  const approvalRate = memos.length > 0 
    ? Math.round((memos.filter(m => m.status === 'Approved').length / memos.length) * 100) 
    : 0;

  const handleDownload = async () => {
    if (!reportRef.current) return;
    toast({ title: "Generating Report", description: "Preparing PDF..." });
    
    try {
      const canvas = await html2canvas(reportRef.current);
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("Executive_Report.pdf");
      toast({ title: "Success", description: "Report downloaded." });
    } catch (err) {
      toast({ title: "Error", description: "Failed to generate report.", variant: "destructive" });
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50/50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-heading font-bold text-slate-900">Advanced Reports</h1>
              <p className="text-slate-500 mt-1">Deep dive analytics and exportable insights.</p>
            </div>
            <Button className="gap-2 shadow-lg bg-blue-600 hover:bg-blue-700" onClick={handleDownload}>
              <Download className="w-4 h-4" /> Download Executive PDF
            </Button>
          </div>

          <div ref={reportRef} className="space-y-8 bg-slate-50/50 p-4">
            
            <div className="hidden print:block mb-8">
              <h1 className="text-2xl font-bold">NexusFlow Executive Report</h1>
              <p className="text-slate-500">Generated on {new Date().toLocaleDateString()}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2 border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    System Volume Overview
                  </CardTitle>
                  <CardDescription>Total records processed across modules</CardDescription>
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
                    Approval Efficiency
                  </CardTitle>
                  <CardDescription>Memo status distribution</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={pieData.length > 0 ? pieData : [{ name: 'No Data', value: 1 }]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {(pieData.length > 0 ? pieData : [{ name: 'No Data', value: 1 }]).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={pieData.length > 0 ? COLORS[index % COLORS.length] : '#e2e8f0'} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RePieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  Weekly Request Volume
                </CardTitle>
                <CardDescription>Incoming request trends over the last 7 days</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="volume" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-4 gap-4">
                <Card className="bg-blue-50 border-blue-100 shadow-none">
                    <CardContent className="p-6 text-center">
                        <div className="text-3xl font-bold text-blue-700">{memos.length}</div>
                        <div className="text-sm text-blue-600 font-medium">Total Memos</div>
                    </CardContent>
                </Card>
                <Card className="bg-amber-50 border-amber-100 shadow-none">
                    <CardContent className="p-6 text-center">
                        <div className="text-3xl font-bold text-amber-700">{issues.length}</div>
                        <div className="text-sm text-amber-600 font-medium">Total Issues</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-50 border-emerald-100 shadow-none">
                    <CardContent className="p-6 text-center">
                        <div className="text-3xl font-bold text-emerald-700">{approvalRate}%</div>
                        <div className="text-sm text-emerald-600 font-medium">Approval Rate</div>
                    </CardContent>
                </Card>
                <Card className="bg-purple-50 border-purple-100 shadow-none">
                    <CardContent className="p-6 text-center">
                        <div className="text-3xl font-bold text-purple-700">{tickets.length}</div>
                        <div className="text-sm text-purple-600 font-medium">Total Tickets</div>
                    </CardContent>
                </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
