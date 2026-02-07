import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import EntitySelection from "@/pages/EntitySelection";
import Dashboard from "@/pages/Dashboard";
import MemoList from "@/pages/memos/MemoList";
import MemoCreate from "@/pages/memos/MemoCreate";
import MemoView from "@/pages/memos/MemoView";
import IssueList from "@/pages/issues/IssueList";
import IssueCreate from "@/pages/issues/IssueCreate";
import IssueView from "@/pages/issues/IssueView";
import TicketList from "@/pages/tickets/TicketList";
import TicketCreate from "@/pages/tickets/TicketCreate";
import TicketView from "@/pages/tickets/TicketView";
import AttachmentsHub from "@/pages/AttachmentsHub";
import Settings from "@/pages/Settings";
import UserManagement from "@/pages/admin/UserManagement";
import AuditLog from "@/pages/admin/AuditLog";
import Reports from "@/pages/admin/Reports";

import { useStore } from "@/lib/store";
import { useLocation } from "wouter";

import { useEffect } from "react";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { currentEntity } = useStore();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!currentEntity) {
      setLocation("/");
    }
  }, [currentEntity, setLocation]);

  if (!currentEntity) {
    return null;
  }

  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={EntitySelection} />
      
      <Route path="/dashboard">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      
      <Route path="/memos">
        {() => <ProtectedRoute component={MemoList} />}
      </Route>
      <Route path="/memos/new">
        {() => <ProtectedRoute component={MemoCreate} />}
      </Route>
      <Route path="/memos/:id">
        {(params) => <ProtectedRoute component={MemoView} params={params} />}
      </Route>
      
      <Route path="/issues">
        {() => <ProtectedRoute component={IssueList} />}
      </Route>
      <Route path="/issues/new">
        {() => <ProtectedRoute component={IssueCreate} />}
      </Route>
      <Route path="/issues/:id">
        {(params) => <ProtectedRoute component={IssueView} params={params} />}
      </Route>
      
      <Route path="/tickets">
        {() => <ProtectedRoute component={TicketList} />}
      </Route>
      <Route path="/tickets/new">
        {() => <ProtectedRoute component={TicketCreate} />}
      </Route>
      <Route path="/tickets/:id">
        {(params) => <ProtectedRoute component={TicketView} params={params} />}
      </Route>
      
      <Route path="/attachments">
        {() => <ProtectedRoute component={AttachmentsHub} />}
      </Route>

      <Route path="/settings">
        {() => <ProtectedRoute component={Settings} />}
      </Route>

      <Route path="/admin/users">
        {() => <ProtectedRoute component={UserManagement} />}
      </Route>
      <Route path="/admin/audit">
        {() => <ProtectedRoute component={AuditLog} />}
      </Route>
      <Route path="/admin/reports">
        {() => <ProtectedRoute component={Reports} />}
      </Route>
      
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
