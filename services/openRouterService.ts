import { ChatMessage, MessageRole, Attachment } from "../utils/types";

const OPENROUTER_API_KEY = process.env.API_KEY || '';
const MODEL = "nvidia/nemotron-nano-12b-v2-vl:free";

class OpenRouterService {
  
  // Helper to convert ChatMessage[] to OpenRouter/OpenAI API format
  private formatHistory(history: ChatMessage[]) {
    return history.map(msg => {
      const content: any[] = [];
      
      // Add text content
      if (msg.text) {
        content.push({ type: "text", text: msg.text });
      }

      // Add image content if present
      if (msg.attachment) {
        content.push({
          type: "image_url",
          image_url: {
            url: `data:${msg.attachment.mimeType};base64,${msg.attachment.content}`
          }
        });
      }

      // If it's a model message and has reasoning details, we might want to preserve it 
      // (though OpenRouter usually expects it in the assistant message for context)
      // For this implementation, we focus on the content.
      
      return {
        role: msg.role === MessageRole.Model ? "assistant" : 
              msg.role === MessageRole.User ? "user" : "system",
        content: content.length === 1 && content[0].type === "text" ? content[0].text : content
      };
    });
  }

  public async *sendMessageStream(text: string, attachment: Attachment | undefined, history: ChatMessage[]): AsyncGenerator<string, void, unknown> {
    if (!OPENROUTER_API_KEY) {
      yield "Error: OPENROUTER_API_KEY is missing.";
      return;
    }

    const messages = this.formatHistory(history);

    // Add current message
    const currentContent: any[] = [{ type: "text", text: text }];
    if (attachment) {
      currentContent.push({
        type: "image_url",
        image_url: {
          url: `data:${attachment.mimeType};base64,${attachment.content}`
        }
      });
    }

    messages.push({
      role: "user",
      content: currentContent
    });

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin, // Required by OpenRouter
          "X-Title": "Dland AI"
        },
        body: JSON.stringify({
          model: MODEL,
          messages: messages,
          stream: true, // Enable streaming
          reasoning: { enabled: true }
        })
      });

      if (!response.ok) {
        const err = await response.text();
        console.error("OpenRouter API Error:", err);
        throw new Error(`OpenRouter API Error: ${response.statusText}`);
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (dataStr === "[DONE]") return;
            
            try {
              const data = JSON.parse(dataStr);
              const delta = data.choices[0]?.delta?.content;
              if (delta) {
                yield delta;
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      console.error("Error sending message to OpenRouter:", error);
      yield "Sorry, I encountered an error processing your image request.";
    }
  }
}

export const openRouterService = new OpenRouterService();