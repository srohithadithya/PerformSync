import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    if (!process.env.NVIDIA_API_KEY) {
      return NextResponse.json({ polishedText: `[Mock Polished]: ${text}` });
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
    return NextResponse.json({ error: 'Failed to polish text' }, { status: 500 });
  }
}
