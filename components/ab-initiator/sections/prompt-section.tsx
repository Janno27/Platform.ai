"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import TextareaAutosize from 'react-textarea-autosize';
import { Sparkles, X, Loader2 } from "lucide-react";
import { HuggingFaceService } from '@/lib/services/huggingface-service';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from "framer-motion";
import { ChatLayout } from "../test-loader/chat-layout";

const EXAMPLE_PROMPTS = [
  "Context: High bounce rate detected in funnel analysis",
  "Previous Test: +22% CTR with social proof elements",
  "User Research: Navigation confusion in mobile app",
  "Design Concept: New product card layout",
  "Goal: Increase Add-to-Cart conversion by 5%",
  "Pain Point: Cart abandonment at shipping step",
  "Hypothesis: Simplified checkout will boost sales"
];

export function PromptSection() {
  const [promptText, setPromptText] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [generatedHypothesis, setGeneratedHypothesis] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isExpanded, setIsExpanded] = React.useState(true);
  const [showChat, setShowChat] = React.useState(false);
  const [showExperimentation, setShowExperimentation] = React.useState(false);

  const hfService = React.useMemo(
    () => new HuggingFaceService(process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY!),
    []
  );

  const handlePromptClick = (prompt: string) => {
    setPromptText(prompt);
  };

  const handleGenerate = async () => {
    if (!promptText.trim()) return;
    setShowChat(true);
  };

  const handleClear = () => {
    setPromptText("");
    setGeneratedHypothesis(null);
    setError(null);
  };

  return (
    <AnimatePresence>
      {!showChat ? (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ width: '70%' }}
          className="mx-auto space-y-8"
        >
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-semibold tracking-tight text-foreground">
              What do you want to test?
            </h1>
            <p className="text-base text-muted-foreground">
              Prompt, Run, Edit and take impactful decisions
            </p>
          </div>

          <div className="relative w-full bg-background rounded-2xl border shadow-md hover:shadow-lg transition-all duration-200">
            <div className="relative p-4 flex items-stretch gap-4">
              <TextareaAutosize
                placeholder="Describe your test idea..."
                className="flex-1 text-base resize-none border-none bg-background/50 focus:bg-background rounded-2xl p-4 transition-colors duration-200 focus-visible:ring-0 focus-visible:ring-offset-0"
                minRows={3}
                maxRows={10}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
              />
              
              {promptText && (
                <div className="flex flex-col justify-between gap-4 shrink-0 self-stretch items-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-muted self-end"
                    onClick={handleClear}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex-grow" />
                  
                  <Button
                    size={isExpanded ? "default" : "icon"}
                    className={cn(
                      "transition-all duration-300",
                      isGenerating ? "animate-pulse" : "",
                      isExpanded ? "px-4 min-w-[120px]" : "h-8 w-8",
                      "rounded-lg bg-primary hover:bg-primary/90 shadow-sm hover:shadow self-end"
                    )}
                    onClick={handleGenerate}
                    disabled={isGenerating}
                  >
                    <Sparkles 
                      className={cn(
                        "h-4 w-4 transition-all",
                        isGenerating ? "animate-bounce animate-glow" : "",
                        !isExpanded ? "" : "mr-2"
                      )} 
                    />
                    {isExpanded && "Generate"}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
              {error}
            </div>
          )}

          {generatedHypothesis && (
            <div className="p-6 bg-card rounded-xl border shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Generated Test Plan</h2>
              <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
                {generatedHypothesis}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4" />
              Powered by AI for better decisions
            </p>

            <div className="flex flex-wrap gap-2 justify-center">
              {EXAMPLE_PROMPTS.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handlePromptClick(prompt)}
                  className="px-4 py-2 text-sm bg-muted/50 hover:bg-muted text-muted-foreground rounded-xl transition-all shadow-sm hover:shadow"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      ) : (
        <ChatLayout
          title="What do you want to test?"
          subtitle="Prompt, Run, Edit and take impactful decisions"
          prompt={promptText}
          onExperimentationReady={() => setShowExperimentation(true)}
        />
      )}
    </AnimatePresence>
  );
}