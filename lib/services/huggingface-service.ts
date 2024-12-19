// lib/services/huggingface-service.ts
export class HuggingFaceService {
    private API_URL = "https://api-inference.huggingface.co/models/";
    private MODEL_ID = "mistralai/Mistral-7B-v0.1";
    private API_KEY: string;
  
    constructor(apiKey: string) {
      this.API_KEY = apiKey;
    }
  
    async generateTestHypothesis(prompt: string) {
      try {
        const response = await fetch(`${this.API_URL}${this.MODEL_ID}`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              max_new_tokens: 250,
              temperature: 0.7,
              return_full_text: false,
            }
          }),
        });
  
        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }
  
        const data = await response.json();
        return data[0]?.generated_text || "No response generated";
  
      } catch (error) {
        console.error("HuggingFace API error:", error);
        throw error;
      }
    }
  }