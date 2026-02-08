import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { useStore, Ticket } from "@/lib/store";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, FileIcon, ExternalLink, Download, MessageSquare } from "lucide-react";
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

export default function TicketView() {
  const [, params] = useRoute("/tickets/:id");
  const [, setLocation] = useLocation();
  const { currentUser } = useStore();
  const { toast } = useToast();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'take' | 'resolve' | 'comment'>('take');
  const [comment, setComment] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchTicket = async () => {
      if (!params?.id) return;
      try {
        const data = await api.tickets.getById(parseInt(params.id));
        setTicket(data);
      } catch (error) {
        console.error('Failed to fetch ticket:', error);
        toast({ title: "Error", description: "Failed to load ticket", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [params?.id]);

  if (loading || !ticket) {
    return (
      <div className="flex h-screen w-full bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </main>
      </div>
    );
  }

  const canEdit = currentUser?.role === 'IT';

  const handleStatusUpdate = async () => {
    setIsProcessing(true);
    try {
      const newStatus = actionType === 'take' ? 'In Progress' : 'Resolved';
      await api.tickets.updateStatus(ticket.id, newStatus, comment || undefined);
      const updated = await api.tickets.getById(ticket.id);
      setTicket(updated);
      setIsDialogOpen(false);
      setComment("");
      toast({ title: "Updated", description: `Ticket status changed to ${newStatus}.` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update ticket", variant: "destructive" });
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
              <Button variant="ghost" size="icon" onClick={() => setLocation("/tickets")} data-testid="button-back">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-heading font-bold text-foreground">{ticket.ticketId}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={ticket.status} />
                  <StatusBadge status={ticket.priority} />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {canEdit && ticket.status === 'Open' && (
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => { setActionType('take'); setIsDialogOpen(true); }}
                  data-testid="button-take"
                >
                  Take Ticket
                </Button>
              )}
              {canEdit && ticket.status === 'In Progress' && (
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => { setActionType('resolve'); setIsDialogOpen(true); }}
                  data-testid="button-resolve"
                >
                  Mark Resolved
                </Button>
              )}
            </div>
          </div>

          <Card className="p-8 border-none shadow-sm">
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Subject</h3>
                <h2 className="text-xl font-semibold text-foreground">{ticket.title}</h2>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Raised By</h3>
                  <p className="text-foreground font-medium">{ticket.createdBy || '—'}</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Department</h3>
                  <p className="text-foreground font-medium">{ticket.department || '—'}</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Date</h3>
                  <p className="text-foreground font-medium">
                    {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : '—'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Priority</h3>
                  <StatusBadge status={ticket.priority} />
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Status</h3>
                  <StatusBadge status={ticket.status} />
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Assigned To</h3>
                  <p className="text-foreground font-medium">{ticket.assignedTo}</p>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Description</h3>
                <div className="prose max-w-none text-foreground/80 leading-relaxed py-3 border-t border-b border-border min-h-[100px]">
                  {ticket.description.split('\n').map((line, i) => (
                    <p key={i}>{line || '\u00A0'}</p>
                  ))}
                </div>
              </div>

              {ticket.attachments && ticket.attachments.length > 0 && (
                <div>
                  <h3 className="font-heading font-semibold text-lg mb-3">Attachments</h3>
                  <div className="space-y-2">
                    {ticket.attachments.map((att, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border" data-testid={`ticket-attachment-${idx}`}>
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
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {ticket.comments && ticket.comments.length > 0 && (
                <div>
                  <h3 className="font-heading font-semibold text-lg mb-3 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" /> Comments
                  </h3>
                  <div className="space-y-3">
                    {ticket.comments.map((c, idx) => (
                      <div key={idx} className="p-4 bg-muted/30 rounded-lg border border-border" data-testid={`ticket-comment-${idx}`}>
                        <div className="flex justify-between mb-1">
                          <span className="font-semibold text-sm text-foreground">{c.user}</span>
                          <span className="text-xs text-muted-foreground">{c.date}</span>
                        </div>
                        <p className="text-sm text-foreground/80">{c.text}</p>
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
                <DialogTitle>
                  {actionType === 'take' ? 'Take Ticket' : 'Resolve Ticket'}
                </DialogTitle>
                <DialogDescription>
                  {actionType === 'take'
                    ? 'Assign this ticket to yourself and start working on it.'
                    : 'Mark this ticket as resolved. Add a comment about the resolution.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Comment (optional)</Label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={actionType === 'take' ? "I'll look into this..." : "Fixed by..."}
                    data-testid="textarea-comment"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button
                  onClick={handleStatusUpdate}
                  disabled={isProcessing}
                  data-testid="button-confirm-action"
                >
                  {isProcessing ? 'Processing...' : actionType === 'take' ? 'Take Ticket' : 'Mark Resolved'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}
