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
        
        if (error) {
          router.push(`/login?error=${encodeURIComponent(`Role Check Error: ${error.message}`)}`);
          return;
        }
        if (!user || !user.email) {
          router.push(`/login?error=${encodeURIComponent("Role Check Error: No active session found. Please try logging in again.")}`);
          return;
        }

        setStatus("Assigning roles based on identity...");

        const email = user.email.toLowerCase();
        
        // 1. Check if profile exists
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        let assignedRole = profile;

        // 2. If no profile, auto-create one
        if (!profile || profileError) {
          // Auto-assign roles for demo based on email. Real apps would pre-provision this.
          let role_id = 'employee';
          let role_name = 'Staff Employee';
          let department = 'Engineering';

          if (email.includes("hr") || email.includes("admin")) {
            role_id = 'chro';
            role_name = 'HR Admin';
            department = 'All';
          } else if (email.includes("manager") || email.includes("lead")) {
            role_id = 'eng_mgr';
            role_name = 'Engineering Manager';
          }

          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: email,
              role_id,
              role_name,
              department
            })
            .select()
            .single();

          if (insertError) {
            throw new Error(`Failed to create profile: ${insertError.message}`);
          }
          assignedRole = newProfile;
        }

        // Set the current user profile into local storage for quick UI reference (not for security)
        localStorage.setItem("currentUser", JSON.stringify({
          id: assignedRole.role_id,
          name: assignedRole.role_name,
          title: assignedRole.role_name,
          department: assignedRole.department
        }));

        // RBAC Routing
        if (assignedRole.role_id === "employee") {
          router.push("/evaluation"); // Employees go directly to fill out the form
        } else {
          router.push("/dashboard"); // Managers/HR go directly to the Dashboard
        }

      } catch (err: any) {
        console.error("Auth routing error:", err);
        router.push(`/login?error=${encodeURIComponent(`Unexpected Auth Error: ${err?.message || "Unknown error"}`)}`);
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
