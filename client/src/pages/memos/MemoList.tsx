import Sidebar from "@/components/layout/Sidebar";
import { useStore, Memo } from "@/lib/store";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Trash2 } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

export default function MemoList() {
  const { currentUser } = useStore();
  const [memos, setMemos] = useState<Memo[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchMemos = async () => {
      try {
        const data = await api.memos.getAll();
        setMemos(data);
      } catch (error) {
        console.error('Failed to fetch memos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMemos();
  }, []);

  const filteredMemos = memos.filter(m => 
    m.title.toLowerCase().includes(search.toLowerCase()) || 
    m.memoId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen w-full bg-slate-50/50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-heading font-bold text-slate-900">Memos</h1>
              <p className="text-slate-500 mt-1">Manage and track internal memo approvals.</p>
            </div>
            <div className="flex gap-2">
              {currentUser?.role === 'IT' && (
                <Button
                  variant="destructive"
                  className="gap-2 shadow-lg"
                  data-testid="button-delete-all-memos"
                  onClick={async () => {
                    if (!confirm('Are you sure you want to delete ALL memos for this entity? This cannot be undone.')) return;
                    try {
                      const result = await api.memos.deleteAll();
                      setMemos([]);
                      toast({ title: "Deleted", description: result.message });
                    } catch (err: any) {
                      toast({ title: "Error", description: err.message || "Failed to delete memos", variant: "destructive" });
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" /> Delete All Memos
                </Button>
              )}
              <Link href="/memos/new">
                <Button className="gap-2 shadow-lg hover:shadow-xl transition-all" data-testid="button-new-memo">
                  <Plus className="w-4 h-4" /> New Memo
                </Button>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Search memos..." 
                  className="pl-9 bg-slate-50 border-slate-200"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  data-testid="input-search-memos"
                />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" /> Filter
              </Button>
            </div>

            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[120px]">ID</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Initiator</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredMemos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                      No memos found.
                    </TableCell>
                  </TableRow>
                ) : filteredMemos.map((memo) => (
                  <TableRow key={memo.id} className="hover:bg-slate-50/50 transition-colors" data-testid={`memo-row-${memo.memoId}`}>
                    <TableCell className="font-mono text-xs font-medium text-slate-500">{memo.memoId}</TableCell>
                    <TableCell className="font-medium text-slate-900">{memo.title}</TableCell>
                    <TableCell>{memo.initiator}</TableCell>
                    <TableCell>{memo.date}</TableCell>
                    <TableCell>
                      <StatusBadge status={memo.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/memos/${memo.memoId}`}>
                        <Button variant="ghost" size="sm" data-testid={`button-view-${memo.memoId}`}>View</Button>
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
