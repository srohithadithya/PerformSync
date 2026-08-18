<div align="center">
  <img src="https://img.shields.io/badge/Next.js-14+-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Supabase-Backend-47A248?style=for-the-badge&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/NVIDIA_NIM-AI_Llama_3.1-76B900?style=for-the-badge&logo=nvidia" alt="NVIDIA NIM" />
  <img src="https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
</div>

<br />

# Smart AI PDF Filler & HR Dashboard

A full-stack, enterprise-grade Employee Self-Evaluation and Performance Management system. This application digitizes traditional PDF-based performance reviews into a dynamic web interface, powered by automated AI summaries (NVIDIA NIM) and programmatic PDF generation (`pdf-lib`).

> [!NOTE]  
> This project was built to exact specifications to replace static HR evaluation forms. It provides role-based access control, allowing employees to submit self-assessments and managers to append ratings and generate official PDF records.

---

## 🏗️ Architecture & Stack

- **Frontend:** Next.js (App Router), React, Tailwind CSS
- **Backend/Auth:** Supabase (PostgreSQL, Row Level Security, `@supabase/ssr` Middleware)
- **AI Integration:** NVIDIA NIM API (Llama 3.1 8B Instruct) via OpenAI SDK
- **Document Generation:** `pdf-lib` for programmatic PDF buffer generation

---

## ✨ Core Features

### 1. Dynamic Employee Self-Assessment (`/evaluation`)
A fully digitized, multi-step form covering all mandatory performance domains:
- **Section 1:** Role / Project Summary & KPIs
- **Section 2:** Core Skills Rating (Ownership, Communication, Teamwork, Adaptability, Prioritization)
- **Section 3:** Functional & Cross-Team Skills (Technical, GTM, Cross-functional)
- **Section 4:** Tools, Domain Knowledge & New Skills
- **Section 5:** Self-Reflection & Feedback (Challenges, Support, Areas for Interest)

### 2. HR & Manager Portal (`/dashboard`)
A centralized command center secured via Next.js Middleware.
- **Role-Based Access:** Protected routes enforce authentication via Supabase.
- **Analytics Overview:** High-level metrics on total employees, pending reviews, and average performance.
- **Submission Grid:** Real-time, dynamically filtered data table tracking draft, pending, and completed evaluations by department.

### 3. Manager Review & AI Assistance (`/review`)
Fulfills **Section 6 (Manager Feedback and Ratings)**.
- **✨ AI Summarization:** One-click AI integration utilizing NVIDIA NIM (Llama 3.1). Automatically digests the employee's extensive self-assessment and generates a concise, 3-sentence executive summary highlighting top achievements and development areas.
- **✨ AI Polish:** AI-powered "Polish" features built into the employee form to enhance tone and professionalism before submission.
- **Official Ratings:** Interfaces for managers to append official Core Skill ratings, overall performance scores (1-5), and development recommendations.

### 4. Digital Signatures & Authorizations (Sections 7 & 8)
- **Zero-Dependency Drawing Pad:** Both the Employee and Manager forms feature an embedded HTML5 `<SignaturePad />` component.
- **Type or Draw Toggle:** Users can seamlessly toggle between typing their name or utilizing a physical trackpad/touchscreen signature drawing canvas (rendered in a deep navy-blue fountain pen aesthetic).
- **Compliance Checkboxes:** Enforces mandatory "Accepted company norms and policies" checkboxes before submission is allowed.

### 5. Automated Document Generation (`/api/generate-pdf`)
- Bypasses manual data entry. Once a manager finalizes a review, the application utilizes `pdf-lib` to map the JSON payload to exact coordinates.
- **Multi-Page Layout Engine:** Automatically handles text-wrapping and dynamically splits content across multiple pages to ensure no text cutoff.
- **Image Embedding:** Extracts the base64 PNG data from the `SignaturePad` and natively embeds the drawn signatures directly onto the finalized PDF document.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Supabase Project (Free Tier)
- An NVIDIA NIM API Key (Free)

### Installation

1. **Clone and Install Dependencies:**
   ```bash
   git clone <repository-url>
   cd pdf-filler
   npm install
   ```

2. **Database Provisioning:**
   Navigate to your Supabase SQL Editor and execute the schema provided in `supabase/schema.sql` to initialize the `users` and `evaluations` tables alongside their RLS policies.

3. **Environment Configuration:**
   Create a `.env.local` file at the root of the project:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>

   # NVIDIA NIM Configuration (OpenAI SDK compatible)
   NVIDIA_API_KEY=<your-nvidia-api-key>
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Navigate to `http://localhost:3000`.

---

## 🔒 Security & Middleware

This project employs **Zero-Trust architecture** principles for route protection. 
The `src/proxy.ts` (Next.js Middleware) intercepts all traffic to `/dashboard`, `/evaluation`, and `/review`. If a valid Supabase session cookie is not detected, the request is instantly redirected to the `/login` gateway. 

*Note: During local UI development, a mock bypass can be temporarily enabled in `login/page.tsx` if environment variables are omitted.*

---

## ✅ Audit Requirements Met

This application has been strictly audited against the original business requirements and PDF mapping:
- [x] Must be a web-based responsive sheet replacing the static PDF.
- [x] Must handle multiple users/employees with access control and a unified HR dashboard.
- [x] Must contain Sections 1 through 5 for employees.
- [x] Must contain Section 6 for Manager/HR overrides.
- [x] Must contain Section 7/8 for Legal Declarations and dual Signatures (Trackpad/Draw enabled).
- [x] Must utilize an AI engine (NVIDIA NIM) to polish/summarize text.
- [x] Must be entirely built on Free & Open Source infrastructure (Supabase, Next.js).
- [x] Final responses must map back to a downloadable multi-page PDF containing the embedded signatures.

---
*Maintained by the HR Tech Engineering Team.*
