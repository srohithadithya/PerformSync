"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const ALLOWED_DOMAIN = "@mondee.com"; // <-- UPDATE THIS LINE

function LoginFormComponent() {
  const [identifier, setIdentifier] = useState(""); 
  const [employeeId, setEmployeeId] = useState(""); 
  const [mpin, setMpin] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const supabase = createClient();
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        if (!identifier.endsWith(ALLOWED_DOMAIN)) {
          throw new Error(`Only ${ALLOWED_DOMAIN} emails are allowed to register.`);
        }
        if (mpin.length < 6) {
          throw new Error("MPIN must be at least 6 characters.");
        }
        if (!employeeId) {
          throw new Error("Employee ID is required for registration.");
        }

        const { error } = await supabase.auth.signUp({
          email: identifier,
          password: mpin,
          options: {
            data: { employee_id: employeeId } // Save Emp ID to user metadata
          }
        });
        if (error) throw error;
        setMessage({ type: 'success', text: "Account created! You can now log in using your Employee ID and MPIN." });
        setIsSignUp(false); 
        
      } else {
        let loginEmail = identifier.trim();
        const cleanMpin = mpin.trim();
        
        // If they type an Employee ID instead of an email
        if (!loginEmail.includes('@')) {
          const { data: resolvedEmail, error: rpcError } = await supabase.rpc('get_email_by_emp_id', { 
            p_employee_id: loginEmail 
          });
          
          if (rpcError || !resolvedEmail) {
            throw new Error("Invalid Employee ID or MPIN.");
          }
          loginEmail = resolvedEmail;
        }

        const { error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: cleanMpin,
        });
        
        if (error) throw error;
        router.push('/auth/role-check');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || "An error occurred." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-100">
        <div className="text-center">
          <h2 className="mt-2 text-3xl font-extrabold text-gray-900 tracking-tight">PerformSync</h2>
          <p className="mt-2 text-sm text-gray-500">
            {isSignUp ? "Register your Employee ID" : "Secure Employee Portal"}
          </p>
        </div>
        
        {message && (
          <div className={`p-4 rounded-md text-sm ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message.text}
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleAuth}>
          {isSignUp ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organization Email</label>
                <input
                  type="email"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder={`you${ALLOWED_DOMAIN}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                <input
                  type="text"
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g., EMP1234"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID or Org Email</label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="EMP1234 or email"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Secure MPIN (Min 6 digits)</label>
            <input
              type="password"
              required
              minLength={6}
              value={mpin}
              onChange={(e) => setMpin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Processing..." : (isSignUp ? "Setup MPIN" : "Log In")}
          </button>
        </form>

        <div className="text-center mt-4">
          <button 
            type="button" 
            onClick={() => { 
              setIsSignUp(!isSignUp); 
              setMessage(null); 
              setIdentifier(""); 
              setMpin(""); 
              setEmployeeId("");
            }}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            {isSignUp ? "Already set up? Log in here" : "First time? Set up your MPIN"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginFormComponent />
    </Suspense>
  )
}