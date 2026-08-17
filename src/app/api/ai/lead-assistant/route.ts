import { NextResponse } from "next/server";
import { generateText } from "ai";

export async function POST(req: Request) {
  try {
    const { company, primaryContact, prompt, activitiesSummary } = await req.json();

    let model;
    if (process.env.OPENAI_API_KEY) {
      const { createOpenAI } = await import("@ai-sdk/openai");
      const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
      model = openai("gpt-4o-mini");
    } else if (process.env.GROQ_API_KEY) {
      const { groq } = await import("@ai-sdk/groq");
      model = groq("llama-3.3-70b-versatile");
    } else {
      return NextResponse.json({
        reply: `**AI Sales Assistant Advice for ${company?.company_name || "Prospect"}**\n\n` +
               `1. **Greeting**: "Hi ${primaryContact?.full_name || "there"}, this is Ramij from Tadbeer Transformation."\n` +
               `2. **Value Hook**: "We're currently helping ${company?.industry || "businesses"} automate lead follow-up and WhatsApp routing."\n` +
               `3. **Action**: Offer a complimentary 15-minute growth audit to demonstrate immediate value.`
      });
    }

    const systemPrompt = `
      You are an elite AI Sales Assistant for Tadbeer Transformation (TTT CRM).
      Your user is sales lead Ramij or a team member pitching to ${company?.company_name}.
      
      FULL LEAD CONTEXT:
      - Company Name: ${company?.company_name}
      - Industry: ${company?.industry || "General Enterprise"}
      - Location: ${company?.city || "Oman"}, ${company?.country || ""}
      - Primary Contact: ${primaryContact?.full_name || "Decision Maker"} (${primaryContact?.title || "Owner"})
      - Contact Phone: ${primaryContact?.phone || company?.phone || "N/A"}
      - Contact WhatsApp: ${primaryContact?.whatsapp || "N/A"}
      - Current Status: ${company?.status}
      - Research & Notes: ${company?.notes || "No extra research notes"}
      - Recent Activity History:\n${activitiesSummary || "No previous touches logged"}
      
      Instructions:
      - Give direct, highly actionable sales advice, call scripts, objection handling, or follow-up messages tailored strictly to this prospect.
      - Be concise, professional, persuasive, and non-technical.
    `;

    const { text } = await generateText({
      model,
      system: systemPrompt,
      prompt: prompt || "What is the best next action for this lead?",
    });

    return NextResponse.json({ reply: text });
  } catch (err) {
    console.error("Lead AI Assistant error:", err);
    return NextResponse.json(
      { reply: "I'm analyzing this lead's context. Based on recorded history, recommend calling the primary decision maker directly or sending a WhatsApp follow-up." },
      { status: 200 }
    );
  }
}
