import Sidebar from "@/components/layout/Sidebar";
import { useStore } from "@/lib/store";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Upload, Send, X, FileIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useState, useRef } from "react";
import { showBrowserNotification } from "@/lib/notifications";

type MemoFormValues = {
  title: string;
  department: string;
  content: string;
  memoType: string;
};

type UploadedFile = {
  originalName: string;
  url: string;
};

export default function MemoCreate() {
  const { currentUser } = useStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm<MemoFormValues>({
    defaultValues: {
      department: "Marketing",
      memoType: "Memo"
    }
  });

  const selectedType = watch("memoType");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(f => formData.append('files', f));

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Upload failed');
      }

      const uploaded = await res.json();
      setUploadedFiles(prev => [...prev, ...uploaded.map((f: any) => ({ originalName: f.originalName, url: f.url }))]);
      toast({ title: "Files Uploaded", description: `${uploaded.length} file(s) uploaded successfully.` });
    } catch (error: any) {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: MemoFormValues) => {
    if (!currentUser) return;

    setSubmitting(true);
    try {
      await api.memos.create({
        title: data.title,
        department: data.department,
        content: data.content,
        memoType: data.memoType,
        initiator: currentUser.name,
        date: new Date().toISOString().split('T')[0],
        attachments: uploadedFiles
      });
      
      toast({
        title: "Memo Submitted",
        description: "Your memo has been routed to the HOD for approval.",
      });

      showBrowserNotification("Memo Submitted Successfully", {
        body: `Your memo "${data.title}" has been submitted and routed to HOD for approval.`,
        tag: 'memo-created'
      });

      setLocation("/memos");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create memo",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentUser) {
    return <div className="flex h-screen w-full bg-slate-50/50 items-center justify-center">
      <div className="text-slate-500">Loading...</div>
    </div>;
  }

  return (
    <div className="flex h-screen w-full bg-slate-50/50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/memos")} data-testid="button-back">
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
                  <Label htmlFor="memoType">Type</Label>
                  <div className="flex gap-4">
                    <label className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all ${selectedType === 'Memo' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300'}`}>
                      <input type="radio" value="Memo" {...register("memoType")} className="sr-only" />
                      <span className="font-medium">Memo</span>
                    </label>
                    <label className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all ${selectedType === 'Procurement' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300'}`}>
                      <input type="radio" value="Procurement" {...register("memoType")} className="sr-only" />
                      <span className="font-medium">Procurement</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Subject</Label>
                  <Input 
                    id="title" 
                    placeholder="e.g. Budget Approval for Q3" 
                    {...register("title", { required: true })}
                    className={errors.title ? "border-red-300 focus-visible:ring-red-200" : ""}
                    data-testid="input-title"
                    disabled={submitting}
                  />
                  {errors.title && <span className="text-xs text-red-500">Subject is required</span>}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="initiator">Initiator</Label>
                    <Input id="initiator" value={currentUser.name} disabled className="bg-slate-50" data-testid="input-initiator" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input 
                      id="department" 
                      {...register("department", { required: true })}
                      data-testid="input-department"
                      disabled={submitting}
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
                    data-testid="textarea-content"
                    disabled={submitting}
                  />
                  {errors.content && <span className="text-xs text-red-500">Content is required</span>}
                </div>

                <div className="space-y-2">
                  <Label>Attachments</Label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    multiple
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.bmp,.tiff,.svg,.xlsx,.xls,.csv,.txt,.rtf,.pptx,.ppt,.odt,.ods,.odp,.zip,.rar,.7z,.mp4,.mp3,.wav,.html,.xml,.json"
                    className="hidden"
                    data-testid="input-file-upload"
                  />
                  <div 
                    className="border-2 border-dashed border-slate-200 rounded-lg p-8 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer text-slate-500 hover:text-slate-900"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-8 h-8 opacity-50" />
                    <p className="text-sm font-medium">{uploading ? 'Uploading...' : 'Click to upload files'}</p>
                    <p className="text-xs opacity-50">PDF, Word, Excel, PowerPoint, Images, Archives, and more — up to 50MB per file, 20 files max</p>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {uploadedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200" data-testid={`uploaded-file-${idx}`}>
                          <div className="flex items-center gap-2">
                            <FileIcon className="w-4 h-4 text-slate-500" />
                            <span className="text-sm font-medium text-slate-700">{file.originalName}</span>
                          </div>
                          <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeFile(idx)} data-testid={`button-remove-file-${idx}`}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setLocation("/memos")}
                    disabled={submitting}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="gap-2 bg-blue-600 hover:bg-blue-700"
                    disabled={submitting || uploading}
                    data-testid="button-submit"
                  >
                    <Send className="w-4 h-4" /> {submitting ? 'Submitting...' : 'Submit Memo'}
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
