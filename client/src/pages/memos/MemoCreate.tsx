import Sidebar from "@/components/layout/Sidebar";
import { useStore } from "@/lib/store";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Upload, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";

type MemoFormValues = {
  title: string;
  department: string;
  content: string;
};

export default function MemoCreate() {
  const { createMemo, currentUser } = useStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { register, handleSubmit, formState: { errors } } = useForm<MemoFormValues>({
    defaultValues: {
      department: "Marketing" // Default mock
    }
  });

  const onSubmit = (data: MemoFormValues) => {
    createMemo({
      title: data.title,
      department: data.department,
      content: data.content,
      initiator: currentUser.name,
      date: new Date().toISOString().split('T')[0],
      attachments: [] // Mock
    });
    
    toast({
      title: "Memo Submitted",
      description: "Your memo has been routed to the HOD for approval.",
    });

    setLocation("/memos");
  };

  return (
    <div className="flex h-screen w-full bg-slate-50/50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/memos")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-heading font-bold text-slate-900">New Memo</h1>
              <p className="text-slate-500">Submit a new request for approval.</p>
            </div>
          </div>

          <Card className="border-none shadow-md">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle>Memo Details</CardTitle>
              <CardDescription>All fields are mandatory for processing.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                
                <div className="space-y-2">
                  <Label htmlFor="title">Subject</Label>
                  <Input 
                    id="title" 
                    placeholder="e.g. Budget Approval for Q3" 
                    {...register("title", { required: true })}
                    className={errors.title ? "border-red-300 focus-visible:ring-red-200" : ""}
                  />
                  {errors.title && <span className="text-xs text-red-500">Subject is required</span>}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="initiator">Initiator</Label>
                    <Input id="initiator" value={currentUser.name} disabled className="bg-slate-50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input 
                      id="department" 
                      {...register("department", { required: true })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Details / Body</Label>
                  <Textarea 
                    id="content" 
                    placeholder="Describe your request in detail..." 
                    className="min-h-[200px] resize-none"
                    {...register("content", { required: true })}
                  />
                  {errors.content && <span className="text-xs text-red-500">Content is required</span>}
                </div>

                <div className="space-y-2">
                  <Label>Attachments</Label>
                  <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer text-slate-500 hover:text-slate-900">
                    <Upload className="w-8 h-8 opacity-50" />
                    <p className="text-sm font-medium">Click to upload files (Mock)</p>
                    <p className="text-xs opacity-50">PDF, DOCX, PNG up to 10MB</p>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                  <Button type="button" variant="outline" onClick={() => setLocation("/memos")}>
                    Cancel
                  </Button>
                  <Button type="submit" className="gap-2 bg-blue-600 hover:bg-blue-700">
                    <Send className="w-4 h-4" /> Submit Memo
                  </Button>
                </div>

              </form>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}
