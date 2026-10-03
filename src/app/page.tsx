import Link from "next/link";
import { ArrowRight, UserCheck, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-white px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
            Performance reviews, <span className="text-blue-600">simplified</span>.
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Streamline your evaluation process with our minimal, AI-assisted platform designed for modern teams.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
          <Link
            href="/evaluation"
            className="group relative flex flex-col items-center justify-center p-6 border-2 border-gray-100 rounded-2xl hover:border-blue-600 transition-colors bg-white hover:shadow-sm"
          >
            <div className="p-3 bg-blue-50 text-blue-600 rounded-full mb-4 group-hover:scale-110 transition-transform">
              <UserCheck className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Employee Portal</h2>
            <p className="text-sm text-gray-500 mt-2 text-center">Start your self-evaluation</p>
            <ArrowRight className="w-4 h-4 text-gray-300 absolute bottom-4 right-4 group-hover:text-blue-600 transition-colors" />
          </Link>

          <Link
            href="/dashboard"
            className="group relative flex flex-col items-center justify-center p-6 border-2 border-gray-100 rounded-2xl hover:border-gray-900 transition-colors bg-white hover:shadow-sm"
          >
            <div className="p-3 bg-gray-50 text-gray-700 rounded-full mb-4 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Manager Dashboard</h2>
            <p className="text-sm text-gray-500 mt-2 text-center">Review and manage team</p>
            <ArrowRight className="w-4 h-4 text-gray-300 absolute bottom-4 right-4 group-hover:text-gray-900 transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}
