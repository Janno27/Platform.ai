// lib/services/ai-service.ts
import OpenAI from 'openai';
import { ABTestHypothesis } from '@/types/ab-test';

// Options d'IA disponibles
export type AIProvider = 'openai' | 'anthropic' | 'cohere';

export class AIService {
  private openai: OpenAI;
  private provider: AIProvider;

  constructor(provider: AIProvider = 'openai') {
    this.provider = provider;
    if (provider === 'openai') {
      this.openai = new OpenAI({
        apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      });
    }
  }

  async generateHypothesis(prompt: string): Promise<ABTestHypothesis> {
    const systemPrompt = `You are an A/B testing expert. Analyze the given context and generate a structured test hypothesis. 
    Consider user behavior, business metrics, and statistical significance.`;

    switch (this.provider) {
      case 'openai':
        const completion = await this.openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
        });

        return this.parseResponse(completion.choices[0].message.content);

      // Ajoutez d'autres providers si nécessaire
    }
  }

  private parseResponse(response: string): ABTestHypothesis {
    // Logique de parsing de la réponse
    // À implémenter selon le format de réponse choisi
    return JSON.parse(response);
  }
}