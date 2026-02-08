import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { useStore } from "@/lib/store";
import type { RiskReport } from "@/lib/store";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, FileIcon, ExternalLink, Download, MessageSquare, Trash2 } from "lucide-react";
import { downloadFile } from "@/lib/download";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import jsPDF from "jspdf";

export default function RiskReportView() {
  const [, params] = useRoute("/risk-reports/:id");
  const [, setLocation] = useLocation();
  const { currentUser } = useStore();
  const { toast } = useToast();

  const [report, setReport] = useState<RiskReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [reviewStatus, setReviewStatus] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      if (!params?.id) return;
      try {
        const data = await api.riskReports.getById(parseInt(params.id));
        setReport(data);
      } catch (error) {
        console.error('Failed to fetch risk report:', error);
        toast({ title: "Error", description: "Failed to load risk report", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [params?.id]);

  if (loading || !report) {
    return (
      <div className="flex h-screen w-full bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </main>
      </div>
    );
  }

  const canReview = currentUser?.role ? ['IT', 'Risk'].includes(currentUser.role) : false;

  const handleDownloadPDF = async () => {
    if (!report) return;
    toast({ title: "Generating PDF", description: "Please wait..." });
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.text("Alpha10", margin, y);
      y += 6;
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(120, 120, 120);
      pdf.text("RISK REPORT", margin, y);

      pdf.setFontSize(9);
      pdf.text(`Ref: ${report.reportId}`, pageWidth - margin, y - 6, { align: "right" });
      pdf.text(`Date: ${report.date}`, pageWidth - margin, y, { align: "right" });
      pdf.setTextColor(0, 0, 0);

      y += 6;
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 10;

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(120, 120, 120);
      pdf.text("RISK TITLE", margin, y);
      y += 6;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      const titleLines = pdf.splitTextToSize(report.title, contentWidth);
      pdf.text(titleLines, margin, y);
      y += titleLines.length * 7 + 6;

      const fields = [
        { label: "Raised By", value: report.createdBy || '—' },
        { label: "Risk Category", value: report.riskCategory || '—' },
        { label: "Department", value: report.department || '—' },
        { label: "Likelihood", value: report.likelihood || '—' },
        { label: "Impact", value: report.impact || '—' },
        { label: "Status", value: report.status },
      ];

      for (let i = 0; i < fields.length; i += 3) {
        const row = fields.slice(i, i + 3);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.setTextColor(120, 120, 120);
        row.forEach((f, idx) => {
          pdf.text(f.label.toUpperCase(), margin + idx * (contentWidth / 3), y);
        });
        y += 5;
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        row.forEach((f, idx) => {
          pdf.text(f.value, margin + idx * (contentWidth / 3), y);
        });
        y += 8;
      }

      y += 4;
      pdf.setDrawColor(230, 230, 230);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 8;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(120, 120, 120);
      pdf.text("DESCRIPTION", margin, y);
      y += 6;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      const descLines = pdf.splitTextToSize(report.description || '', contentWidth);
      for (const line of descLines) {
        if (y > 270) { pdf.addPage(); y = margin; }
        pdf.text(line, margin, y);
        y += 5;
      }
      y += 6;

      if (report.mitigationPlan) {
        pdf.setDrawColor(230, 230, 230);
        pdf.line(margin, y, pageWidth - margin, y);
        y += 8;
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.setTextColor(120, 120, 120);
        pdf.text("MITIGATION PLAN", margin, y);
        y += 6;
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        const mitLines = pdf.splitTextToSize(report.mitigationPlan, contentWidth);
        for (const line of mitLines) {
          if (y > 270) { pdf.addPage(); y = margin; }
          pdf.text(line, margin, y);
          y += 5;
        }
        y += 6;
      }

      if (report.attachments && report.attachments.length > 0) {
        pdf.setDrawColor(230, 230, 230);
        pdf.line(margin, y, pageWidth - margin, y);
        y += 8;
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.setTextColor(0, 0, 0);
        pdf.text("Attachments", margin, y);
        y += 6;
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        for (const att of report.attachments) {
          if (y > 270) { pdf.addPage(); y = margin; }
          pdf.text(`• ${att.originalName}`, margin + 2, y);
          y += 5;
        }
        y += 4;
      }

      if (report.reviews && report.reviews.length > 0) {
        pdf.setDrawColor(230, 230, 230);
        pdf.line(margin, y, pageWidth - margin, y);
        y += 8;
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.setTextColor(0, 0, 0);
        pdf.text("Reviews", margin, y);
        y += 8;

        for (const r of report.reviews) {
          if (y > 255) { pdf.addPage(); y = margin; }
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(10);
          pdf.text(r.role, margin, y);
          if (r.date) {
            pdf.setFontSize(8);
            pdf.setTextColor(120, 120, 120);
            pdf.text(r.date, pageWidth - margin, y, { align: "right" });
          }
          y += 5;
          pdf.setFont("helvetica", "italic");
          pdf.setFontSize(9);
          pdf.setTextColor(80, 80, 80);
          const commentText = `"${r.comment || 'No comment'}"`;
          const commentLines = pdf.splitTextToSize(commentText, contentWidth);
          pdf.text(commentLines, margin, y);
          y += commentLines.length * 4 + 6;
          pdf.setTextColor(0, 0, 0);
        }
      }

      pdf.save(`${report.reportId}_Risk_Report.pdf`);
      toast({ title: "Success", description: "Risk report downloaded successfully." });
    } catch (err) {
      console.error("PDF generation error:", err);
      toast({ title: "Error", description: "Failed to generate PDF", variant: "destructive" });
    }
  };

  const handleReview = async () => {
    setIsProcessing(true);
    try {
      await api.riskReports.review(report.id, comment, reviewStatus || undefined);
      const updated = await api.riskReports.getById(report.id);
      setReport(updated);
      setIsDialogOpen(false);
      setComment("");
      setReviewStatus("");
      toast({ title: "Review Submitted", description: "Your review has been recorded." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to submit review", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setLocation("/risk-reports")} data-testid="button-back">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-heading font-bold text-foreground">{report.reportId}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={report.status} />
                  <span className="text-muted-foreground text-sm">{report.date}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" onClick={handleDownloadPDF} data-testid="button-download">
                <Download className="w-4 h-4" /> Download PDF
              </Button>
              {canReview && report.status !== 'Resolved' && (
                <Button
                  className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                  onClick={() => setIsDialogOpen(true)}
                  data-testid="button-review"
                >
                  <MessageSquare className="w-4 h-4" /> Add Review
                </Button>
              )}
            </div>
          </div>

          <Card className="p-8 border-none shadow-sm">
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Risk Title</h3>
                <h2 className="text-xl font-semibold text-foreground">{report.title}</h2>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Raised By</h3>
                  <p className="text-foreground font-medium">{report.createdBy || '—'}</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Risk Category</h3>
                  <p className="text-foreground font-medium">{report.riskCategory || '—'}</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Date Identified</h3>
                  <p className="text-foreground font-medium">{report.date || '—'}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-6">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Department</h3>
                  <p className="text-foreground font-medium">{report.department || '—'}</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Likelihood</h3>
                  <StatusBadge status={report.likelihood || 'Medium'} />
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Impact</h3>
                  <StatusBadge status={report.impact || 'Medium'} />
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Status</h3>
                  <StatusBadge status={report.status} />
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Assigned To</h3>
                <div className="flex gap-2 flex-wrap">
                  {(report.assignedTo || []).map((role: string, idx: number) => (
                    <StatusBadge key={idx} status={role} />
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Description</h3>
                <div className="prose max-w-none text-foreground/80 leading-relaxed py-3 border-t border-b border-border min-h-[100px]">
                  {(report.description || '').split('\n').map((line: string, i: number) => (
                    <p key={i}>{line || '\u00A0'}</p>
                  ))}
                </div>
              </div>

              {report.mitigationPlan && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Mitigation Plan</h3>
                  <div className="prose max-w-none text-foreground/80 leading-relaxed py-3 border-t border-b border-border">
                    {report.mitigationPlan.split('\n').map((line: string, i: number) => (
                      <p key={i}>{line || '\u00A0'}</p>
                    ))}
                  </div>
                </div>
              )}

              {report.attachments && report.attachments.length > 0 && (
                <div>
                  <h3 className="font-heading font-semibold text-lg mb-3">Attachments</h3>
                  <div className="space-y-2">
                    {report.attachments.map((att: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border" data-testid={`risk-attachment-${idx}`}>
                        <div className="flex items-center gap-2">
                          <FileIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">{att.originalName}</span>
                        </div>
                        <div className="flex gap-2">
                          <a href={att.url} target="_blank" rel="noopener noreferrer">
                            <Button type="button" variant="ghost" size="sm" className="h-8 gap-1" data-testid={`button-view-attachment-${idx}`}>
                              <ExternalLink className="w-4 h-4" /> View
                            </Button>
                          </a>
                          <Button type="button" variant="ghost" size="sm" className="h-8 gap-1" data-testid={`button-download-attachment-${idx}`} onClick={() => downloadFile(att.url, att.originalName)}>
                            <Download className="w-4 h-4" /> Download
                          </Button>
                          {currentUser?.role === 'IT' && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                              data-testid={`button-delete-attachment-${idx}`}
                              onClick={async () => {
                                if (!confirm('Are you sure you want to delete this attachment?')) return;
                                try {
                                  const updated = await api.riskReports.deleteAttachment(report.id, att.url);
                                  setReport(updated);
                                  toast({ title: "Deleted", description: "Attachment removed successfully." });
                                } catch (err: any) {
                                  toast({ title: "Error", description: err.message || "Failed to delete attachment", variant: "destructive" });
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" /> Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {report.reviews && report.reviews.length > 0 && (
                <div>
                  <h3 className="font-heading font-semibold text-lg mb-3 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" /> Reviews
                  </h3>
                  <div className="space-y-3">
                    {report.reviews.map((r: any, idx: number) => (
                      <div key={idx} className="p-4 bg-muted/30 rounded-lg border border-border" data-testid={`risk-review-${idx}`}>
                        <div className="flex justify-between mb-1">
                          <span className="font-semibold text-sm text-foreground">{r.role}</span>
                          <span className="text-xs text-muted-foreground">{r.date}</span>
                        </div>
                        <p className="text-sm text-foreground/80">{r.comment || 'No comment'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Review</DialogTitle>
                <DialogDescription>
                  Submit your review for this risk report as {currentUser?.role}.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Update Status (optional)</Label>
                  <Select value={reviewStatus} onValueChange={setReviewStatus}>
                    <SelectTrigger data-testid="select-review-status">
                      <SelectValue placeholder="Keep current status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="Under Review">Under Review</SelectItem>
                      <SelectItem value="Resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Comment</Label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Your review comments..."
                    data-testid="textarea-review-comment"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button
                  onClick={handleReview}
                  disabled={isProcessing}
                  className="bg-amber-600 hover:bg-amber-700"
                  data-testid="button-confirm-review"
                >
                  {isProcessing ? 'Submitting...' : 'Submit Review'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}
