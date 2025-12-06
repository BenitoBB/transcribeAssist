// src/app/api/summarize/route.ts
import { NextResponse } from 'next/server';
import { summarize } from '../../../lib/summarization/textrank';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = typeof body === 'object' && body !== null ? (body.text ?? '') : '';
    const maxSentences = typeof body === 'object' && body !== null ? body.maxSentences : undefined;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: 'Texto vacío' }, { status: 400 });
    }

    const summary = summarize(text, typeof maxSentences === 'number' ? maxSentences : undefined);

    return NextResponse.json({ summary });
  } catch (err) {
    console.error('API /api/summarize error:', err);
    return NextResponse.json({ error: 'Error generando resumen' }, { status: 500 });
  }
}