"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Loader2, CheckCircle2, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TestLoaderProps {
  onComplete: () => void;
  onPhaseChange?: (currentText: string) => void;
}

const STEPS = [
  { phase: 1, text: "Understanding - Prompt" },
  { phase: 1, text: "Searching - Database for equivalents" },
  { phase: 1, text: "Connecting - Website" },
  { phase: 1, text: "Consulting - Target page" },
  { phase: 2, text: "Creating - Hypothesis" },
  { phase: 2, text: "Creating - Context" },
  { phase: 2, text: "Creating - Description" },
  { phase: 2, text: "Creating - Experimentation" },
  { phase: 3, text: ">_ Starting experimentation", isConsole: true }
];

export function TestLoader({ onComplete, onPhaseChange }: TestLoaderProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (currentStep >= STEPS.length) {
      setIsCompleted(true);
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setCompletedSteps(prev => [...prev, currentStep]);
      setCurrentStep(prev => prev + 1);
      if (onPhaseChange && STEPS[currentStep]) {
        onPhaseChange(STEPS[currentStep].text);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [currentStep, onComplete, onPhaseChange]);

  const renderSteps = (phase: number) => {
    return STEPS
      .map((step, index) => {
        if (step.phase !== phase) return null;
        return (
          <div key={index} className="flex items-center gap-3">
            <div className="w-6 h-6 bg-background rounded-full flex items-center justify-center">
              {currentStep === index && !completedSteps.includes(index) && (
                <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
              )}
              {completedSteps.includes(index) && (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
            </div>
            <span className="text-xs">{step.text}</span>
          </div>
        );
      })
      .filter(Boolean);
  };

  return (
    <div className="backdrop-blur-sm bg-black/10 dark:bg-white/5 rounded-xl border border-white/10">
      <div className="p-4 border-b border-white/10">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isCompleted ? "bg-green-500" : "bg-neutral-500"
            )} />
            <div className="space-y-1">
              <h3 className="text-base font-medium">Homepage Optimization Test</h3>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4 text-neutral-400" />
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4">
              <div className="space-y-6">
                <div className="space-y-3">
                  {renderSteps(1)}
                </div>
                <div className="space-y-3">
                  {renderSteps(2)}
                </div>
                <div className="font-mono">
                  {(currentStep === STEPS.length || completedSteps.includes(STEPS.length - 1)) && (
                    <span className="text-blue-500 text-xs">{STEPS[STEPS.length - 1].text}</span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}