import OpenRouter from "openrouter";
import { ChatMessage, MessageRole } from "../utils/types";

const API_KEY = process.env.API_KEY || '';

class OpenRouterService {
  private client: OpenRouter;
  private chatHistory: ChatMessage[] = [];
  private systemInstruction: string = "You are Dland, a professional, clear, and direct AI assistant. You provide high-quality responses using clean Markdown formatting. Your tone is helpful but neutral and sophisticated.";

  constructor() {
    if (!API_KEY) {
      console.error("OpenRouter API Key is missing. Please set process.env.OPENROUTER_API_KEY.");
    }
    this.client = new OpenRouter({ apiKey: API_KEY });
  }

  public startChat(systemInstruction?: string, history?: ChatMessage[]) {
    this.systemInstruction = systemInstruction || this.systemInstruction;
    this.chatHistory = history || [];
  }

  public async *sendMessageStream(message: string): AsyncGenerator<string, void, unknown> {
    if (!API_KEY) throw new Error("OpenRouter API Key missing.");

    // Push user message to local history
    this.chatHistory.push({ role: MessageRole.User, text: message });

    const messagesForAPI = [
      { role: "system", content: this.systemInstruction },
      ...this.chatHistory.map(msg => ({
        role: msg.role === MessageRole.User ? "user" : "assistant",
        content: msg.text
      }))
    ];

    try {
      const stream = await this.client.chat.completions.create({
        model: "qwen/qwen3-next-80b-a3b-instruct:free", // or any OpenRouter model you like
        messages: messagesForAPI,
        stream: true
      });

      for await (const chunk of stream) {
        const text = chunk.choices?.[0]?.delta?.content;
        if (text) {
          yield text;
        }
      }

      // Optionally, push the assistant's full reply to history
      const finalText = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messagesForAPI
      });

      const assistantReply = finalText.choices?.[0]?.message?.content;
      if (assistantReply) {
        this.chatHistory.push({ role: MessageRole.Model, text: assistantReply });
      }

    } catch (err) {
      console.error("Error sending message to OpenRouter:", err);
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

export const openRouterService = new OpenRouterService();
