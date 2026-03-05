import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: string, className?: string }) {
  let variant = "default";
  let classes = "bg-slate-100 text-slate-800 hover:bg-slate-100 border-slate-200";

  if (["Approved", "Resolved", "Closed", "Treated"].includes(status)) {
    classes = "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200";
  } else if (["Rejected", "Critical", "High"].includes(status)) {
    classes = "bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-200";
  } else if (status.includes("Pending") || status === "In Progress") {
    classes = "bg-amber-50 text-amber-700 hover:bg-amber-50 border-amber-200";
  } else if (status === "Draft") {
    classes = "bg-slate-100 text-slate-600 border-slate-200";
  } else if (status === "Memo") {
    classes = "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200";
  } else if (status === "Procurement") {
    classes = "bg-violet-100 text-violet-700 hover:bg-violet-100 border-violet-200";
  }

  return (
    <Badge variant="outline" className={cn("px-2.5 py-0.5 font-medium border", classes, className)}>
      {status}
    </Badge>
  );
}
