import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Dashboard from "@/pages/Dashboard";
import MemoList from "@/pages/memos/MemoList";
import MemoCreate from "@/pages/memos/MemoCreate";
import MemoView from "@/pages/memos/MemoView";
import IssueList from "@/pages/issues/IssueList";
import IssueCreate from "@/pages/issues/IssueCreate";
import TicketList from "@/pages/tickets/TicketList";
import TicketCreate from "@/pages/tickets/TicketCreate";
import AttachmentsHub from "@/pages/AttachmentsHub";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/memos" component={MemoList} />
      <Route path="/memos/new" component={MemoCreate} />
      <Route path="/memos/:id" component={MemoView} />
      
      <Route path="/issues" component={IssueList} />
      <Route path="/issues/new" component={IssueCreate} />
      
      <Route path="/tickets" component={TicketList} />
      <Route path="/tickets/new" component={TicketCreate} />
      <Route path="/attachments" component={AttachmentsHub} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
