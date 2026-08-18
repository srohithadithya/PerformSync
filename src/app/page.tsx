import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <h1 className="text-4xl font-extrabold text-blue-900 mb-4">PerformSync</h1>
        <p className="text-lg text-gray-600 mb-8">
          The all-in-one platform for Employee Self-Evaluations and HR Analytics.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 hover:shadow-md transition">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">For Employees</h2>
            <p className="text-gray-500 mb-4">Complete your self-evaluation easily with our AI-assisted web form.</p>
            <Link 
              href="/evaluation" 
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 transition"
            >
              Start Self-Evaluation
            </Link>
          </div>

          <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 hover:shadow-md transition">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">For HR & Managers</h2>
            <p className="text-gray-500 mb-4">Review submissions, add feedback, and generate the final PDF reports.</p>
            <Link 
              href="/dashboard"
              className="inline-block bg-gray-800 text-white px-6 py-2 rounded-md font-medium hover:bg-gray-900 transition"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
