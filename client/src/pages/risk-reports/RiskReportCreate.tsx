import Sidebar from "@/components/layout/Sidebar";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Upload, X, FileIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useState, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type UploadedFile = { originalName: string; url: string };

export default function RiskReportCreate() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { register, handleSubmit, setValue } = useForm();
  const [submitting, setSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [riskCategory, setRiskCategory] = useState("");
  const [likelihood, setLikelihood] = useState("");
  const [impact, setImpact] = useState("");

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
      await api.riskReports.create({
        title: data.title,
        description: data.description,
        riskCategory: riskCategory,
        likelihood: likelihood,
        impact: impact,
        date: data.date,
        department: data.department || '',
        mitigationPlan: data.mitigationPlan || '',
        attachments: uploadedFiles
      });
      toast({ title: "Risk Report Submitted", description: "Risk report has been logged and assigned to IT and Risk." });
      setLocation("/risk-reports");
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create risk report", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/risk-reports")} data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-heading font-bold text-foreground">Log New Risk Report</h1>
          </div>

          <Card className="border-none shadow-md">
            <CardHeader className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-100 dark:border-amber-900/30">
              <CardTitle className="text-amber-900 dark:text-amber-200">Risk Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Risk Title</Label>
                    <Input {...register("title", { required: true })} placeholder="e.g. Data Breach Risk" data-testid="input-title" disabled={submitting} />
                  </div>
                  <div className="space-y-2">
                    <Label>Date Identified</Label>
                    <Input type="date" {...register("date", { required: true })} data-testid="input-date" disabled={submitting} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Risk Category</Label>
                    <Select value={riskCategory} onValueChange={setRiskCategory}>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Operational">Operational</SelectItem>
                        <SelectItem value="Financial">Financial</SelectItem>
                        <SelectItem value="Compliance">Compliance</SelectItem>
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Strategic">Strategic</SelectItem>
                        <SelectItem value="Reputational">Reputational</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Input {...register("department")} placeholder="e.g. Operations" data-testid="input-department" disabled={submitting} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Likelihood</Label>
                    <Select value={likelihood} onValueChange={setLikelihood}>
                      <SelectTrigger data-testid="select-likelihood">
                        <SelectValue placeholder="Select likelihood" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Impact</Label>
                    <Select value={impact} onValueChange={setImpact}>
                      <SelectTrigger data-testid="select-impact">
                        <SelectValue placeholder="Select impact level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea {...register("description")} className="min-h-[100px]" placeholder="Describe the risk in detail..." data-testid="textarea-description" disabled={submitting} />
                </div>

                <div className="space-y-2">
                  <Label>Mitigation Plan</Label>
                  <Textarea {...register("mitigationPlan")} className="min-h-[80px]" placeholder="Proposed steps to mitigate this risk..." data-testid="textarea-mitigation" disabled={submitting} />
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
                    className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-6 h-6 opacity-50" />
                    <p className="text-sm font-medium">{uploading ? 'Uploading...' : 'Click to upload supporting documents'}</p>
                    <p className="text-xs opacity-50">PDF, Word, Excel, Images, Archives, and more</p>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {uploadedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border" data-testid={`uploaded-file-${idx}`}>
                          <div className="flex items-center gap-2">
                            <FileIcon className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">{file.originalName}</span>
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
                  <Button type="button" variant="outline" onClick={() => setLocation("/risk-reports")} disabled={submitting} data-testid="button-cancel">Cancel</Button>
                  <Button type="submit" className="bg-amber-600 hover:bg-amber-700" disabled={submitting || uploading} data-testid="button-submit">
                    {submitting ? 'Submitting...' : 'Submit Risk Report'}
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
