import Link from "next/link";

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center border-t-4 border-green-500">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Successfully Submitted!</h1>
        <p className="text-gray-600 mb-8">
          Your self-assessment has been sent to your reporting manager for review. You will be notified once they provide their feedback and finalize the evaluation.
        </p>
        <div className="space-y-3">
          <Link href="/dashboard" className="block w-full bg-indigo-600 text-white px-4 py-2 rounded-md font-medium hover:bg-indigo-700 transition">
            Go to HR/Manager Dashboard
          </Link>
          <Link href="/" className="block w-full bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-md font-medium hover:bg-gray-50 transition">
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
