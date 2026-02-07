import Sidebar from "@/components/layout/Sidebar";
import { Memo, Issue, Ticket } from "@/lib/store";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, FileIcon, Search, ExternalLink } from "lucide-react";
import { downloadFile } from "@/lib/download";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

export default function AttachmentsHub() {
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

  const normalizeAttachment = (a: any) => {
    if (typeof a === 'string') {
      return { name: a, url: `/uploads/${a}` };
    }
    return { name: a.originalName || a.name || 'Unknown', url: a.url || '' };
  };

  const memoAttachments = memos.flatMap(m => 
    (m.attachments || []).map(a => {
      const norm = normalizeAttachment(a);
      return { ...norm, source: `Memo: ${m.memoId}`, date: m.date, id: m.memoId, type: 'memo' };
    })
  );

  const issueAttachments = issues.flatMap(i => 
    (i.attachments || []).map(a => {
      const norm = normalizeAttachment(a);
      return { ...norm, source: `Issue: ${i.issueId}`, date: i.date, id: i.issueId, type: 'issue' };
    })
  );

  const ticketAttachments = tickets.flatMap(t => 
    (t.attachments || []).map(a => {
      const norm = normalizeAttachment(a);
      return { ...norm, source: `Ticket: ${t.ticketId}`, date: new Date().toISOString().split('T')[0], id: t.ticketId, type: 'ticket' };
    })
  );

  const allAttachments = [...memoAttachments, ...issueAttachments, ...ticketAttachments].filter(a => 
    (a.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (a.source || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleDownloadAll = () => {
    toast({
      title: "Bulk Download Started",
      description: `Preparing ${allAttachments.length} files for download...`,
    });
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
            <Button className="gap-2 shadow-lg" onClick={handleDownloadAll} data-testid="button-download-all">
              <Download className="w-4 h-4" /> Download All Visible
            </Button>
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
