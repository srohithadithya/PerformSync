"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import SignaturePad from "@/components/SignaturePad";
import toast from "react-hot-toast";

function ManagerReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const evalId = searchParams.get('id');

  const [managerData, setManagerData] = useState({
    commentsRole: "",
    commentsCoreSkills: "",
    commentsFunctionalSkills: "",
    commentsGrowth: "",
    ratings: {
      ownership: "",
      communication: "",
      teamwork: "",
      adaptability: "",
      prioritization: ""
    },
    overallRating: "",
    overallComments: "",
    developmentRecommendations: "",
    managerSignature: "",
    managerSignatureImage: null as string | null,
    managerSignatureDate: ""
  });
  
  const [signatureMode, setSignatureMode] = useState<"type" | "draw">("type");
  const [managerId, setManagerId] = useState<string | null>(null);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [employeeData, setEmployeeData] = useState<any>(null);

  useEffect(() => {
    const fetchEval = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setManagerId(user.id);

      if (evalId) {
        const { data, error } = await supabase
          .from('evaluations')
          .select('*')
          .eq('id', evalId)
          .single();
        
        if (data && !error) {
          // Reconstruct payload for the UI and PDF Generation
          setEmployeeData({
            ...data.form_data,
            employeeName: data.employee_name,
            employeeId: data.employee_id,
            department: data.department,
            designation: data.designation,
            employeeSignature: data.employee_signature,
            employeeSignatureDate: data.employee_signed_at,
          });
        } else {
          toast.error("Evaluation not found or access denied.");
          router.push("/dashboard");
        }
      }
    };
    fetchEval();
  }, [evalId, router, supabase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setManagerData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRatingChange = (field: string, value: string) => {
    setManagerData((prev) => ({
      ...prev,
      ratings: { ...prev.ratings, [field]: value }
    }));
  };

  const [aiSummary, setAiSummary] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);

  const generateAISummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await fetch("/api/ai-summary", {
        method: "POST",
        body: JSON.stringify({ name: "Alice Smith", department: "Engineering" }),
      });
      const data = await res.json();
      setAiSummary(data.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSummary(false);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signatureMode === "type" && !managerData.managerSignature) {
      toast.error("Please provide a typed digital signature before generating the PDF.");
      return;
    }
    if (signatureMode === "draw" && !managerData.managerSignatureImage) {
      toast.error("Please draw your digital signature before generating the PDF.");
      return;
    }

    setIsSubmitting(true);
    toast.loading("Generating PDF and finalizing review...", { id: "review-submit" });
    try {
      // 1. Combine Employee data and Manager data for the PDF
      const finalPayload = {
        ...employeeData,
        managerReview: managerData,
        aiSummary: aiSummary
      };

      // 2. Generate PDF
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalPayload),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Final_Evaluation_${employeeData?.employeeName || 'Employee'}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        
        // 3. Update Database to Completed
        if (evalId && managerId) {
          const { error: updateError } = await supabase
            .from('evaluations')
            .update({
              status: 'Completed',
              manager_id: managerId,
              manager_feedback: JSON.stringify(managerData),
              manager_rating: managerData.overallRating,
              manager_signature: signatureMode === "type" ? managerData.managerSignature : managerData.managerSignatureImage,
              manager_signed_at: new Date(managerData.managerSignatureDate).toISOString(),
              ai_summary: aiSummary
            })
            .eq('id', evalId);
            
          if (updateError) throw updateError;
        }

        toast.success("Review finalized and PDF generated successfully!", { id: "review-submit" });
        router.push("/dashboard");
      } else {
        toast.error("Failed to generate PDF", { id: "review-submit" });
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Error finalizing review: " + err.message, { id: "review-submit" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow-2xl rounded-lg overflow-hidden border border-gray-100">
        <div className="px-8 py-10 border-b border-gray-200 bg-gradient-to-r from-gray-800 to-gray-900 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Manager Review & Feedback</h1>
              <p className="mt-2 text-gray-300">Reviewing: {employeeData?.employeeName || "Unknown Employee"} ({employeeData?.designation || "N/A"})</p>
            </div>
            <button type="button" onClick={generateAISummary} disabled={loadingSummary} className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-md font-medium shadow flex items-center gap-2 transition disabled:opacity-50">
              <span>✨</span> {loadingSummary ? "Generating..." : "Generate AI Summary of Employee's Form"}
            </button>
          </div>
        </div>

        {aiSummary && (
          <div className="px-8 py-4 bg-purple-50 border-b border-purple-100">
            <h3 className="text-sm font-bold text-purple-900 mb-1">AI Generated Summary</h3>
            <p className="text-sm text-purple-800">{aiSummary}</p>
          </div>
        )}

        {/* View Employee Submission (Mocked Collapsed State) */}
        <div className="px-8 py-4 bg-indigo-50 border-b border-indigo-100 flex flex-col cursor-pointer hover:bg-indigo-100 transition">
          <div className="flex justify-between items-center">
            <span className="font-medium text-indigo-900">View {employeeData?.employeeName || "Employee"}'s Submitted Self-Assessment (Sections 1-5)</span>
            <svg className="w-5 h-5 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
          <div className="text-xs text-indigo-700 mt-2">
            Status: {employeeData?.acceptedNorms ? "✅ Signed & Accepted Norms" : "❌ Pending Signature"}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-10 space-y-12 bg-gray-50/50">
          
          {/* Section 6: Comments */}
          <section className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-3">Section 6. Manager Feedback and Ratings</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Comments on Role / Project Performance (Section 1)</label>
                <textarea name="commentsRole" rows={3} value={managerData.commentsRole} onChange={handleChange} className="w-full border rounded-md p-3 text-sm focus:border-indigo-500 focus:ring-indigo-500 shadow-sm"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Comments on Core Skills (Section 2)</label>
                <textarea name="commentsCoreSkills" rows={3} value={managerData.commentsCoreSkills} onChange={handleChange} className="w-full border rounded-md p-3 text-sm focus:border-indigo-500 focus:ring-indigo-500 shadow-sm"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Comments on Functional & Cross-Team Skills (Section 3)</label>
                <textarea name="commentsFunctionalSkills" rows={3} value={managerData.commentsFunctionalSkills} onChange={handleChange} className="w-full border rounded-md p-3 text-sm focus:border-indigo-500 focus:ring-indigo-500 shadow-sm"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Comments on Growth, Tools & New Skills (Section 4)</label>
                <textarea name="commentsGrowth" rows={3} value={managerData.commentsGrowth} onChange={handleChange} className="w-full border rounded-md p-3 text-sm focus:border-indigo-500 focus:ring-indigo-500 shadow-sm"></textarea>
              </div>
            </div>
          </section>

          {/* Manager Rating */}
          <section className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-3">Manager Rating — Core Skills</h2>
            
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/3">Core Skill</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/4">Manager Rating (1-5)</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/2">Comments</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {['Ownership & Accountability', 'Communication', 'Teamwork & Collaboration', 'Adaptability', 'Prioritization & Judgment under Ambiguity'].map((skill, idx) => {
                    const keys = ['ownership', 'communication', 'teamwork', 'adaptability', 'prioritization'];
                    const fieldKey = keys[idx];
                    return (
                      <tr key={skill} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">{skill}</td>
                        <td className="px-6 py-4 text-center">
                          <input type="number" min="1" max="5" value={managerData.ratings[fieldKey as keyof typeof managerData.ratings]} onChange={(e) => handleRatingChange(fieldKey, e.target.value)} className="w-20 rounded-md border-gray-300 shadow-sm p-2 border sm:text-sm text-center mx-auto block" />
                        </td>
                        <td className="px-6 py-4">
                          <input type="text" className="w-full rounded-md border-gray-300 shadow-sm p-2 border sm:text-sm" />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                <label className="block text-base font-bold text-blue-900 mb-2">Overall Performance Rating (1-5)</label>
                <select name="overallRating" value={managerData.overallRating} onChange={handleChange} className="w-full border-gray-300 rounded-md shadow-sm p-3 border font-semibold text-blue-900">
                  <option value="">Select Overall Rating...</option>
                  <option value="5">5 = Outstanding</option>
                  <option value="4">4 = Exceeds Expectations</option>
                  <option value="3">3 = Meets Expectations</option>
                  <option value="2">2 = Developing</option>
                  <option value="1">1 = Needs Improvement</option>
                </select>
              </div>
            </div>
            
            <div className="mt-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Manager's Overall Comments</label>
                <textarea name="overallComments" rows={4} value={managerData.overallComments} onChange={handleChange} className="w-full border rounded-md p-3 text-sm focus:border-indigo-500 focus:ring-indigo-500 shadow-sm"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Development Recommendations / Support to be Provided</label>
                <textarea name="developmentRecommendations" rows={4} value={managerData.developmentRecommendations} onChange={handleChange} className="w-full border rounded-md p-3 text-sm focus:border-indigo-500 focus:ring-indigo-500 shadow-sm"></textarea>
              </div>
            </div>
          </section>

          {/* Manager Signature block */}
          <section className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 mt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-3">Manager Digital Signature</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-sm font-medium text-gray-700">Manager / HR Signature</label>
                  <div className="flex bg-gray-100 rounded p-0.5">
                    <button type="button" onClick={() => setSignatureMode("type")} className={`px-2 py-1 text-xs rounded shadow-sm ${signatureMode === "type" ? "bg-white text-gray-900 font-medium" : "text-gray-500 hover:text-gray-700"}`}>Type</button>
                    <button type="button" onClick={() => setSignatureMode("draw")} className={`px-2 py-1 text-xs rounded shadow-sm ${signatureMode === "draw" ? "bg-white text-gray-900 font-medium" : "text-gray-500 hover:text-gray-700"}`}>Draw</button>
                  </div>
                </div>
                {signatureMode === "type" ? (
                  <input required type="text" name="managerSignature" value={managerData.managerSignature} onChange={handleChange} className="w-full border rounded p-3 text-sm focus:border-indigo-500 focus:ring-indigo-500 font-serif italic bg-gray-50" placeholder="Type your full name as signature" />
                ) : (
                  <SignaturePad onSignatureChange={(img) => setManagerData({...managerData, managerSignatureImage: img})} />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Signed</label>
                <input required type="date" name="managerSignatureDate" value={managerData.managerSignatureDate} onChange={handleChange} className="w-full border rounded p-3 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
              </div>
            </div>
          </section>

          <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-200">
            <div className="text-sm text-gray-500 italic">This will finalize the performance review and generate the signed PDF.</div>
            <div className="flex gap-4">
              <button type="button" className="px-6 py-2.5 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 font-medium shadow-sm transition-colors">Save Draft</button>
              <button type="submit" disabled={isSubmitting || (signatureMode === "type" ? !managerData.managerSignature : !managerData.managerSignatureImage)} className="px-8 py-2.5 bg-gray-900 border border-transparent rounded-md shadow-md text-white font-medium hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors disabled:opacity-50">
                {isSubmitting ? "Finalizing..." : "Finalize & Generate PDF"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ManagerReviewForm() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading Review Form...</div>}>
      <ManagerReviewContent />
    </Suspense>
  );
}
