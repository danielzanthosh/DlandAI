import { ChatMessage, MessageRole } from "../utils/types";

const API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
const MODEL = "gemini-1.5-flash";

class GeminiService {
  private chatHistory: ChatMessage[] = [];
  private systemInstruction =
    "You are Dland, a professional, clear, and direct AI assistant. You provide high-quality responses using clean Markdown formatting. Your tone is helpful but neutral and sophisticated.";

  constructor() {
    if (!API_KEY) {
      console.error("Gemini API Key is missing. Please set process.env.GEMINI_API_KEY.");
    }
  }

  public startChat(systemInstruction?: string, history?: ChatMessage[]) {
    this.systemInstruction = systemInstruction || this.systemInstruction;
    this.chatHistory = history || [];
  }

  private buildContents() {
    return this.chatHistory.map((msg) => ({
      role: msg.role === MessageRole.Model ? "model" : "user",
      parts: [{ text: msg.text }]
    }));
  }

  public async *sendMessageStream(message: string): AsyncGenerator<string, void, unknown> {
    if (!API_KEY) throw new Error("Gemini API Key missing.");

    this.chatHistory.push({ role: MessageRole.User, text: message });

    const body = {
      contents: this.buildContents(),
      systemInstruction: { parts: [{ text: this.systemInstruction }] }
    };

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(body)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API Error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const assistantReply = data?.candidates?.[0]?.content?.parts?.map((part: { text: string }) => part.text).join("") || "";

      if (assistantReply) {
        this.chatHistory.push({ role: MessageRole.Model, text: assistantReply });
        yield assistantReply;
      } else {
        yield "Sorry, I couldn't generate a response.";
      }
    } catch (err) {
      console.error("Error sending message to Gemini:", err);
      throw err;
    }
  }

  public reset(systemInstruction?: string) {
    this.chatHistory = [];
    this.systemInstruction = systemInstruction || this.systemInstruction;
  }

  public restoreSession(systemInstruction: string, messages: ChatMessage[]) {
    this.startChat(systemInstruction, messages);
  }
}

export const geminiService = new GeminiService();
