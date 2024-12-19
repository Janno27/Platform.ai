"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar } from "@/components/ui/avatar"
import { Bot, Send, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import axios from 'axios'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

interface ChatAnalyticsProps {
  className?: string
  onClose: () => void
  testData?: any
}

export function ChatAnalytics({ className, onClose, testData }: ChatAnalyticsProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMessages([{
      id: '0',
      content: "Je suis votre assistant d'analyse A/B, propulsé par Mistral-7B-v0.1. Je suis spécialisé dans l'interprétation des tests A/B, l'analyse statistique et l'optimisation de conversion. Je peux vous aider à comprendre vos résultats de test, évaluer la significativité statistique et formuler des recommandations basées sur les données.",
      role: 'assistant',
      timestamp: new Date()
    }])
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const truncatePromptIfNeeded = (prompt: string, maxTokens: number): string => {
    const words = prompt.split(' ');
    while (words.length > maxTokens) {
      words.pop();
    }
    return words.join(' ');
  };

  const queryHuggingFace = async (input: string, testData: any) => {
    try {
      const systemPrompt = `Tu es un assistant d'analyse A/B spécialisé, voici ton contexte et tes règles :

      CONTEXTE :
      - Tu analyses des tests A/B pour optimiser des sites web et applications
      - Voici les données fournies par l'utilisateur : ${JSON.stringify(testData)}
      - Tu as accès aux données de conversion, revenus, et comportement utilisateur
      - Tu comprends les concepts de significativité statistique et d'intervalles de confiance
      - Tu peux interpréter les métriques : taux de conversion, ARPU, AOV, etc.

      COMPORTEMENT :
      - Reste TOUJOURS concentré sur l'analyse A/B et l'interprétation des données
      - Ne réponds PAS aux questions hors sujet ou non liées à l'analyse A/B
      - Pour les questions hors sujet, rappelle poliment que tu es spécialisé en analyse A/B
      - Sois précis et factuel dans tes analyses
      - Utilise des pourcentages et des chiffres quand c'est pertinent
      - Mentionne TOUJOURS la significativité statistique dans tes analyses

      STRUCTURE DE RÉPONSE :
      1. Analyse des données/métriques pertinentes
      2. Évaluation de la significativité statistique
      3. Interprétation des résultats
      4. Recommandations concrètes
      5. Suggestions pour approfondir l'analyse si nécessaire

      Question : ${input}

      Réponse (en gardant un ton professionnel et analytique) :`;

      const maxTokenLimit = 32768;
      const promptTokens = systemPrompt.split(' ').length;
      let truncatedPrompt = systemPrompt;

      if (promptTokens + 500 > maxTokenLimit) {
        truncatedPrompt = truncatePromptIfNeeded(systemPrompt, maxTokenLimit - 500);
      }

      const response = await axios({
        url: "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-v0.1",
        method: 'POST',
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_HUGGINGFACE_API_TOKEN}`
        },
        data: {
          inputs: truncatedPrompt,
          parameters: {
            max_new_tokens: 500,
            temperature: 0.7,
            top_p: 0.95,
            do_sample: true,
            return_full_text: false,
            stop: ["Question :", "Human:", "Assistant:"]
          }
        }
      });

      let cleanedResponse = response.data[0]?.generated_text
        .replace(/^\s*Réponse\s*:/, '')
        .trim();

      return cleanedResponse;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error || error.message || "Erreur inconnue";
        console.error('Erreur API:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: errorMessage
        });
        throw new Error(`Erreur de l'API Hugging Face: ${errorMessage}`);
      }
      throw error;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await queryHuggingFace(input, testData)
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: 'assistant',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Erreur:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Désolé, je rencontre des difficultés pour répondre. Veuillez réessayer.",
        role: 'assistant',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className={cn(
      "flex flex-col h-full",
      "bg-background shadow-none border-none",
      "overflow-hidden",
      "relative z-40",
      "animate-in slide-in-from-left duration-300",
      className
    )}>
      <div className="flex-none px-6 py-2 bg-background/50">
        {/* Suppression du titre Assistant Analytique */}
      </div>

      <div className="flex-1 relative min-h-0">
        <div className="sticky top-0 left-0 right-0 h-24 bg-gradient-to-b from-background via-background/80 to-transparent z-10 pointer-events-none" />
        
        <div className="absolute inset-0">
          <div 
            ref={scrollRef}
            className="h-full overflow-auto px-6"
          >
            <div className="flex flex-col-reverse">
              <div className="space-y-6 py-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.role === 'user' ? "justify-end" : "justify-start",
                      "animate-in fade-in-0 slide-in-from-bottom-2"
                    )}
                  >
                    <div className={cn(
                      "flex items-start gap-3 max-w-[90%]",
                      message.role === 'user' ? "flex-row-reverse" : "flex-row"
                    )}>
                      <Avatar className={cn(
                        "h-8 w-8 shrink-0",
                        message.role === 'assistant' ? "bg-muted/50" : "bg-primary"
                      )}>
                        {message.role === 'assistant' && <Bot className="h-5 w-5 text-foreground/80" />}
                      </Avatar>
                      <div className={cn(
                        "flex-1 text-sm leading-relaxed whitespace-pre-wrap",
                        "rounded-lg px-4 py-3",
                        message.role === 'user' 
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/50 text-foreground/90'
                      )}>
                        {message.content}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Assistant est en train d'écrire...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-none p-4 bg-background">
        <form 
          onSubmit={handleSubmit} 
          className="relative max-w-[720px] mx-auto"
        >
          <div className="relative flex items-end gap-2 p-[1px] bg-background rounded-lg border shadow-sm">
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez votre question ici..."
              className="flex-1"
            />
            <Button type="submit" className="h-8 w-8 p-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </Card>
  )
}
