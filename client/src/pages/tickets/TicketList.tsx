import Sidebar from "@/components/layout/Sidebar";
import { useStore, Ticket } from "@/lib/store";
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

export default function TicketList() {
  const { currentUser } = useStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const data = await api.tickets.getAll();
        setTickets(data);
      } catch (error) {
        console.error('Failed to fetch tickets:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  const filtered = tickets.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) || 
    t.ticketId.toLowerCase().includes(search.toLowerCase())
  );

  const canEdit = currentUser?.role === 'IT';

  const handleStatusUpdate = async (ticketId: number, status: string) => {
    try {
      await api.tickets.updateStatus(ticketId, status);
      const data = await api.tickets.getAll();
      setTickets(data);
    } catch (error) {
      console.error('Failed to update ticket:', error);
    }
  };

  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground">IT Tickets</h1>
              <p className="text-muted-foreground mt-1">Technical support requests and status.</p>
            </div>
            <Link href="/tickets/new">
              <Button className="gap-2 shadow-lg" data-testid="button-new-ticket">
                <Plus className="w-4 h-4" /> New Ticket
              </Button>
            </Link>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border flex gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search tickets..." 
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  data-testid="input-search-tickets"
                />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Raised By</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      No tickets found.
                    </TableCell>
                  </TableRow>
                ) : filtered.map((ticket) => (
                  <TableRow key={ticket.id} className="hover:bg-muted/50" data-testid={`ticket-row-${ticket.ticketId}`}>
                    <TableCell className="font-mono text-xs font-medium text-muted-foreground">{ticket.ticketId}</TableCell>
                    <TableCell className="font-medium text-foreground">{ticket.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{ticket.createdBy || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{ticket.department || '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={ticket.priority} />
                    </TableCell>
                    <TableCell><StatusBadge status={ticket.status} /></TableCell>
                    <TableCell className="text-right space-x-2">
                      <Link href={`/tickets/${ticket.id}`}>
                        <Button size="sm" variant="outline" className="gap-1" data-testid={`button-view-${ticket.ticketId}`}>
                          <Eye className="w-3 h-3" /> View
                        </Button>
                      </Link>
                      {canEdit && ticket.status === 'Open' && (
                        <Button size="sm" onClick={() => handleStatusUpdate(ticket.id, 'In Progress')} data-testid={`button-take-${ticket.ticketId}`}>Take</Button>
                      )}
                      {canEdit && ticket.status === 'In Progress' && (
                        <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(ticket.id, 'Resolved')} data-testid={`button-resolve-${ticket.ticketId}`}>Resolve</Button>
                      )}
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
