"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SignaturePad from "@/components/SignaturePad";
import { createClient } from "@/utils/supabase/client";

export default function EmployeeEvaluationForm() {
  const router = useRouter();
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
      } else {
        setUserId(user.id);
      }
    };
    checkAuth();
  }, [router, supabase]);

  const [formData, setFormData] = useState({
    employmentType: "", employeeName: "", employeeId: "", department: "", designation: "", reviewPeriod: "", date: "", reportingManager: "", location: "",
    kpis: [{ id: 1, kpi: "", target: "", achieved: "", status: "", comments: "" }],
    keyAchievements: "",
    coreSkills: { ownership: "", teamwork: "", adaptability: "", prioritization: "", communication: "" },
    technicalSkills: [{ skill: "", rating: "", examples: "" }],
    gtmSkills: [{ skill: "", rating: "", examples: "" }],
    crossFunctionalSkills: [{ skill: "", rating: "", examples: "" }],
    toolsUsed: "",
    newSkills: "",
    skillApplied: "",
    selfReflection: {
      feedbackReceived: "",
      challenges: "",
      areasForDevelopment: "",
      focusAreas: ""
    },
    employeeSignature: "",
    employeeSignatureImage: null as string | null,
    employeeSignatureDate: "",
    acceptedNorms: false
  });
  
  const [signatureMode, setSignatureMode] = useState<"type" | "draw">("type");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleKpiChange = (index: number, field: string, value: string) => {
    const newKpis = [...formData.kpis];
    newKpis[index] = { ...newKpis[index], [field]: value };
    setFormData({ ...formData, kpis: newKpis });
  };

  const handleReflectionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      selfReflection: { ...prev.selfReflection, [name]: value }
    }));
  };

  const addKpi = () => {
    setFormData({ ...formData, kpis: [...formData.kpis, { id: formData.kpis.length + 1, kpi: "", target: "", achieved: "", status: "", comments: "" }] });
  };

  const [isValidating, setIsValidating] = useState(false);
  const [validationSuccess, setValidationSuccess] = useState<boolean | null>(null);

  // Mock Employee Database for auto-fetching
  const mockDirectory = [
    { id: "EMP001", name: "Alice Smith", location: "New York, NY" },
    { id: "EMP002", name: "Bob Jones", location: "London, UK" },
    { id: "INT001", name: "Charlie Brown", location: "San Francisco, CA" }
  ];

  const validateAndFetch = () => {
    if (!formData.employeeId || !formData.employeeName || !formData.employmentType) return;
    
    setIsValidating(true);
    // Simulate network delay
    setTimeout(() => {
      const match = mockDirectory.find(emp => 
        emp.id.toLowerCase() === formData.employeeId.toLowerCase() && 
        emp.name.toLowerCase() === formData.employeeName.toLowerCase()
      );

      if (match) {
        setFormData(prev => ({ ...prev, location: match.location }));
        setValidationSuccess(true);
      } else {
        setValidationSuccess(false);
      }
      setIsValidating(false);
    }, 600);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.acceptedNorms) {
      alert("You must accept the company norms and policies to submit this evaluation.");
      return;
    }
    if (!userId) {
      alert("Authentication error. Please log in again.");
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
        form_data: formData,
        employee_signature: signatureMode === "type" ? formData.employeeSignature : formData.employeeSignatureImage,
        employee_signed_at: new Date(formData.employeeSignatureDate).toISOString()
      });

      if (error) throw error;
      
      router.push("/success?type=evaluation");
    } catch (err: any) {
      console.error("Submission error:", err);
      alert("Failed to submit evaluation: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isPolishing, setIsPolishing] = useState(false);

  const handleAIPolish = async () => {
    if (!formData.keyAchievements) return;
    setIsPolishing(true);
    try {
      const res = await fetch("/api/ai-polish", {
        method: "POST",
        body: JSON.stringify({ text: formData.keyAchievements }),
      });
      const data = await res.json();
      if (data.polishedText) {
        setFormData(prev => ({ ...prev, keyAchievements: data.polishedText }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPolishing(false);
    }
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
                Warning: Employee ID and Name combination not found in HR directory.
              </div>
            )}
            {validationSuccess === true && (
              <div className="mb-6 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                Employee validated successfully. Location auto-filled!
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
              {isValidating && <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">Validating...</div>}
              <div><label className="block text-sm font-medium text-gray-700">Employee Name</label><input required type="text" name="employeeName" value={formData.employeeName} onChange={handleChange} onBlur={validateAndFetch} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border" /></div>
              <div><label className="block text-sm font-medium text-gray-700">Employee ID</label><input required type="text" name="employeeId" value={formData.employeeId} onChange={handleChange} onBlur={validateAndFetch} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border" /></div>
              <div><label className="block text-sm font-medium text-gray-700">Department</label><input required type="text" name="department" value={formData.department} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border" /></div>
              <div><label className="block text-sm font-medium text-gray-700">Designation</label><input required type="text" name="designation" value={formData.designation} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border" /></div>
              <div><label className="block text-sm font-medium text-gray-700">Review Period</label><input required type="text" name="reviewPeriod" value={formData.reviewPeriod} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border" /></div>
              <div><label className="block text-sm font-medium text-gray-700">Date</label><input required type="date" name="date" value={formData.date} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border" /></div>
              <div><label className="block text-sm font-medium text-gray-700">Reporting Manager</label><input required type="text" name="reportingManager" value={formData.reportingManager} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border" /></div>
              <div><label className="block text-sm font-medium text-gray-700">Location <span className="text-xs text-green-600 font-normal ml-1">(Auto-fetched)</span></label><input required type="text" name="location" value={formData.location} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border" /></div>
            </div>
          </section>

          {/* Section 1: KPIs */}
          <section className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-2 border-b pb-3">Section 1. Role / Project Summary</h2>
            <p className="text-sm text-gray-500 mb-6 mt-2">List 2-5 measurable KPIs or objectives. Describe actual performance against it.</p>
            
            {formData.kpis.map((kpi, index) => (
              <div key={kpi.id} className="mb-6 p-5 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-4">KPI / Objective #{kpi.id}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="col-span-1 lg:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">Objective Description</label>
                    <input type="text" value={kpi.kpi} onChange={(e) => handleKpiChange(index, "kpi", e.target.value)} className="mt-2 block w-full rounded-md border-gray-300 shadow-sm p-2.5 border sm:text-sm" placeholder="What was the goal?" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">Target</label>
                    <input type="text" value={kpi.target} onChange={(e) => handleKpiChange(index, "target", e.target.value)} className="mt-2 block w-full rounded-md border-gray-300 shadow-sm p-2.5 border sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">Result Achieved</label>
                    <input type="text" value={kpi.achieved} onChange={(e) => handleKpiChange(index, "achieved", e.target.value)} className="mt-2 block w-full rounded-md border-gray-300 shadow-sm p-2.5 border sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">Status</label>
                    <select value={kpi.status} onChange={(e) => handleKpiChange(index, "status", e.target.value)} className="mt-2 block w-full rounded-md border-gray-300 shadow-sm p-2.5 border bg-white sm:text-sm">
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
                    <input type="text" value={kpi.comments} onChange={(e) => handleKpiChange(index, "comments", e.target.value)} className="mt-2 block w-full rounded-md border-gray-300 shadow-sm p-2.5 border sm:text-sm" placeholder="Link to report, dashboard, explanation of why missed, etc." />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" onClick={addKpi} className="mt-2 inline-flex items-center text-indigo-600 hover:text-indigo-800 text-sm font-medium">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
              Add another KPI
            </button>

            <div className="mt-10 border-t pt-8">
              <label className="block text-base font-semibold text-gray-800 mb-1">Key Achievements & Results</label>
              <p className="text-sm text-gray-500 mb-3">Highlight the 2-4 most significant outcomes. Use bullet points and action verbs (e.g. Led, Reduced, Built).</p>
              <textarea name="keyAchievements" rows={5} value={formData.keyAchievements} onChange={handleChange} placeholder="• Reduced client onboarding time by 40%&#10;• Led the redesign of..." className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 border sm:text-sm disabled:opacity-50" disabled={isPolishing}></textarea>
              <button type="button" onClick={handleAIPolish} disabled={isPolishing || !formData.keyAchievements} className="mt-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-1.5 text-sm rounded-md shadow-sm flex items-center gap-2 hover:opacity-90 transition disabled:opacity-50">
                <span>✨</span> {isPolishing ? "Polishing..." : "AI Polish Text"}
              </button>
            </div>
          </section>

          {/* Section 2: Core Skills */}
          <section className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-2 border-b pb-3">Section 2. Self-Rating — Core Skills</h2>
            <p className="text-sm text-gray-500 mb-6 mt-2">Rating Scale: 1 = Needs Improvement, 2 = Developing, 3 = Meets Expectations, 4 = Exceeds, 5 = Outstanding</p>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/3">Core Skill</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/6">Rating (1-5)</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/2">Detailed Examples of Situations</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {['Ownership & Accountability', 'Teamwork & Collaboration', 'Adaptability to changing roles', 'Prioritization & judgement', 'Communication clarity'].map((skill) => (
                    <tr key={skill} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{skill}</td>
                      <td className="px-6 py-4"><input type="number" min="1" max="5" className="w-20 rounded-md border-gray-300 shadow-sm p-2 border sm:text-sm text-center" /></td>
                      <td className="px-6 py-4"><input type="text" className="w-full rounded-md border-gray-300 shadow-sm p-2 border sm:text-sm" placeholder="Provide a specific scenario..." /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 3: Functional & Cross-Team */}
          <section className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-2 border-b pb-3">Section 3. Functional & Cross-Team Skills</h2>
            
            <div className="mt-6 space-y-8">
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4">3A. Technical Skills</h3>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr><th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Technical Skill</th><th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rating (1-5)</th><th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-1/2">Examples of Situations Where Demonstrated</th></tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {['Technical / Domain Expertise', 'Tools & Systems Proficiency', 'Problem Solving & Troubleshooting', 'Delivery Velocity'].map((skill) => (
                        <tr key={skill}><td className="px-6 py-4 text-sm font-medium">{skill}</td><td className="px-6 py-4"><input type="number" min="1" max="5" className="w-20 border rounded p-2 text-sm text-center" /></td><td className="px-6 py-4"><input type="text" className="w-full border rounded p-2 text-sm" placeholder="Provide specific scenario or evidence..." /></td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4">3B. GTM (Go-To-Market) Skills</h3>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr><th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">GTM Skill</th><th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rating (1-5)</th><th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-1/2">Examples of Situations Where Demonstrated</th></tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {['Market / Customer Understanding', 'Stakeholder & Partner Management', 'Execution of GTM Initiatives', 'Commercial Management'].map((skill) => (
                        <tr key={skill}><td className="px-6 py-4 text-sm font-medium">{skill}</td><td className="px-6 py-4"><input type="number" min="1" max="5" className="w-20 border rounded p-2 text-sm text-center" /></td><td className="px-6 py-4"><input type="text" className="w-full border rounded p-2 text-sm" placeholder="Provide specific scenario or evidence..." /></td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4">3C. Cross-Functional / Other Teams</h3>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr><th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Cross-Functional Skill</th><th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rating (1-5)</th><th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-1/2">Examples of Situations Where Demonstrated</th></tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {['Business / Domain Understanding', 'Process Improvement', 'Collaboration Across Teams', 'Knowledge Sharing', 'Adaptability to Org/Client'].map((skill) => (
                        <tr key={skill}><td className="px-6 py-4 text-sm font-medium">{skill}</td><td className="px-6 py-4"><input type="number" min="1" max="5" className="w-20 border rounded p-2 text-sm text-center" /></td><td className="px-6 py-4"><input type="text" className="w-full border rounded p-2 text-sm" placeholder="Provide specific scenario or evidence..." /></td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Tools & Knowledge */}
          <section className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-3">Section 4. Tools, Domain Knowledge & New Skills</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tools / Systems Used (e.g., Jira, React, Excel, Salesforce)</label>
                <textarea name="toolsUsed" rows={3} value={formData.toolsUsed} onChange={handleChange} className="w-full border rounded p-3 text-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="List tools and proficiency level (new / improved / advanced)..."></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Skills Acquired This Year</label>
                <textarea name="newSkills" rows={3} value={formData.newSkills} onChange={handleChange} className="w-full border rounded p-3 text-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="List new skills acquired and where applied..."></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Skill Applied to Solve a Business Problem (with impact)</label>
                <textarea name="skillApplied" rows={3} value={formData.skillApplied} onChange={handleChange} className="w-full border rounded p-3 text-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="Describe a specific instance where you applied a skill..."></textarea>
              </div>
            </div>
          </section>

          {/* Section 5: Self-Reflection */}
          <section className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-3">Section 5. Self-Reflection</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Feedback Received & Actions Taken</label>
                <textarea name="feedbackReceived" rows={3} value={formData.selfReflection.feedbackReceived} onChange={handleReflectionChange} className="w-full border rounded p-3 text-sm focus:border-indigo-500 focus:ring-indigo-500"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Significant Challenges Encountered (1-3)</label>
                <p className="text-xs text-gray-500 mb-2">Cover technical, process-related, interpersonal, or external challenges and how they were addressed.</p>
                <textarea name="challenges" rows={4} value={formData.selfReflection.challenges} onChange={handleReflectionChange} className="w-full border rounded p-3 text-sm focus:border-indigo-500 focus:ring-indigo-500"></textarea>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Areas for Development</label>
                  <textarea name="areasForDevelopment" rows={3} value={formData.selfReflection.areasForDevelopment} onChange={handleReflectionChange} className="w-full border rounded p-3 text-sm focus:border-indigo-500 focus:ring-indigo-500"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Proposed Focus Areas for the Future</label>
                  <textarea name="focusAreas" rows={3} value={formData.selfReflection.focusAreas} onChange={handleReflectionChange} className="w-full border rounded p-3 text-sm focus:border-indigo-500 focus:ring-indigo-500"></textarea>
                </div>
              </div>
            </div>
          </section>

          {/* Section 6: Employee Declaration & Signatures */}
          <section className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-3">Section 6. Declarations & Signatures</h2>
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
