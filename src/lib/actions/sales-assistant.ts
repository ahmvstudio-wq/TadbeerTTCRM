"use server";

import { generateText } from "ai";
import { getCompany } from "./companies";

/**
 * Helper function to scrape a website using Jina Reader API
 */
async function scrapeWebsite(url: string): Promise<string | null> {
  if (!url || url.length < 5) return null;
  
  try {
    let targetUrl = url;
    if (!targetUrl.startsWith('http')) {
      targetUrl = 'https://' + targetUrl;
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 second timeout
    
    const res = await fetch(`https://r.jina.ai/${targetUrl}`, {
      signal: controller.signal,
      headers: {
        'Accept': 'text/plain',
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) return null;
    
    let text = await res.text();
    // Truncate to avoid context explosion
    if (text.length > 3500) {
      text = text.substring(0, 3500) + "\n... (truncated)";
    }
    return text;
  } catch (err) {
    console.warn(`Failed to scrape website ${url}:`, err);
    return null;
  }
}

export async function generateSalesStrategy(companyId: string, researchNotes?: string) {
  try {
    const { data: company, error } = await getCompany(companyId);
    
    if (error || !company) {
      return { error: "Failed to fetch company details for sales strategy generation." };
    }

    // Determine provider and model
    let model;
    
    if (process.env.OPENAI_API_KEY) {
      const { createOpenAI } = await import('@ai-sdk/openai');
      const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
      model = openai('gpt-4o-mini');
    } else if (process.env.GROQ_API_KEY) {
      const { groq } = await import('@ai-sdk/groq');
      model = groq('llama-3.3-70b-versatile');
    } else {
      return { error: "No AI provider configured (Missing OPENAI_API_KEY or GROQ_API_KEY)." };
    }

    // Attempt to scrape website if it exists
    let websiteContext = "";
    if (company.website) {
      const scrapedData = await scrapeWebsite(company.website);
      if (scrapedData) {
        websiteContext = `\n\n      [LIVE RESEARCH DATA - HOMEPAGE]\n      ${scrapedData}`;
      }
    }

    // Manual research notes from the SDR
    const manualResearch = researchNotes?.trim()
      ? `\n\n      [SDR MANUAL RESEARCH NOTES - CRITICAL: Prioritize these in the script]\n      ${researchNotes.trim()}`
      : "";

    const companyContext = `
      Company Name: ${company.company_name}
      Industry: ${company.industry || "Unknown"}
      Website: ${company.website || "None"}
      Location: ${company.city || "Unknown"}, ${company.country || "Unknown"}
      Employees: ${company.employee_count || "Unknown"}
      Notes: ${company.notes || "No notes"}
      ${websiteContext}
      ${manualResearch}
    `;


    const systemPrompt = `
      You are an elite Sales Execution Assistant. Your goal is to guide the salesperson towards BOOKING A MEETING. 
      You will analyze the following company context and generate a tailored sales strategy.
      
      Company Context:
      ${companyContext}
      
      Guidelines:
      1. Calling Script: STRICTLY follow this structure (The objective is NOT to explain every service, but to qualify needs and book the meeting):
         - Greeting: Hi, am I speaking with [Name]?
         - Permission: Is this a good time to speak for a minute?
         - Introduction: My name is [Your Name] from Tadbeer Transformation. We're a Digital Transformation Company helping businesses in your industry improve their growth and operations.
         - Context: We work with businesses in your market...
         - Qualifying Question: Ask one question based on priorities (e.g. growing customer base vs improving operations).
         - Transition: "That's exactly why I reached out. I think there are a few areas..."
         - Meeting Ask: "Would it be possible for us to schedule a short meeting this week... During the meeting we'll understand your business better and show you the most relevant solutions."
         - If They Agree: "Great. Before the meeting, I'd like to send you a proposal that's relevant to your business. Could I ask one quick question..."
         - Discovery Before Deck: Ask if looking to grow business vs improve operations, then "Perfect. I'll send you the proposal..."
      2. Qualification Questions: Provide 3-5 smart, context-aware questions.
      3. Recommended Offer: Recommend EXACTLY ONE primary offer (e.g., Free Website, Digital Presence Audit). Do not pitch this in the script, this is for the discovery meeting.
      4. Objection Handling: Provide concise, persuasive responses for common objections (Already have someone, Send details, Not interested, Call later, Don't need AI, Have website, No budget).
      5. Follow-ups: Generate short, professional messages for WhatsApp, Email, Instagram (Must use this template: "Hi! I'm from Tadbeer Transformation. We're currently helping businesses become more digital and are running a campaign where we're providing free websites to eligible businesses. We'd love to understand your business... Would you be open to a short meeting this week?"), and LinkedIn.
      6. Sales Insights: Estimate Meeting Probability (0-100), Interest Level (Low/Medium/High), 2-3 Pain Points, Recommended Next Action, Follow-up Time, and Confidence Score (0-100).
      
      OUTPUT INSTRUCTIONS:
      Return ONLY raw JSON matching this exact structure (do NOT wrap it in markdown \`\`\`json or provide any other text):
      {
        "script": {
          "greeting": "string",
          "permission": "string",
          "introduction": "string",
          "context": "string",
          "qualifyingQuestion": "string",
          "transition": "string",
          "meetingAsk": "string",
          "ifTheyAgree": "string",
          "discoveryBeforeDeck": "string"
        },
        "qualificationQuestions": ["string"],
        "recommendedOffer": {
          "offerName": "string",
          "reasoning": "string"
        },
        "objectionHandling": [
          { "objection": "string", "response": "string" }
        ],
        "followUpMessages": {
          "whatsapp": "string",
          "email": { "subject": "string", "body": "string" },
          "instagram": "string",
          "linkedin": "string"
        },
        "salesInsights": {
          "meetingProbability": 80,
          "interestLevel": "High",
          "painPoints": ["string"],
          "recommendedNextAction": "string",
          "recommendedFollowUpTime": "string",
          "confidenceScore": 90
        }
      }
    `;

    const { text } = await generateText({
      model,
      system: systemPrompt,
      prompt: "Generate the sales strategy for this prospect.",
    });

    try {
      const jsonString = text.replace(/```json\n?|\n?```/g, '').trim();
      const object = JSON.parse(jsonString);
      return { data: object };
    } catch (parseError) {
      console.error("Failed to parse JSON:", text);
      return { error: "AI failed to return valid JSON." };
    }
  } catch (err: unknown) {
    console.error("Error generating sales strategy:", err);
    return { error: (err as Error).message || "An unexpected error occurred." };
  }
}
