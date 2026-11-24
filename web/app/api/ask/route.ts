import { NextResponse } from "next/server";

// Grounded Q&A over the label excerpts the page already shows. Enabled only
// when GROQ_API_KEY is configured on the server. The model may answer ONLY
// from the supplied excerpts and must refuse otherwise.

export const dynamic = "force-dynamic";

const MODEL = process.env.GROQ_MODEL ?? process.env.NEXT_PUBLIC_GROQ_MODEL ?? "openai/gpt-oss-120b";

const SYSTEM = `You explain medicine labels to patients in India in plain, simple English.
Rules:
- Use ONLY the label excerpts provided. If they do not answer the question, reply exactly:
  "The label shown does not answer this. Please ask your pharmacist or doctor."
- Never give a diagnosis, never suggest starting, stopping or changing a dose.
- If the question describes an emergency (chest pain, breathing trouble, overdose, fainting, seizure), tell them to call 112 immediately.
- Keep answers under 120 words. End with the source in brackets, e.g. [Source: DailyMed label].`;

interface Body {
  question?: unknown;
  medicine?: unknown;
  context?: Array<{ source?: unknown; generic?: unknown; sections?: Array<{ title?: unknown; text?: unknown }> }>;
}

export async function GET() {
  return NextResponse.json({ enabled: Boolean(process.env.GROQ_API_KEY) });
}

export async function POST(req: Request) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return NextResponse.json({ error: "Assistant not configured." }, { status: 501 });

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const question = typeof body.question === "string" ? body.question.trim().slice(0, 300) : "";
  if (!question) return NextResponse.json({ error: "Ask a question." }, { status: 400 });

  const excerpts = (Array.isArray(body.context) ? body.context : [])
    .slice(0, 3)
    .map((c) => {
      const sections = (Array.isArray(c.sections) ? c.sections : [])
        .slice(0, 8)
        .map((s) => `${String(s.title ?? "").slice(0, 60)}: ${String(s.text ?? "").slice(0, 900)}`)
        .join("\n");
      return `Medicine: ${String(c.generic ?? "").slice(0, 80)}\nSource: ${String(c.source ?? "").slice(0, 200)}\n${sections}`;
    })
    .join("\n\n");
  if (!excerpts) return NextResponse.json({ answer: "The label shown does not answer this. Please ask your pharmacist or doctor." });

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0,
      max_tokens: 400,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: `LABEL EXCERPTS:\n${excerpts}\n\nQUESTION about ${String(body.medicine ?? "this medicine").slice(0, 120)}: ${question}` },
      ],
    }),
  });
  if (!res.ok) return NextResponse.json({ error: "Assistant unavailable right now." }, { status: 502 });
  const data = await res.json();
  const answer = data?.choices?.[0]?.message?.content;
  return NextResponse.json({ answer: typeof answer === "string" ? answer.trim() : "No answer." });
}
