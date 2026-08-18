import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { checkRateLimit } from '@/utils/rate-limit';

// Strict Input Validation Schema (Max 2000 chars to prevent token abuse)
const PolishRequestSchema = z.object({
  text: z.string().min(1, "Text is required").max(2000, "Text exceeds maximum allowed length of 2000 characters"),
});

export async function POST(request: Request) {
  try {
    // 1. Authentication Check (Zero Trust)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Secure session required.' }, { status: 401 });
    }

    // 2. Rate Limiting (Abuse Protection)
    // Limit: 10 requests per minute per authenticated user
    const isAllowed = checkRateLimit(`ai-polish:${user.id}`, 10, 60 * 1000);
    if (!isAllowed) {
      return NextResponse.json({ error: 'Too Many Requests. Please slow down.' }, { status: 429 });
    }

    // 3. Input Validation & Sanitization (Zod)
    const body = await request.json();
    const validationResult = PolishRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid Input', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { text } = validationResult.data;

    if (!process.env.NVIDIA_API_KEY) {
      return NextResponse.json({ polishedText: `[Mock Polished for ${user.email}]: ${text}` });
    }

    const openai = new OpenAI({
      apiKey: process.env.NVIDIA_API_KEY,
      baseURL: 'https://integrate.api.nvidia.com/v1',
    });

    const prompt = `You are an expert HR professional and resume writer. Rewrite the following employee achievements to sound highly professional, impactful, and concise. Use strong action verbs. Do not change the underlying meaning. Only return the rewritten text, nothing else.\n\nOriginal Text:\n${text}`;

    const completion = await openai.chat.completions.create({
      model: "meta/llama-3.1-8b-instruct",
      messages: [{"role":"user","content":prompt}],
      temperature: 0.2,
      max_tokens: 500,
    });

    const polishedText = completion.choices[0]?.message?.content || text;

    return NextResponse.json({ polishedText });
  } catch (error) {
    console.error("AI Polish Error:", error);
    return NextResponse.json({ error: 'An unexpected server error occurred.' }, { status: 500 });
  }
}
