<div align="center">
  <div style="background-color: #4F46E5; display: inline-block; padding: 12px; border-radius: 12px; margin-bottom: 16px;">
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
    </svg>
  </div>
  <h1>PerformSync: AI Evaluation Platform</h1>
  <p>A full-stack, enterprise-grade Employee Self-Evaluation and Performance Management system.</p>
</div>

<br />

PerformSync digitizes traditional PDF-based performance reviews into a dynamic web interface, powered by automated AI summaries, programmatic PDF generation, and secure passwordless authentication.

## 🚀 Key Features

### 🔐 Enterprise Security & Authentication
- **Passwordless Magic Links:** Employees authenticate securely using Supabase One-Time Passwords (OTP) sent directly to their organizational email, eliminating password fatigue.
- **Role-Based Access Control (RBAC):** Strict client-side route guards ensure Employees can only access their evaluation forms, while Managers are locked exclusively to viewing their own department's data. HR/Admins get unfiltered master access.

### 📝 AI-Powered Evaluations
- **NVIDIA NIM Integration:** Utilizes Meta Llama 3 8B Instruct via NVIDIA NIM to automatically polish employee feedback and summarize long-form text.
- **Dynamic KPI Tracking:** Employees can add, edit, and track multiple Key Performance Indicators natively in the UI.

### 🖋️ Digital Signatures & PDF Generation
- **Signature Pad:** Built-in canvas for employees to draw or type their digital signature.
- **Programmatic PDF Assembly:** Uses `pdf-lib` to dynamically assemble a fully completed, professionally formatted PDF document containing the employee's data, manager's review, and drawn signatures.

## 🛠️ Technology Stack

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide Icons.
- **Backend/API:** Next.js Serverless Routes (`/api/generate-pdf`, `/api/ai-polish`, `/auth/callback`).
- **Authentication:** Supabase Auth (`@supabase/ssr`).
- **AI/LLM:** NVIDIA NIM (OpenAI SDK Compatible).
- **PDF Generation:** `pdf-lib`.

## 🏗️ Project Structure

```text
/src                # Next.js App Router, Components, and API Routes
/__tests__          # Jest Unit & Integration Tests
/supabase           # PostgreSQL Database Schema & RLS Policies
/public             # Static Assets
```

## 🧪 Testing

PerformSync is configured with enterprise testing frameworks:
- **Unit Testing:** Powered by `jest` and `@testing-library/react`. Run tests using `npm run test` (or `npx jest`).
- **E2E Testing:** Configured for `@playwright/test` for automated browser interactions.

## ⚙️ Getting Started

### 1. Environment Configuration

Create a `.env.local` file in the root directory and add your keys:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# NVIDIA NIM Configuration (For AI Polish)
NVIDIA_API_KEY=your_nvidia_api_key
```

### 2. Installation

Install the required dependencies:

```bash
npm install
```

### 3. Running the Development Server

Start the Next.js local development server:

```bash
npm run dev
```

Navigate to [http://localhost:3000](http://localhost:3000) to view the application.

## 📖 User Workflows

1. **Employee Flow:** The employee signs in with their email, clicks the Magic Link, and is routed to `/evaluation`. They fill out their self-reflection, draw their signature, and submit the review.
2. **Manager Flow:** A manager signs in with their email (e.g. `manager@company.com`). The RBAC system routes them to `/dashboard` and locks their view to their specific department. They click "Review & Rate" to add their managerial feedback and signature.
3. **Completion & Export:** Once the manager submits their review, the system generates a final, flattened PDF containing both signatures and all evaluation data for HR archiving.

---
*Built with modern web standards to ensure a fast, secure, and professional HR experience.*
