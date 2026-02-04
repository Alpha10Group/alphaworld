import { useRef, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { useStore, Memo } from "@/lib/store";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ArrowLeft, Download, CheckCircle2, XCircle, Clock, FileText, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function MemoView() {
  const [, params] = useRoute("/memos/:id");
  const [, setLocation] = useLocation();
  const { memos, currentUser, approveMemo, rejectMemo } = useStore();
  const { toast } = useToast();
  
  const memo = memos.find(m => m.id === params?.id);
  const pdfRef = useRef<HTMLDivElement>(null);

  const [actionComment, setActionComment] = useState("");
  const [signature, setSignature] = useState(currentUser.name);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'resubmit'>('approve');
  const [resubmitContent, setResubmitContent] = useState(memo?.content || "");

  if (!memo) return <div>Memo not found</div>;

  const canAct = memo.currentHandler === currentUser.role && !['Approved', 'Rejected'].includes(memo.status);
  const canResubmit = memo.status === 'Rejected' && memo.initiator === currentUser.name;

  const handleAction = () => {
    setIsProcessing(true);
    setTimeout(() => {
      if (actionType === 'approve') {
        approveMemo(memo.id, actionComment, signature);
        toast({ title: "Approved", description: "Memo has been forwarded to the next stage." });
      } else if (actionType === 'reject') {
        rejectMemo(memo.id, actionComment);
        toast({ title: "Rejected", description: "Memo has been rejected and returned to initiator.", variant: "destructive" });
      } else if (actionType === 'resubmit') {
        useStore.getState().resubmitMemo(memo.id, resubmitContent);
        toast({ title: "Resubmitted", description: "Memo has been updated and sent back to HOD." });
      }
      setIsProcessing(false);
      setIsDialogOpen(false);
      setActionComment("");
    }, 800);
  };

  const handleDownloadPDF = async () => {
    if (!pdfRef.current) return;
    
    toast({ title: "Generating PDF", description: "Please wait..." });
    
    try {
      const canvas = await html2canvas(pdfRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${memo.id}_Signed.pdf`);
      
      toast({ title: "Success", description: "Memo downloaded successfully." });
    } catch (err) {
      toast({ title: "Error", description: "Failed to generate PDF", variant: "destructive" });
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50/50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          
          {/* Header Actions */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setLocation("/memos")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-heading font-bold text-slate-900">{memo.id}</h1>
                <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={memo.status} />
                    <span className="text-slate-500 text-sm">Initiated by {memo.initiator} on {memo.date}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
               {canResubmit && (
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                    onClick={() => { setActionType('resubmit'); setResubmitContent(memo.content); setIsDialogOpen(true); }}
                  >
                    Revise & Resubmit
                  </Button>
               )}
               <Button variant="outline" className="gap-2" onClick={handleDownloadPDF}>
                <Download className="w-4 h-4" /> Download PDF
              </Button>
              
              {canAct && (
                <>
                  <Button 
                    variant="destructive" 
                    onClick={() => { setActionType('reject'); setIsDialogOpen(true); }}
                  >
                    Reject
                  </Button>
                  <Button 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                    onClick={() => { setActionType('approve'); setIsDialogOpen(true); }}
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* DOCUMENT CONTENT TO PRINT */}
          <div ref={pdfRef} className="bg-white p-12 rounded-lg shadow-sm border border-slate-200 min-h-[800px] relative">
            {/* Header / Logo for PDF */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-8 mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xl">N</div>
                    <div>
                        <h2 className="font-heading font-bold text-xl text-slate-900">NexusFlow</h2>
                        <p className="text-xs text-slate-500 uppercase tracking-widest">Internal Memo</p>
                    </div>
                </div>
                <div className="text-right text-sm text-slate-500">
                    <p>Ref: {memo.id}</p>
                    <p>Date: {memo.date}</p>
                </div>
            </div>

            <div className="space-y-8">
                <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-1">Subject</h3>
                    <h1 className="text-2xl font-serif font-medium text-slate-900">{memo.title}</h1>
                </div>

                <div className="grid grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">From</h3>
                        <p className="text-slate-900">{memo.initiator}</p>
                        <p className="text-slate-500 text-sm">{memo.department}</p>
                    </div>
                    <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">To</h3>
                        <p className="text-slate-900">HOD, Operations, EAG, MD, Finance</p>
                    </div>
                </div>

                <div className="prose max-w-none text-slate-700 leading-relaxed py-4 border-t border-b border-slate-100 min-h-[200px]">
                    {memo.content.split('\n').map((line, i) => (
                        <p key={i}>{line}</p>
                    ))}
                </div>

                {/* Workflow Signatures */}
                <div>
                    <h3 className="font-heading font-semibold text-lg mb-4">Approval History</h3>
                    <div className="space-y-6">
                        {memo.workflow.map((step, index) => (
                            <div key={step.role} className={cn(
                                "flex items-start gap-4 p-4 rounded-lg border",
                                step.status === 'Approved' ? "bg-slate-50 border-slate-200" : "bg-white border-transparent"
                            )}>
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                                    step.status === 'Approved' ? "bg-emerald-100 text-emerald-700" : 
                                    step.status === 'Rejected' ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-400"
                                )}>
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between mb-1">
                                        <h4 className="font-semibold text-sm">{step.role}</h4>
                                        <span className={cn(
                                            "text-xs font-medium px-2 py-0.5 rounded",
                                            step.status === 'Approved' ? "bg-emerald-100 text-emerald-700" :
                                            step.status === 'Pending' ? "bg-amber-50 text-amber-700" : "bg-slate-100"
                                        )}>
                                            {step.status}
                                        </span>
                                    </div>
                                    {step.status !== 'Pending' && (
                                        <>
                                            <p className="text-sm text-slate-600 italic">"{step.comment || 'No comments'}"</p>
                                            <div className="mt-2 flex justify-between items-end">
                                                <div className="text-xs text-slate-400">
                                                    Signed by <span className="font-medium text-slate-900">{step.signature || 'Unknown'}</span>
                                                </div>
                                                <div className="text-xs text-slate-400">{step.date}</div>
                                            </div>
                                            {/* Digital Signature Visual */}
                                            {step.signature && (
                                                <div className="mt-2 font-handwriting text-2xl text-blue-900 opacity-60 transform -rotate-2 select-none pointer-events-none font-serif">
                                                    {step.signature}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-slate-200 text-center text-xs text-slate-400">
                <p>Generated by NexusFlow System • {new Date().getFullYear()}</p>
                <p>ID: {memo.id}</p>
            </div>
          </div>

          {/* Action Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                      {actionType === 'approve' ? 'Approve Memo' : 
                       actionType === 'reject' ? 'Reject Memo' : 'Revise & Resubmit'}
                    </DialogTitle>
                    <DialogDescription>
                        {actionType === 'approve' 
                            ? 'Please provide your remarks and digital signature to proceed.' 
                            : actionType === 'reject'
                            ? 'Please provide a reason for rejection.'
                            : 'Update the content of your memo and resubmit for approval.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {actionType === 'resubmit' ? (
                      <div className="space-y-2">
                        <Label>New Content</Label>
                        <Textarea 
                          value={resubmitContent} 
                          onChange={(e) => setResubmitContent(e.target.value)}
                          className="min-h-[200px]"
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                          <Label>Remarks / Comments</Label>
                          <Textarea 
                              value={actionComment} 
                              onChange={(e) => setActionComment(e.target.value)}
                              placeholder={actionType === 'approve' ? "Approved as per budget..." : "Rejected because..."}
                          />
                      </div>
                    )}
                    {actionType === 'approve' && (
                        <div className="space-y-2">
                            <Label>Digital Signature</Label>
                            <Input 
                                value={signature} 
                                onChange={(e) => setSignature(e.target.value)}
                                className="font-serif italic text-lg"
                            />
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button 
                        variant={actionType === 'reject' ? 'destructive' : 'default'}
                        onClick={handleAction}
                        disabled={isProcessing}
                    >
                        {isProcessing ? 'Processing...' : 
                         actionType === 'approve' ? 'Sign & Approve' : 
                         actionType === 'reject' ? 'Reject' : 'Resubmit'}
                    </Button>
                </DialogFooter>
            </DialogContent>
          </Dialog>

        </div>
      </main>
    </div>
  );
}
