import Sidebar from "@/components/layout/Sidebar";
import { useStore } from "@/lib/store";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";

export default function IssueCreate() {
  const { createIssue } = useStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { register, handleSubmit } = useForm();

  const onSubmit = (data: any) => {
    createIssue({
      title: data.title,
      description: data.description,
      cost: data.cost,
      cause: data.cause,
      date: data.date,
      department: data.department,
      assignedTo: ['IT', 'MD', 'Risk']
    });
    toast({ title: "Issue Logged", description: "Incident has been reported to IT, MD, and Risk." });
    setLocation("/issues");
  };

  return (
    <div className="flex h-screen w-full bg-slate-50/50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/issues")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-heading font-bold text-slate-900">Log New Issue</h1>
          </div>

          <Card className="border-none shadow-md">
            <CardHeader className="bg-rose-50 border-b border-rose-100">
              <CardTitle className="text-rose-900">Incident Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Incident Title</Label>
                    <Input {...register("title", { required: true })} placeholder="e.g. Server Failure" />
                  </div>
                  <div className="space-y-2">
                    <Label>Date of Incident</Label>
                    <Input type="date" {...register("date", { required: true })} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Department Affected</Label>
                    <Input {...register("department")} placeholder="e.g. IT" />
                  </div>
                  <div className="space-y-2">
                    <Label>Estimated Cost</Label>
                    <Input {...register("cost")} placeholder="e.g. $500" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Root Cause</Label>
                  <Input {...register("cause")} placeholder="e.g. Power Surge" />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea {...register("description")} className="min-h-[100px]" />
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <Button type="button" variant="outline" onClick={() => setLocation("/issues")}>Cancel</Button>
                  <Button type="submit" className="bg-rose-600 hover:bg-rose-700">Submit Report</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
