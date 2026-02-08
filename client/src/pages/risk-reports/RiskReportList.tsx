import Sidebar from "@/components/layout/Sidebar";
import { useStore } from "@/lib/store";
import type { RiskReport } from "@/lib/store";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus, Search, Eye, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

export default function RiskReportList() {
  const [reports, setReports] = useState<RiskReport[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await api.riskReports.getAll();
        setReports(data);
      } catch (error) {
        console.error('Failed to fetch risk reports:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const filtered = reports.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.reportId.toLowerCase().includes(search.toLowerCase())
  );

  const handleDownloadAll = () => {
    if (filtered.length === 0) {
      toast({ title: "No Reports", description: "There are no risk reports to download.", variant: "destructive" });
      return;
    }
    toast({ title: "Generating PDF", description: "Please wait..." });
    try {
      const pdf = new jsPDF("l", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 15;
      let y = margin;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.text("Alpha10 - Risk Reports", margin, y);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(120, 120, 120);
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin, y, { align: "right" });
      pdf.setTextColor(0, 0, 0);
      y += 10;

      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 6;

      const colWidths = [22, 55, 35, 30, 25, 25, 30, 25, 25];
      const headers = ["ID", "Title", "Raised By", "Category", "Likelihood", "Impact", "Date", "Status", "Dept"];

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      let x = margin;
      headers.forEach((h, i) => {
        pdf.text(h.toUpperCase(), x, y);
        x += colWidths[i];
      });
      pdf.setTextColor(0, 0, 0);
      y += 2;
      pdf.setDrawColor(220, 220, 220);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 5;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);

      for (const report of filtered) {
        if (y > 185) {
          pdf.addPage();
          y = margin;
        }
        x = margin;
        const vals = [
          report.reportId,
          report.title.length > 30 ? report.title.substring(0, 30) + '...' : report.title,
          report.createdBy || '—',
          report.riskCategory || '—',
          report.likelihood || '—',
          report.impact || '—',
          report.date,
          report.status,
          (report.department || '—').length > 12 ? (report.department || '—').substring(0, 12) + '...' : (report.department || '—'),
        ];
        vals.forEach((v, i) => {
          pdf.text(v, x, y);
          x += colWidths[i];
        });
        y += 6;
      }

      pdf.save("Risk_Reports.pdf");
      toast({ title: "Success", description: "Risk reports downloaded successfully." });
    } catch (err) {
      console.error("PDF generation error:", err);
      toast({ title: "Error", description: "Failed to generate PDF", variant: "destructive" });
    }
  };

  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground">Risk Reports</h1>
              <p className="text-muted-foreground mt-1">Log and track risk incidents across departments.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" onClick={handleDownloadAll} data-testid="button-download-all-risk-reports">
                <Download className="w-4 h-4" /> Download All
              </Button>
              <Link href="/risk-reports/new">
                <Button className="gap-2 shadow-lg" data-testid="button-new-risk-report">
                  <Plus className="w-4 h-4" /> Log Risk Report
                </Button>
              </Link>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border flex gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search risk reports..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  data-testid="input-search-risk-reports"
                />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Raised By</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Likelihood</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      No risk reports found.
                    </TableCell>
                  </TableRow>
                ) : filtered.map((report) => (
                  <TableRow key={report.id} className="hover:bg-muted/50" data-testid={`risk-report-row-${report.reportId}`}>
                    <TableCell className="font-mono text-xs font-medium text-muted-foreground">{report.reportId}</TableCell>
                    <TableCell className="font-medium text-foreground">{report.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{report.createdBy || '—'}</TableCell>
                    <TableCell>{report.riskCategory || '—'}</TableCell>
                    <TableCell>
                      <StatusBadge status={report.likelihood || 'Medium'} />
                    </TableCell>
                    <TableCell>{report.date}</TableCell>
                    <TableCell><StatusBadge status={report.status} /></TableCell>
                    <TableCell className="text-right">
                      <Link href={`/risk-reports/${report.id}`}>
                        <Button size="sm" variant="outline" className="gap-1" data-testid={`button-view-${report.reportId}`}>
                          <Eye className="w-3 h-3" /> View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  );
}
