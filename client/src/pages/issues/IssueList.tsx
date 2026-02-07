import Sidebar from "@/components/layout/Sidebar";
import { useStore, Issue } from "@/lib/store";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus, Search, Eye } from "lucide-react";
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

export default function IssueList() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const data = await api.issues.getAll();
        setIssues(data);
      } catch (error) {
        console.error('Failed to fetch issues:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchIssues();
  }, []);

  const filtered = issues.filter(i => 
    i.title.toLowerCase().includes(search.toLowerCase()) || 
    i.issueId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground">Issue Tracker</h1>
              <p className="text-muted-foreground mt-1">Log and track operational incidents and costs.</p>
            </div>
            <Link href="/issues/new">
              <Button className="gap-2 shadow-lg" data-testid="button-new-issue">
                <Plus className="w-4 h-4" /> Log Issue
              </Button>
            </Link>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border flex gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search issues..." 
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  data-testid="input-search-issues"
                />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Incident</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      No issues found.
                    </TableCell>
                  </TableRow>
                ) : filtered.map((issue) => (
                  <TableRow key={issue.id} className="hover:bg-muted/50" data-testid={`issue-row-${issue.issueId}`}>
                    <TableCell className="font-mono text-xs font-medium text-muted-foreground">{issue.issueId}</TableCell>
                    <TableCell className="font-medium text-foreground">{issue.title}</TableCell>
                    <TableCell>{issue.department}</TableCell>
                    <TableCell>{issue.cost}</TableCell>
                    <TableCell>{issue.date}</TableCell>
                    <TableCell><StatusBadge status={issue.status} /></TableCell>
                    <TableCell className="text-right">
                      <Link href={`/issues/${issue.id}`}>
                        <Button size="sm" variant="outline" className="gap-1" data-testid={`button-view-${issue.issueId}`}>
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
