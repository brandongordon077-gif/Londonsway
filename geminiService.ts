
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are "LondonWay", the ultimate London transport guide. You help users navigate the city's complexity with ease.

CORE RESPONSIBILITIES:
1. COST ESTIMATION: For any journey, estimate the fare (e.g., £2.80 Off-peak / £3.40 Peak). Remind them of the daily cap for the zones traveled.
2. ACCESSIBILITY: Proactively identify if a route is "Step-free", has "Partial access", or is "Complex" (lots of stairs). Mention lift availability if searched.
3. NETWORK CLARITY: Proactively solve "confusion points". Examples: 
   - Explain the Bank/Monument 10-minute walk.
   - Clarify Northern Line branches (Bank vs Charing Cross).
   - Note that Paddington Elizabeth Line is separate from the main station.
4. OYSTER/CONTACTLESS: Always assume they are using one of these. Explain "Card Clash" if relevant.

FORMATTING REQUIREMENTS:
- Use bold for **Stations** and **Lines**.
- Start disruptions with: "ALERTE: [Line] - [Status]".
- Include these metadata tags at the end or within text:
  - "Crowding: [Low/Moderate/High]"
  - "Cost: [Estimate text]"
  - "Access: [Step-free/Partial/Complex]"

Be concise, reassuring, and expert. Londoners hate fluff but love efficiency.
`;

export class TravelAssistantService {
  private ai: GoogleGenAI;
  private chat: Chat;
  private useTools: boolean = true;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    this.chat = this.createChatSession();
  }

  private createChatSession() {
    return this.ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: this.useTools ? [{ googleSearch: {} }] : undefined,
      },
    });
  }

  private parseMetadata(text: string) {
    const crowdingMatch = text.match(/Crowding:\s*(Low|Moderate|High|Busy)/i);
    const alertMatch = text.match(/ALERTE:\s*(.*)/i);
    const costMatch = text.match(/Cost:\s*([^\n\r]*)/i);
    const accessMatch = text.match(/Access:\s*(Step-free|Partial|Complex)/i);
    
    return {
      crowding: crowdingMatch ? (crowdingMatch[1] as any) : undefined,
      alert: alertMatch ? alertMatch[1].split('\n')[0] : undefined,
      cost: costMatch ? costMatch[1].trim() : undefined,
      access: accessMatch ? (accessMatch[1] as any) : undefined
    };
  }

  async sendMessageStream(
    message: string, 
    onChunk: (text: string, sources?: any[], metadata?: any) => void
  ) {
    try {
      const result = await this.chat.sendMessageStream({ message });
      let fullText = "";
      
      for await (const chunk of result) {
        const text = (chunk as GenerateContentResponse).text;
        fullText += text;
        
        const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
        const sources = groundingChunks ? groundingChunks
          .filter(c => c.web)
          .map(c => ({ uri: c.web!.uri, title: c.web!.title || 'Source' })) : undefined;
          
        const metadata = this.parseMetadata(fullText);
        onChunk(fullText, sources, metadata);
      }
      return fullText;
    } catch (error: any) {
      console.error("Gemini Error:", error);
      if (this.useTools && (error.message?.includes('403') || error.message?.toLowerCase().includes('permission'))) {
        this.useTools = false;
        this.chat = this.createChatSession();
        return this.sendMessageStream(message + " (Basic mode)", onChunk);
      }
      throw error;
    }
  }

  async getInitialGreeting() {
    try {
      const response = await this.chat.sendMessage({ 
        message: "Greet the user as LondonWay. Mention one interesting transit fact about fares or accessibility today to help them start." 
      });
      return response.text;
    } catch {
      return "Welcome to LondonWay. How can I help you navigate the city today?";
    }
  }
}
