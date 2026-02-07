import Sidebar from "@/components/layout/Sidebar";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Upload, X, FileIcon } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useState, useRef } from "react";

type UploadedFile = { originalName: string; url: string };

export default function TicketCreate() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { register, handleSubmit, control } = useForm();
  const [submitting, setSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(f => formData.append('files', f));

      const res = await fetch('/api/upload', { method: 'POST', body: formData, credentials: 'include' });
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

  const onSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      await api.tickets.create({
        title: data.title,
        description: data.description,
        priority: data.priority,
        assignedTo: 'IT',
        attachments: uploadedFiles
      });
      toast({ title: "Ticket Created", description: "IT department has been notified." });
      setLocation("/tickets");
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create ticket", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50/50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/tickets")} data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-heading font-bold text-slate-900">New IT Ticket</h1>
          </div>

          <Card className="border-none shadow-md">
            <CardHeader className="bg-emerald-50 border-b border-emerald-100">
              <CardTitle className="text-emerald-900">Support Request</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input {...register("title", { required: true })} placeholder="e.g. Printer not working" data-testid="input-title" disabled={submitting} />
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Controller
                    name="priority"
                    control={control}
                    defaultValue="Medium"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger data-testid="select-priority">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea {...register("description")} className="min-h-[100px]" placeholder="Describe the issue..." data-testid="textarea-description" disabled={submitting} />
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
                    className="border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer text-slate-500 hover:text-slate-900"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-6 h-6 opacity-50" />
                    <p className="text-sm font-medium">{uploading ? 'Uploading...' : 'Upload screenshots or logs'}</p>
                    <p className="text-xs opacity-50">PDF, Word, Excel, Images, Archives, and more — up to 50MB per file, 20 files max</p>
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

                <div className="flex justify-end gap-4 pt-4">
                  <Button type="button" variant="outline" onClick={() => setLocation("/tickets")} disabled={submitting} data-testid="button-cancel">Cancel</Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={submitting || uploading} data-testid="button-submit">
                    {submitting ? 'Submitting...' : 'Submit Ticket'}
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
