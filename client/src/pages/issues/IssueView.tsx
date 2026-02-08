import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { useStore, Issue } from "@/lib/store";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";

export default function IssueView() {
  const [, params] = useRoute("/issues/:id");
  const [, setLocation] = useLocation();
  const { currentUser } = useStore();
  const { toast } = useToast();

  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchIssue = async () => {
      if (!params?.id) return;
      try {
        const data = await api.issues.getById(parseInt(params.id));
        setIssue(data);
      } catch (error) {
        console.error('Failed to fetch issue:', error);
        toast({ title: "Error", description: "Failed to load issue", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchIssue();
  }, [params?.id]);

  if (loading || !issue) {
    return (
      <div className="flex h-screen w-full bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </main>
      </div>
    );
  }

  const canReview = currentUser?.role ? issue.assignedTo.includes(currentUser.role) : false;

  const handleReview = async () => {
    setIsProcessing(true);
    try {
      await api.issues.review(issue.id, comment);
      const updated = await api.issues.getById(issue.id);
      setIssue(updated);
      setIsDialogOpen(false);
      setComment("");
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
              <Button variant="ghost" size="icon" onClick={() => setLocation("/issues")} data-testid="button-back">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-heading font-bold text-foreground">{issue.issueId}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={issue.status} />
                  <span className="text-muted-foreground text-sm">{issue.date}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {canReview && issue.status !== 'Resolved' && (
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
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
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Incident Title</h3>
                <h2 className="text-xl font-semibold text-foreground">{issue.title}</h2>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Raised By</h3>
                  <p className="text-foreground font-medium">{issue.createdBy || '—'}</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Department</h3>
                  <p className="text-foreground font-medium">{issue.department}</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Date</h3>
                  <p className="text-foreground font-medium">{issue.date || '—'}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Estimated Cost</h3>
                  <p className="text-foreground font-medium">{issue.cost}</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Status</h3>
                  <StatusBadge status={issue.status} />
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Root Cause</h3>
                <p className="text-foreground/80">{issue.cause}</p>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Assigned To</h3>
                <div className="flex gap-2 flex-wrap">
                  {issue.assignedTo.map((role, idx) => (
                    <StatusBadge key={idx} status={role} />
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Description</h3>
                <div className="prose max-w-none text-foreground/80 leading-relaxed py-3 border-t border-b border-border min-h-[100px]">
                  {issue.description.split('\n').map((line, i) => (
                    <p key={i}>{line || '\u00A0'}</p>
                  ))}
                </div>
              </div>

              {issue.attachments && issue.attachments.length > 0 && (
                <div>
                  <h3 className="font-heading font-semibold text-lg mb-3">Attachments</h3>
                  <div className="space-y-2">
                    {issue.attachments.map((att, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border" data-testid={`issue-attachment-${idx}`}>
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
                                  const updated = await api.issues.deleteAttachment(issue.id, att.url);
                                  setIssue(updated);
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

              {issue.reviews && issue.reviews.length > 0 && (
                <div>
                  <h3 className="font-heading font-semibold text-lg mb-3 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" /> Reviews
                  </h3>
                  <div className="space-y-3">
                    {issue.reviews.map((r, idx) => (
                      <div key={idx} className="p-4 bg-muted/30 rounded-lg border border-border" data-testid={`issue-review-${idx}`}>
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
                  Submit your review for this issue as {currentUser?.role}.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
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
