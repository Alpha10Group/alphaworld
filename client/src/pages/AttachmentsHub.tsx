import Sidebar from "@/components/layout/Sidebar";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, FileIcon, Search, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function AttachmentsHub() {
  const { memos, issues, tickets } = useStore();
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const allAttachments = [
    ...memos.flatMap(m => m.attachments.map(a => ({ name: a, source: `Memo: ${m.id}`, date: m.date, id: m.id, type: 'memo' }))),
    ...issues.map(i => ({ name: "Incident_Report.pdf", source: `Issue: ${i.id}`, date: i.date, id: i.id, type: 'issue' })), // Mocking some for issues
    { name: "Support_Screenshot.png", source: "Ticket: TKT-101", date: "2024-11-01", id: "TKT-101", type: 'ticket' } // Mocking for tickets
  ].filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.source.toLowerCase().includes(search.toLowerCase()));

  const handleDownloadAll = () => {
    toast({
      title: "Bulk Download Started",
      description: `Preparing ${allAttachments.length} files for download...`,
    });
  };

  return (
    <div className="flex h-screen w-full bg-slate-50/50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-heading font-bold text-slate-900">Attachments Hub</h1>
              <p className="text-slate-500 mt-1">Centralized repository for all documents and proof uploads across all modules.</p>
            </div>
            <Button className="gap-2 shadow-lg bg-blue-600 hover:bg-blue-700" onClick={handleDownloadAll}>
              <Download className="w-4 h-4" /> Download All Visible
            </Button>
          </div>

          <Card className="border-none shadow-sm">
            <CardHeader className="bg-white border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    placeholder="Search by file name or source ID..." 
                    className="pl-9 bg-slate-50 border-slate-200"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Source Module</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allAttachments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                        No attachments found matching your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    allAttachments.map((file, index) => (
                      <TableRow key={index} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded bg-blue-50 text-blue-600">
                              <FileIcon className="w-4 h-4" />
                            </div>
                            <span className="font-medium text-slate-900">{file.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-slate-600 text-sm">{file.source}</span>
                        </TableCell>
                        <TableCell className="text-slate-500 text-sm">{file.date}</TableCell>
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
