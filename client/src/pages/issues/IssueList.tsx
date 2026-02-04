import Sidebar from "@/components/layout/Sidebar";
import { useStore } from "@/lib/store";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter } from "lucide-react";
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
import { useState } from "react";

export default function IssueList() {
  const { issues } = useStore();
  const [search, setSearch] = useState("");

  const filtered = issues.filter(i => 
    i.title.toLowerCase().includes(search.toLowerCase()) || 
    i.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen w-full bg-slate-50/50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-heading font-bold text-slate-900">Issue Tracker</h1>
              <p className="text-slate-500 mt-1">Log and track operational incidents and costs.</p>
            </div>
            <Link href="/issues/new">
              <Button className="gap-2 shadow-lg bg-rose-600 hover:bg-rose-700 text-white">
                <Plus className="w-4 h-4" /> Log Issue
              </Button>
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Search issues..." 
                  className="pl-9 bg-slate-50 border-slate-200"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Incident</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((issue) => (
                  <TableRow key={issue.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-mono text-xs font-medium text-slate-500">{issue.id}</TableCell>
                    <TableCell className="font-medium text-slate-900">{issue.title}</TableCell>
                    <TableCell>{issue.department}</TableCell>
                    <TableCell>{issue.cost}</TableCell>
                    <TableCell>{issue.date}</TableCell>
                    <TableCell><StatusBadge status={issue.status} /></TableCell>
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
