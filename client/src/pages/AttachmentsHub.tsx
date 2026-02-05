import Sidebar from "@/components/layout/Sidebar";
import { Memo } from "@/lib/store";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, FileIcon, Search, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

export default function AttachmentsHub() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const memosData = await api.memos.getAll();
        setMemos(memosData);
      } catch (error) {
        console.error('Failed to fetch attachments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const allAttachments = memos.flatMap(m => 
    m.attachments.map(a => ({ 
      name: a, 
      source: `Memo: ${m.memoId}`, 
      date: m.date, 
      id: m.memoId, 
      type: 'memo' 
    }))
  ).filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) || 
    a.source.toLowerCase().includes(search.toLowerCase())
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
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
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
