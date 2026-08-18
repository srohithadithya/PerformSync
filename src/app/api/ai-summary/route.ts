import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { checkRateLimit } from '@/utils/rate-limit';

// Prevent arbitrary large objects from crashing the LLM prompt.
const SummaryRequestSchema = z.record(z.string(), z.any());

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
    const isAllowed = checkRateLimit(`ai-summary:${user.id}`, 10, 60 * 1000);
    if (!isAllowed) {
      return NextResponse.json({ error: 'Too Many Requests. Please slow down.' }, { status: 429 });
    }

    // 3. Input Validation
    const body = await request.json();
    const validationResult = SummaryRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid Input format.' }, { status: 400 });
    }

    const data = validationResult.data;
    // Strict stringification with length cap
    const dataString = JSON.stringify(data).substring(0, 5000);

    if (!process.env.NVIDIA_API_KEY) {
      const fallbackSummary = `Mock AI Summary for ${user.email}. Please add NVIDIA API Key. Data: ${data.name || 'Unknown'}`;
      return NextResponse.json({ summary: fallbackSummary });
    }

    const openai = new OpenAI({
      apiKey: process.env.NVIDIA_API_KEY,
      baseURL: 'https://integrate.api.nvidia.com/v1',
    });

    const prompt = `You are an HR Assistant. Please provide a concise, 3-sentence summary of the following employee self-evaluation data highlighting their top achievements and areas for improvement: ${dataString}`;

    const completion = await openai.chat.completions.create({
      model: "meta/llama-3.1-8b-instruct",
      messages: [{"role":"user","content":prompt}],
      temperature: 0.2,
      max_tokens: 1024,
    });

    const summary = completion.choices[0]?.message?.content || "No summary generated.";

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("AI Error:", error);
    return NextResponse.json({ error: 'Failed to generate AI summary' }, { status: 500 });
  }
}
