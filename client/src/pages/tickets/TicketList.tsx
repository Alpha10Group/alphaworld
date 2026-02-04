import Sidebar from "@/components/layout/Sidebar";
import { useStore } from "@/lib/store";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
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

export default function TicketList() {
  const { tickets, updateTicketStatus, currentUser } = useStore();
  const [search, setSearch] = useState("");

  const filtered = tickets.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) || 
    t.id.toLowerCase().includes(search.toLowerCase())
  );

  const canEdit = currentUser.role === 'IT';

  return (
    <div className="flex h-screen w-full bg-slate-50/50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-heading font-bold text-slate-900">IT Tickets</h1>
              <p className="text-slate-500 mt-1">Technical support requests and status.</p>
            </div>
            <Link href="/tickets/new">
              <Button className="gap-2 shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="w-4 h-4" /> New Ticket
              </Button>
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Search tickets..." 
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
                  <TableHead>Subject</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  {canEdit && <TableHead className="text-right">Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((ticket) => (
                  <TableRow key={ticket.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-mono text-xs font-medium text-slate-500">{ticket.id}</TableCell>
                    <TableCell className="font-medium text-slate-900">{ticket.title}</TableCell>
                    <TableCell>
                      <StatusBadge status={ticket.priority} />
                    </TableCell>
                    <TableCell><StatusBadge status={ticket.status} /></TableCell>
                    {canEdit && (
                      <TableCell className="text-right space-x-2">
                        {ticket.status === 'Open' && (
                          <Button size="sm" onClick={() => updateTicketStatus(ticket.id, 'In Progress')}>Take</Button>
                        )}
                        {ticket.status === 'In Progress' && (
                          <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200" onClick={() => updateTicketStatus(ticket.id, 'Resolved')}>Resolve</Button>
                        )}
                        {ticket.status === 'Resolved' && (
                           <Button size="sm" variant="ghost" disabled>Resolved</Button>
                        )}
                      </TableCell>
                    )}
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
