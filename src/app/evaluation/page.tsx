"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SignaturePad from "@/components/SignaturePad";
import { createClient } from "@/utils/supabase/client";
import toast from "react-hot-toast";
import { evaluationTemplate, EvaluationSection } from "@/config/evaluation-template";

export default function EmployeeEvaluationForm() {
  const router = useRouter();
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        let user: any = session?.user;

        if (!user) {
          const { data: { user: fetchedUser } } = await supabase.auth.getUser();
          user = fetchedUser;
        }
        
        if (!user) {
          toast.error("Authentication error. Please log in again.");
          router.push("/login");
          return;
        }
        setUserId(user.id);
      } catch (err) {
        console.error(err);
      }
    };
    checkAuth();
  }, [router, supabase]);

  // Initialize Dynamic Data State
  const initialDynamicData: Record<string, any> = {};
  evaluationTemplate.forEach(section => {
    if (section.type === "kpi-list") {
      initialDynamicData[section.id] = [{ id: 1, kpi: "", target: "", achieved: "", status: "", comments: "" }];
    } else if (section.type === "rating-grid") {
      initialDynamicData[section.id] = {};
      section.items?.forEach(item => {
        initialDynamicData[section.id][item.id] = { rating: "", examples: "" };
      });
    } else if (section.type === "text-area" || section.type === "text-input") {
      initialDynamicData[section.id] = "";
    }
  });

  const [formData, setFormData] = useState({
    employmentType: "", employeeName: "", employeeId: "", department: "", designation: "", reviewPeriod: "", date: "", reportingManager: "", location: "",
    employeeSignature: "",
    employeeSignatureImage: null as string | null,
    employeeSignatureDate: "",
    acceptedNorms: false,
    dynamicData: initialDynamicData
  });
  
  const [signatureMode, setSignatureMode] = useState<"type" | "draw">("type");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDynamicChange = (sectionId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      dynamicData: { ...prev.dynamicData, [sectionId]: value }
    }));
  };

  const handleKpiChange = (sectionId: string, index: number, field: string, value: string) => {
    const newKpis = [...formData.dynamicData[sectionId]];
    newKpis[index] = { ...newKpis[index], [field]: value };
    handleDynamicChange(sectionId, newKpis);
  };

  const addKpi = (sectionId: string) => {
    const kpis = formData.dynamicData[sectionId];
    handleDynamicChange(sectionId, [...kpis, { id: kpis.length + 1, kpi: "", target: "", achieved: "", status: "", comments: "" }]);
  };

  const handleRatingChange = (sectionId: string, itemId: string, field: 'rating'|'examples', value: string) => {
    setFormData(prev => ({
      ...prev,
      dynamicData: {
        ...prev.dynamicData,
        [sectionId]: {
          ...prev.dynamicData[sectionId],
          [itemId]: {
            ...prev.dynamicData[sectionId][itemId],
            [field]: value
          }
        }
      }
    }));
  };

  useEffect(() => {
    const fetchMyProfile = async () => {
      if (!userId) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('employee_id, full_name, department, role_name, location')
        .eq('id', userId)
        .single();
        
      if (profile) {
        setFormData(prev => ({
          ...prev,
          employeeId: profile.employee_id || prev.employeeId,
          employeeName: profile.full_name || prev.employeeName,
          department: profile.department || prev.department,
          designation: profile.role_name || prev.designation,
          location: profile.location || prev.location
        }));
        setValidationSuccess(true);
      }
    };
    fetchMyProfile();
  }, [userId, supabase]);

  const [isValidating, setIsValidating] = useState(false);
  const [validationSuccess, setValidationSuccess] = useState<boolean | null>(null);

  const [fetchErrorMsg, setFetchErrorMsg] = useState<string | null>(null);

  const validateAndFetch = async () => {
    if (!formData.employeeId) return;
    
    setIsValidating(true);
    setValidationSuccess(null);
    setFetchErrorMsg(null);

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('full_name, department, role_name, location')
        .eq('employee_id', formData.employeeId.trim())
        .single();

      if (profile && !error) {
        setFormData(prev => ({ 
          ...prev, 
          employeeName: profile.full_name || prev.employeeName,
          department: profile.department || prev.department,
          designation: profile.role_name || prev.designation,
          location: profile.location || prev.location
        }));
        setValidationSuccess(true);
      } else {
        setValidationSuccess(false);
        if (error && error.code === 'PGRST116') {
          setFetchErrorMsg("ID not found, or you do not have permission to view it.");
        } else {
          setFetchErrorMsg(error ? `DB Error: ${error.message} (Code: ${error.code})` : "No profile found.");
        }
      }
    } catch (err: any) {
      console.error("Auto-fetch error", err);
      setValidationSuccess(false);
      setFetchErrorMsg(`Network Error: ${err.message}`);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.acceptedNorms) {
      toast.error("You must accept the company norms and policies to submit this evaluation.");
      return;
    }
    if (!userId) {
      toast.error("Authentication error. Please log in again.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('evaluations').insert({
        user_id: userId,
        employee_name: formData.employeeName,
        employee_id: formData.employeeId,
        department: formData.department,
        designation: formData.designation,
        review_period: formData.reviewPeriod,
        status: 'Pending Manager Review',
        form_data: formData, // the entire payload including dynamicData
        employee_signature: signatureMode === "type" ? formData.employeeSignature : formData.employeeSignatureImage,
        employee_signed_at: new Date(formData.employeeSignatureDate).toISOString()
      });

      if (error) throw error;
      
      toast.success("Evaluation submitted successfully!");
      router.push("/success?type=evaluation");
    } catch (err: any) {
      console.error("Submission error:", err);
      toast.error("Failed to submit evaluation: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isPolishing, setIsPolishing] = useState<string | null>(null);

  const handleAIPolish = async (sectionId: string, currentText: string) => {
    if (!currentText || currentText.trim().length < 5) {
      toast.error("Please write at least a few words before polishing.");
      return;
    }
    setIsPolishing(sectionId);
    try {
      const res = await fetch("/api/ai-polish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: currentText }),
      });
      const data = await res.json();
      if (data.polishedText) {
        handleDynamicChange(sectionId, data.polishedText);
        toast.success("Text polished successfully! ✨");
      } else {
        throw new Error(data.error || "Failed to polish text");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsPolishing(null);
    }
  };

  const renderDynamicSection = (section: EvaluationSection) => {
    if (section.type === "text-area") {
      const currentVal = formData.dynamicData[section.id] || "";
      return (
        <div className="relative">
          <textarea 
            rows={4}
            value={currentVal} 
            onChange={(e) => handleDynamicChange(section.id, e.target.value)} 
            placeholder={section.placeholder}
            className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 border sm:text-sm pr-20"
          />
          <button
            type="button"
            onClick={() => handleAIPolish(section.id, currentVal)}
            disabled={isPolishing === section.id || currentVal.length < 5}
            className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-md text-xs font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>✨</span> {isPolishing === section.id ? "Polishing..." : "AI Polish"}
          </button>
        </div>
      );
    }

    if (section.type === "kpi-list") {
      const kpis = formData.dynamicData[section.id] || [];
      return (
        <div>
          {kpis.map((kpi: any, index: number) => (
            <div key={kpi.id} className="mb-6 p-5 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-4">Item #{kpi.id}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="col-span-1 lg:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">Objective Description</label>
                  <input type="text" value={kpi.kpi} onChange={(e) => handleKpiChange(section.id, index, "kpi", e.target.value)} className="mt-2 block w-full rounded-md border-gray-300 shadow-sm p-2.5 border sm:text-sm" placeholder="What was the goal?" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">Target</label>
                  <input type="text" value={kpi.target} onChange={(e) => handleKpiChange(section.id, index, "target", e.target.value)} className="mt-2 block w-full rounded-md border-gray-300 shadow-sm p-2.5 border sm:text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">Result Achieved</label>
                  <input type="text" value={kpi.achieved} onChange={(e) => handleKpiChange(section.id, index, "achieved", e.target.value)} className="mt-2 block w-full rounded-md border-gray-300 shadow-sm p-2.5 border sm:text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">Status</label>
                  <select value={kpi.status} onChange={(e) => handleKpiChange(section.id, index, "status", e.target.value)} className="mt-2 block w-full rounded-md border-gray-300 shadow-sm p-2.5 border bg-white sm:text-sm">
                    <option value="">Select...</option>
                    <option value="Exceeded">✅ Exceeded</option>
                    <option value="Met">✅ Met</option>
                    <option value="Partially Met">⚠️ Partially Met</option>
                    <option value="Not Met">❌ Not Met</option>
                    <option value="Not Measurable">⚪ Not Measurable</option>
                  </select>
                </div>
                <div className="col-span-1 lg:col-span-5">
                  <label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">Comments / Evidence</label>
                  <input type="text" value={kpi.comments} onChange={(e) => handleKpiChange(section.id, index, "comments", e.target.value)} className="mt-2 block w-full rounded-md border-gray-300 shadow-sm p-2.5 border sm:text-sm" placeholder="Link to report, dashboard, explanation of why missed, etc." />
                </div>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => addKpi(section.id)} className="mt-2 inline-flex items-center text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
            Add another item
          </button>
        </div>
      );
    }

    if (section.type === "rating-grid" && section.items) {
      return (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/3">Criteria</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/6">Rating (1-5)</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/2">Examples / Evidence</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {section.items.map((item) => {
                const val = formData.dynamicData[section.id]?.[item.id] || { rating: "", examples: "" };
                return (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {item.label}
                      {item.description && <p className="text-xs text-gray-500 font-normal mt-1">{item.description}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <input type="number" min="1" max="5" value={val.rating} onChange={(e) => handleRatingChange(section.id, item.id, 'rating', e.target.value)} className="w-20 rounded-md border-gray-300 shadow-sm p-2 border sm:text-sm text-center" />
                    </td>
                    <td className="px-6 py-4">
                      <input type="text" value={val.examples} onChange={(e) => handleRatingChange(section.id, item.id, 'examples', e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm p-2 border sm:text-sm" placeholder="Provide a specific scenario..." />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow-2xl rounded-lg overflow-hidden border border-gray-100">
        <div className="px-8 py-10 border-b border-gray-200 bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
          <h1 className="text-3xl font-bold tracking-tight">Performance Self-Assessment</h1>
          <p className="mt-2 text-blue-200">Employee Self-Evaluation Form</p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-10 space-y-12 bg-gray-50/50">
          
          {/* Header Section */}
          <section className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6 border-b pb-3">
              <h2 className="text-xl font-semibold text-gray-800">Employee Details</h2>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Employment Type</label>
                <select required name="employmentType" value={formData.employmentType} onChange={(e) => { handleChange(e); setTimeout(validateAndFetch, 100); }} className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border bg-white">
                  <option value="">Select Type...</option>
                  <option value="Full-Time Employee">Full-Time Employee</option>
                  <option value="Intern">Intern</option>
                  <option value="Contractor">Contractor</option>
                  <option value="Part-Time">Part-Time</option>
                </select>
              </div>
            </div>
            
            {validationSuccess === false && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                Warning: Employee ID not found. {fetchErrorMsg}
              </div>
            )}
            {validationSuccess === true && (
              <div className="mb-6 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                Employee details auto-filled successfully!
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
              {isValidating && <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">Fetching details...</div>}
              <div><label className="block text-sm font-medium text-gray-700">Employee ID</label><input required type="text" name="employeeId" value={formData.employeeId} onChange={handleChange} onBlur={validateAndFetch} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border" placeholder="Enter ID to auto-fill" /></div>
              <div><label className="block text-sm font-medium text-gray-700">Employee Name</label><input required type="text" name="employeeName" value={formData.employeeName} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border bg-gray-50" /></div>
              <div><label className="block text-sm font-medium text-gray-700">Department</label><input required type="text" name="department" value={formData.department} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border" /></div>
              <div><label className="block text-sm font-medium text-gray-700">Designation</label><input required type="text" name="designation" value={formData.designation} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border" /></div>
              <div><label className="block text-sm font-medium text-gray-700">Review Period</label><input required type="text" name="reviewPeriod" value={formData.reviewPeriod} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border" /></div>
              <div><label className="block text-sm font-medium text-gray-700">Date</label><input required type="date" name="date" value={formData.date} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border" /></div>
              <div><label className="block text-sm font-medium text-gray-700">Reporting Manager</label><input required type="text" name="reportingManager" value={formData.reportingManager} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border" /></div>
              <div><label className="block text-sm font-medium text-gray-700">Location <span className="text-xs text-green-600 font-normal ml-1">(Auto-fetched or Manual)</span></label><input required type="text" name="location" value={formData.location} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border" placeholder="Enter location..." /></div>
            </div>
          </section>

          {/* DYNAMIC SECTIONS */}
          {evaluationTemplate.map((section) => (
            <section key={section.id} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800 mb-2 border-b pb-3">{section.title}</h2>
              {section.description && <p className="text-sm text-gray-500 mb-6 mt-2">{section.description}</p>}
              
              {renderDynamicSection(section)}
            </section>
          ))}

          {/* Section: Declarations & Signatures */}
          <section className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-3">Declarations & Signatures</h2>
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input id="acceptedNorms" name="acceptedNorms" type="checkbox" required checked={formData.acceptedNorms} onChange={(e) => setFormData({...formData, acceptedNorms: e.target.checked})} className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="acceptedNorms" className="font-medium text-gray-700">I declare that the information provided is accurate and I accept the company norms and policies regarding this performance evaluation.</label>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <label className="block text-sm font-medium text-gray-700">Employee Digital Signature</label>
                    <div className="flex bg-gray-100 rounded p-0.5">
                      <button type="button" onClick={() => setSignatureMode("type")} className={`px-2 py-1 text-xs rounded shadow-sm ${signatureMode === "type" ? "bg-white text-gray-900 font-medium" : "text-gray-500 hover:text-gray-700"}`}>Type</button>
                      <button type="button" onClick={() => setSignatureMode("draw")} className={`px-2 py-1 text-xs rounded shadow-sm ${signatureMode === "draw" ? "bg-white text-gray-900 font-medium" : "text-gray-500 hover:text-gray-700"}`}>Draw</button>
                    </div>
                  </div>
                  {signatureMode === "type" ? (
                    <input required type="text" name="employeeSignature" value={formData.employeeSignature} onChange={handleChange} className="w-full border rounded p-3 text-sm focus:border-indigo-500 focus:ring-indigo-500 font-serif italic bg-gray-50" placeholder="Type your full name as signature" />
                  ) : (
                    <SignaturePad onSignatureChange={(img) => setFormData({...formData, employeeSignatureImage: img})} />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Signed</label>
                  <input required type="date" name="employeeSignatureDate" value={formData.employeeSignatureDate} onChange={handleChange} className="w-full border rounded p-3 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
                </div>
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-4 pt-6 mt-6 border-t border-gray-200">
            <button type="button" className="px-6 py-2.5 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 font-medium shadow-sm transition-colors">Save as Draft</button>
            <button type="submit" disabled={isSubmitting || !formData.acceptedNorms || (signatureMode === "type" ? !formData.employeeSignature : !formData.employeeSignatureImage)} className="px-8 py-2.5 bg-indigo-600 border border-transparent rounded-md shadow-md text-white font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50">
              {isSubmitting ? "Submitting..." : "Submit Final to Manager"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
