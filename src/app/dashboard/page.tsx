"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

import { useRouter } from "next/navigation";

export default function HRDashboard() {
  const router = useRouter();
  const [employees, setEmployees] = useState([
    { id: 1, name: "Bob Jones", department: "Marketing", designation: "Content Lead", status: "Completed", date: "2026-08-15", data: null },
    { id: 2, name: "Charlie Brown", department: "Sales", designation: "AE", status: "Draft", date: "-", data: null },
  ]);

  const [managerDept, setManagerDept] = useState("All");
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Load current user for RBAC
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.id === "employee") {
        router.push("/evaluation");
        return;
      }
      setCurrentUser(user);
      setManagerDept(user.department);
    } else {
      router.push("/login");
      return;
    }

    // Dynamically load any evaluations submitted by the employee from localStorage
    const pending = localStorage.getItem("pending_evaluation");
    const completed = localStorage.getItem("completed_evaluation");
    
    let dynamicList = [...employees];
    
    if (completed) {
      const parsed = JSON.parse(completed);
      dynamicList.unshift({
        id: 999,
        name: parsed.employeeName,
        department: parsed.department,
        designation: parsed.designation,
        status: "Completed",
        date: new Date().toISOString().split('T')[0],
        data: parsed
      });
    } else if (pending) {
      const parsed = JSON.parse(pending);
      dynamicList.unshift({
        id: 998,
        name: parsed.employeeName,
        department: parsed.department,
        designation: parsed.designation,
        status: "Pending Manager Review",
        date: new Date().toISOString().split('T')[0],
        data: parsed
      });
    }
    
    setEmployees(dynamicList);
  }, []);

  const handleGeneratePDF = async (emp: Record<string, unknown>) => {
    if (!emp.data) {
      alert("This is a mock completed record. Submit a real evaluation to generate its PDF.");
      return;
    }
    try {
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emp.data),
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${emp.name.replace(/\s+/g, '_')}_Evaluation.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to generate PDF");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {currentUser?.department === "All" ? "HR & Manager Portal" : `${currentUser?.department || "Department"} Overview`}
            </h1>
            <p className="text-gray-500 mt-1">
              {currentUser ? `Welcome back, ${currentUser.name} - ${currentUser.title}` : "Review employee self-assessments and manage final evaluations."}
            </p>
          </div>
          <div className="flex gap-3">
            <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-50 shadow-sm flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              Export All CSV
            </button>
            <Link href="/" className="bg-gray-800 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-900 shadow-sm">
              Back Home
            </Link>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Total Employees</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">124</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Completed Reviews</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">42</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Pending Manager</h3>
            <p className="text-3xl font-bold text-orange-600 mt-2">15</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Avg Performance</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">4.2 / 5</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Recent Submissions</h2>
            <div className="flex gap-4">
              {currentUser?.department === "All" && (
                <select value={managerDept} onChange={(e) => setManagerDept(e.target.value)} className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white">
                  <option value="All">All Departments (HR View)</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                  <option value="Product">Product</option>
                </select>
              )}
              {currentUser?.department !== "All" && (
                <div className="px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-medium border border-indigo-100 rounded-md flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  Locked to {currentUser?.department}
                </div>
              )}
              <input type="text" placeholder="Search employees..." className="block w-64 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees.filter(emp => managerDept === "All" || emp.department === managerDept).map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{emp.name}</div>
                      <div className="text-sm text-gray-500">{emp.designation}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${emp.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                          emp.status === 'Pending Manager Review' ? 'bg-orange-100 text-orange-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {emp.status === 'Pending Manager Review' ? (
                        <Link href="/review" className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded-md">Review & Rate</Link>
                      ) : emp.status === 'Completed' ? (
                        <button onClick={() => handleGeneratePDF(emp)} className="text-gray-600 hover:text-gray-900 bg-gray-100 px-3 py-1 rounded-md flex items-center justify-end ml-auto">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                          Generate PDF
                        </button>
                      ) : (
                        <span className="text-gray-400">Not Submitted</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
