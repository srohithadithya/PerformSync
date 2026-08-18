"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function RoleCheckPage() {
  const router = useRouter();
  const supabase = createClient();
  const [status, setStatus] = useState("Verifying secure connection...");

  useEffect(() => {
    const checkUserAndAssignRole = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user || !user.email) {
          router.push("/login");
          return;
        }

        setStatus("Assigning roles based on identity...");

        const email = user.email.toLowerCase();
        
        // Mock DB Role Assignment based on email address
        // In a real enterprise app, you would fetch this from a 'profiles' table.
        let assignedRole;

        if (email.includes("hr") || email.includes("admin")) {
          assignedRole = { id: "chro", name: "HR Admin", title: "Chief HR Officer", department: "All" };
        } else if (email.includes("manager") || email.includes("lead")) {
          assignedRole = { id: "eng_mgr", name: "Engineering Manager", title: "Manager", department: "Engineering" };
        } else {
          // Default to Employee
          assignedRole = { id: "employee", name: "Staff Employee", title: "Employee", department: "Engineering" };
        }

        // Set the mock legacy currentUser for the dashboard UI
        localStorage.setItem("currentUser", JSON.stringify(assignedRole));

        // RBAC Routing
        if (assignedRole.id === "employee") {
          router.push("/evaluation"); // Employees go directly to fill out the form
        } else {
          router.push("/dashboard"); // Managers/HR go directly to the Dashboard
        }

      } catch (err) {
        console.error("Auth routing error:", err);
        router.push("/login");
      }
    };

    checkUserAndAssignRole();
  }, [router, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">{status}</p>
      </div>
    </div>
  );
}
