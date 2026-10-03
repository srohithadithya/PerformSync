<div align="center">
  <div style="background-color: #4F46E5; display: inline-block; padding: 12px; border-radius: 12px; margin-bottom: 16px;">
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
    </svg>
  </div>
  
  <h1>PerformSync: AI-Powered Performance Evaluation Platform</h1>
  
  <p>An enterprise-grade, full-stack application for streamlined employee self-evaluations and dynamic HR management workflows.</p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-16.3.1-black?style=for-the-badge&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Supabase-Auth_%26_DB-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/NVIDIA-NIM_AI-76B900?style=for-the-badge&logo=nvidia" alt="NVIDIA AI" />
  </p>

  **Tags:** `HR Tech` • `Performance Reviews` • `Next.js App Router` • `AI Text Polishing` • `Automated PDF Generation` • `Serverless` • `Supabase Auth` • `Zero Trust RBAC`
</div>

<br />

PerformSync modernizes the traditional evaluation process by migrating PDF-heavy workflows into a responsive web application. It integrates programmatic PDF generation, AI-driven performance summaries, and passwordless authentication into a robust Next.js environment.

---

## 🚀 Technical Highlights

### 🔐 Architecture & Security
- **Authentication (`@supabase/ssr`)**: Utilizes **Supabase Auth** for secure passwordless magic link logins.
- **Role-Based Access Control (RBAC)**: Enforces access restrictions at both the client layout layer and the API layer. Employees are strictly routed to self-evaluations, managers view department-only data, and HR has global overview access.
- **Rate Limiting**: Custom token-bucket rate limiting logic applied to serverless functions (`/api/*`) to prevent abuse and brute-forcing.

### 📝 Core Modules & AI Capabilities
- **Dynamic Form Engine**: Configuration-driven forms powered by `src/config/evaluation-template.ts`. Easily extensible and deeply typed without core component modifications.
- **NVIDIA NIM Integration (Llama 3)**: Uses Meta's Llama 3 8B Instruct model to provide AI assistance:
  - **AI Polish**: Refines employee self-assessments to sound professional and concise.
  - **AI Summary**: Generates overarching summaries for HR based on raw evaluation data.
- **Digital Signatures**: Custom HTML5 Canvas implementation (`SignaturePad.tsx`) capturing secure `base64` strokes.

### 📄 Programmatic Document Generation
- **Automated PDF Export (`pdf-lib`)**: A complex API route (`/api/generate-pdf`) that dynamically reads the evaluation state, calibrates coordinate mapping, embeds signatures, and returns a finalized, paginated PDF document formatted for HR archival.

---

## 🛠️ Stack & Dependencies

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16 (App Router)](https://nextjs.org) | Modern React framework with Server Components & Serverless API. |
| **Language** | [TypeScript](https://www.typescriptlang.org) | Strict static typing for schemas and business logic. |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com) | Utility-first, zero-runtime CSS framework for minimal UI. |
| **Database & Auth** | [Supabase](https://supabase.com) | PostgreSQL database coupled with secure OTP authentication. |
| **AI LLM** | [NVIDIA NIM](https://build.nvidia.com) | AI Inference via OpenAI SDK compatibility layer. |
| **PDF Processing**| [pdf-lib](https://pdf-lib.js.org) | Pure TypeScript programmatic PDF modification. |
| **Testing** | [Jest & React Testing Lib](https://jestjs.io) | Unit and integration test suites. |

---

## 🏗️ Project Directory Structure

```bash
PerformSync-main/
├── __tests__/           # Jest Unit & Component Integration tests
├── public/              # Static SVG assets and icons
├── src/
│   ├── app/             # App Router: Pages, API Routes, Global CSS
│   ├── components/      # Shared React Components (Header, UI cards, SignaturePad)
│   ├── config/          # Centralized configuration (evaluation-template.ts)
│   ├── lib/             # Core utilities and singletons (e.g., supabase client)
│   └── utils/           # Helper functions (rate-limiting algorithms, auth utils)
└── supabase/            # Database schema definitions and RLS policies (.sql)
```

---

## ⚙️ Installation & Local Setup

### 1. Prerequisites
- Node.js (v18 or higher)
- `npm`, `yarn`, or `pnpm`
- A Supabase Project (Database + Auth enabled)
- NVIDIA NIM API Key (for AI capabilities)

### 2. Environment Configuration
Create a `.env.local` file at the root of the project with your secure credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# NVIDIA NIM Configuration (For AI Polish)
NVIDIA_API_KEY=your_nvidia_api_key
```

### 3. Build & Run
Install all dependencies and start the local Turbopack development server:

```bash
npm install
npm run dev
```

Navigate to [http://localhost:3000](http://localhost:3000) to access the platform.

---

## 📖 End-to-End Operational Workflows

The lifecycle of an evaluation inside PerformSync follows three strict states:

1. **Employee Initialization (Draft State)**: 
   - Employees authenticate securely via Magic Link $\rightarrow$ redirected to `/evaluation`.
   - The UI mounts the dynamic form based on the template config.
   - The employee utilizes AI Polish to refine feedback, signs the canvas, and submits.
2. **Manager Calibration (Review State)**:
   - Manager authenticates $\rightarrow$ redirected to `/dashboard`.
   - The dashboard filters evaluations dynamically based on the manager's assigned department.
   - The manager reviews the employee's self-assessment, adjusts numeric scales side-by-side, provides official feedback, and signs.
3. **HR Archival (Finalized State)**: 
   - Upon final manager submission, the system triggers the `/api/generate-pdf` route.
   - The backend maps all states, scales, and signatures onto the PDF coordinate grid.
   - The application returns a completely flattened, read-only PDF file ready for HR compliance storage.

---
*Developed for robust, high-efficiency, and scalable performance management.*
