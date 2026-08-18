import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    if (!process.env.NVIDIA_API_KEY) {
      // Fallback if key isn't provided yet
      const fallbackSummary = `Mock AI Summary: Ensure your NVIDIA_API_KEY is placed in .env.local! Data received: ${data.name} from ${data.department}.`;
      return NextResponse.json({ summary: fallbackSummary });
    }

    const openai = new OpenAI({
      apiKey: process.env.NVIDIA_API_KEY,
      baseURL: 'https://integrate.api.nvidia.com/v1',
    });

    const prompt = `You are an HR Assistant. Please provide a concise, 3-sentence summary of the following employee self-evaluation data highlighting their top achievements and areas for improvement: ${JSON.stringify(data)}`;

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
