<div align="center">
  <div style="background-color: #4F46E5; display: inline-block; padding: 12px; border-radius: 12px; margin-bottom: 16px;">
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
    </svg>
  </div>
  <h1>PerformSync: AI-Powered Performance Evaluation Platform</h1>
  <p>An enterprise-grade, full-stack application for streamlined employee self-evaluations and dynamic HR management workflows.</p>
</div>

<br />

PerformSync modernizes the traditional evaluation process by migrating PDF-heavy workflows into a responsive web application. It integrates programmatic PDF generation, AI-driven performance summaries, and passwordless authentication into a robust Next.js environment.

---

## 🚀 Technical Highlights

### 🔐 Architecture & Security
- **Authentication**: Utilizes **Supabase Auth** for secure passwordless magic link logins.
- **RBAC (Role-Based Access Control)**: Enforces access restrictions at both the client and server levels. Employees are restricted to self-evaluations, managers view department data, and HR has global overview access.

### 📝 Core Modules & Features
- **Dynamic Form Engine**: Configuration-driven forms powered by `src/config/evaluation-template.ts`. Easily extensible without core code modifications.
- **AI Integration**: Implements **NVIDIA NIM (Meta Llama 3)** to refine user feedback and automatically generate concise performance summaries.
- **Digital Signatures**: Custom HTML5 Canvas implementation (`SignaturePad.tsx`) for capturing and securely storing digital signatures as base64 data.

### 📄 Document Generation
- **Automated PDF Export**: Uses `pdf-lib` to dynamically assemble finalized evaluations. Supports auto-pagination, grid alignments, and signature embedding for accurate HR archiving.

---

## 🛠️ Stack & Dependencies

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 | React framework using the modern App Router |
| **Language** | TypeScript | Statically typed JavaScript for robust codebases |
| **Styling** | Tailwind CSS v4 | Utility-first CSS framework for minimal, clean UI |
| **Database/Auth** | Supabase | Postgres database with integrated SSR Auth |
| **AI Model** | NVIDIA NIM | OpenAI SDK compatible integration (Llama 3 8B) |
| **PDF Processing**| pdf-lib | Programmatic PDF creation and modification |

---

## 🏗️ Project Structure

```bash
PerformSync-main/
├── __tests__/           # Unit and Integration test suites (Jest)
├── public/              # Static assets and icons
├── src/
│   ├── app/             # Next.js App Router (Pages, API Routes, Layouts)
│   ├── components/      # Reusable UI components (Header, SignaturePad, etc.)
│   ├── config/          # Centralized configuration (e.g., evaluation-template.ts)
│   ├── lib/             # Core utilities and instances (e.g., supabase client)
│   └── utils/           # Helper functions (e.g., rate-limiting)
└── supabase/            # Database schemas and Row Level Security (RLS) SQL
```

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- Node.js (v18 or higher)
- npm or yarn package manager
- Supabase Project & NVIDIA API Key

### 2. Environment Configuration
Create a `.env.local` file at the root of the project with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# NVIDIA NIM Configuration (For AI Polish)
NVIDIA_API_KEY=your_nvidia_api_key
```

### 3. Build & Run
Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Navigate to `http://localhost:3000` to access the application.

---

## 🧪 Testing

The project maintains high reliability through standard testing libraries:
- **Unit Testing**: Run `npm run test` (uses Jest and `@testing-library/react`)
- **E2E Validation**: Configured for Playwright browser automation tests.

---

## 📖 Operational Workflows

1. **Employee Initialization**: Authenticate via Magic Link $\rightarrow$ Redirect to `/evaluation` $\rightarrow$ Complete dynamic self-reflection $\rightarrow$ Sign & Submit.
2. **Manager Review**: Authenticate $\rightarrow$ Redirect to `/dashboard` (filtered by department) $\rightarrow$ Provide feedback & calibrate scores $\rightarrow$ Sign & Approve.
3. **Archival**: System triggers `/api/generate-pdf` $\rightarrow$ Returns flattened, compliant PDF document with embedded signatures and scores.

---
*Developed for high-efficiency, scalable performance management workflows.*
