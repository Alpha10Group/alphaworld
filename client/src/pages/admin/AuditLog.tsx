import Sidebar from "@/components/layout/Sidebar";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, History, Download } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useRef } from "react";
import { useToast } from "@/hooks/use-toast";

export default function AuditLog() {
  const { auditLogs } = useStore();
  const [search, setSearch] = useState("");
  const tableRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const filteredLogs = auditLogs.filter(log => 
    log.action.toLowerCase().includes(search.toLowerCase()) || 
    log.user.toLowerCase().includes(search.toLowerCase()) ||
    log.details.toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = async () => {
    if (!tableRef.current) return;
    toast({ title: "Exporting Logs", description: "Generating PDF..." });
    
    try {
      const canvas = await html2canvas(tableRef.current);
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Audit_Log_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast({ title: "Success", description: "Audit logs exported successfully." });
    } catch (err) {
      toast({ title: "Error", description: "Export failed.", variant: "destructive" });
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50/50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-heading font-bold text-slate-900">Audit Logs</h1>
              <p className="text-slate-500 mt-1">Track comprehensive system activities and security events.</p>
            </div>
            <Button variant="outline" className="gap-2" onClick={handleExport}>
              <Download className="w-4 h-4" /> Export Logs
            </Button>
          </div>

          <Card className="border-none shadow-sm">
            <CardHeader className="bg-white border-b border-slate-100">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Search logs..." 
                  className="pl-9 bg-slate-50 border-slate-200"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0" ref={tableRef}>
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-[180px]">Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-slate-50/50">
                      <TableCell className="text-xs text-slate-500 font-mono">
                        {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">{log.user}</TableCell>
                      <TableCell className="text-xs text-slate-500">{log.role}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                          {log.action}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">{log.details}</TableCell>
                    </TableRow>
                  ))}
                  {filteredLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                        No logs found matching your search.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
