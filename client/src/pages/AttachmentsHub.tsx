import Sidebar from "@/components/layout/Sidebar";
import { useStore, Memo, Issue, Ticket } from "@/lib/store";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, FileIcon, Search, ExternalLink, Trash2 } from "lucide-react";
import { downloadFile, downloadMultipleFiles } from "@/lib/download";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

export default function AttachmentsHub() {
  const { currentUser } = useStore();
  const [memos, setMemos] = useState<Memo[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [search, setSearch] = useState("");
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
        console.error('Failed to fetch attachments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const normalizeAttachment = (a: any): { name: string; url: string } | null => {
    if (typeof a === 'string') {
      return null;
    }
    if (a && a.url) {
      return { name: a.originalName || a.name || 'Unknown', url: a.url };
    }
    return null;
  };

  const memoAttachments = memos.flatMap(m => 
    (m.attachments || []).map(a => {
      const norm = normalizeAttachment(a);
      if (!norm) return null;
      return { ...norm, source: `Memo: ${m.memoId}`, date: m.date, id: m.memoId, dbId: m.id, type: 'memo' as const };
    }).filter(Boolean) as any[]
  );

  const issueAttachments = issues.flatMap(i => 
    (i.attachments || []).map(a => {
      const norm = normalizeAttachment(a);
      if (!norm) return null;
      return { ...norm, source: `Issue: ${i.issueId}`, date: i.date, id: i.issueId, dbId: i.id, type: 'issue' as const };
    }).filter(Boolean) as any[]
  );

  const ticketAttachments = tickets.flatMap(t => 
    (t.attachments || []).map(a => {
      const norm = normalizeAttachment(a);
      if (!norm) return null;
      return { ...norm, source: `Ticket: ${t.ticketId}`, date: new Date().toISOString().split('T')[0], id: t.ticketId, dbId: t.id, type: 'ticket' as const };
    }).filter(Boolean) as any[]
  );

  const allAttachments = [...memoAttachments, ...issueAttachments, ...ticketAttachments].filter(a => 
    (a.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (a.source || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteAttachment = async (file: any) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return;
    try {
      if (file.type === 'memo') {
        await api.memos.deleteAttachment(file.dbId, file.url);
        setMemos(prev => prev.map(m => m.id === file.dbId 
          ? { ...m, attachments: m.attachments.filter(a => a.url !== file.url) } 
          : m
        ));
      } else if (file.type === 'issue') {
        await api.issues.deleteAttachment(file.dbId, file.url);
        setIssues(prev => prev.map(i => i.id === file.dbId 
          ? { ...i, attachments: i.attachments.filter(a => a.url !== file.url) } 
          : i
        ));
      } else if (file.type === 'ticket') {
        await api.tickets.deleteAttachment(file.dbId, file.url);
        setTickets(prev => prev.map(t => t.id === file.dbId 
          ? { ...t, attachments: t.attachments.filter(a => a.url !== file.url) } 
          : t
        ));
      }
      toast({ title: "Deleted", description: "Attachment removed successfully." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to delete attachment", variant: "destructive" });
    }
  };

  const handleDeleteAll = async () => {
    if (allAttachments.length === 0) {
      toast({ title: "No Files", description: "No attachments to delete.", variant: "destructive" });
      return;
    }
    if (!confirm(`Are you sure you want to delete all ${allAttachments.length} visible attachment(s)? This cannot be undone.`)) return;

    let deleted = 0;
    let failed = 0;
    for (const file of allAttachments) {
      try {
        if (file.type === 'memo') {
          await api.memos.deleteAttachment(file.dbId, file.url);
        } else if (file.type === 'issue') {
          await api.issues.deleteAttachment(file.dbId, file.url);
        } else if (file.type === 'ticket') {
          await api.tickets.deleteAttachment(file.dbId, file.url);
        }
        deleted++;
      } catch {
        failed++;
      }
    }

    const [memosData, issuesData, ticketsData] = await Promise.all([
      api.memos.getAll(),
      api.issues.getAll(),
      api.tickets.getAll()
    ]);
    setMemos(memosData);
    setIssues(issuesData);
    setTickets(ticketsData);

    if (failed > 0) {
      toast({ title: "Delete Complete", description: `${deleted} deleted, ${failed} failed.`, variant: "destructive" });
    } else {
      toast({ title: "Delete Complete", description: `All ${deleted} attachment(s) deleted successfully.` });
    }
  };

  const handleDownloadAll = async () => {
    if (allAttachments.length === 0) {
      toast({ title: "No Files", description: "No attachments to download.", variant: "destructive" });
      return;
    }
    toast({ title: "Downloading", description: `Starting download of ${allAttachments.length} file(s)...` });
    const result = await downloadMultipleFiles(allAttachments.map(a => ({ url: a.url, name: a.name })));
    if (result.failed > 0) {
      toast({ title: "Download Complete", description: `${result.success} downloaded, ${result.failed} failed.`, variant: "destructive" });
    } else {
      toast({ title: "Download Complete", description: `All ${result.success} file(s) downloaded successfully.` });
    }
  };

  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground">Attachments Hub</h1>
              <p className="text-muted-foreground mt-1">Centralized repository for all documents and proof uploads across all modules.</p>
            </div>
            <div className="flex gap-2">
              {currentUser?.role === 'IT' && (
                <Button variant="destructive" className="gap-2 shadow-lg" onClick={handleDeleteAll} data-testid="button-delete-all">
                  <Trash2 className="w-4 h-4" /> Delete All Visible
                </Button>
              )}
              <Button className="gap-2 shadow-lg" onClick={handleDownloadAll} data-testid="button-download-all">
                <Download className="w-4 h-4" /> Download All Visible
              </Button>
            </div>
          </div>

          <Card className="border-none shadow-sm">
            <CardHeader className="bg-card border-b border-border">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search by file name or source ID..." 
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    data-testid="input-search-attachments"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Source Module</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : allAttachments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                        No attachments found matching your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    allAttachments.map((file, index) => (
                      <TableRow key={index} className="hover:bg-muted/50 transition-colors" data-testid={`attachment-row-${index}`}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded bg-primary/10 text-primary">
                              <FileIcon className="w-4 h-4" />
                            </div>
                            <span className="font-medium text-foreground">{file.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground text-sm">{file.source}</span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{file.date}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => downloadFile(file.url, file.name)} data-testid={`button-download-${index}`}>
                              <Download className="h-4 w-4" />
                            </Button>
                            <a href={file.url} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid={`button-view-${index}`}>
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </a>
                            {currentUser?.role === 'IT' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteAttachment(file)}
                                data-testid={`button-delete-${index}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
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
