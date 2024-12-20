"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { TestLoader } from "./test-loader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, ChevronLeft, ChevronRight, ImageIcon, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ExperimentationSummary } from "../experimentation-summary/experimentation-summary";
import { LoadingDots } from "./loading-dots";
import { ExperimentationSummarySkeleton } from "../experimentation-summary/experimentation-summary-skeleton";

interface Message {
  id: string;
  content: string;
  type: 'user' | 'assistant' | 'loader';
  images?: { id: string; url: string }[];
}

interface ChatLayoutProps {
  prompt: string;
  title?: string;
  subtitle?: string;
  onExperimentationReady: () => void;
}

interface ImagePreview {
  id: string;
  file: File;
  preview: string;
}

interface ImageCache {
  [key: string]: string;
}

export function ChatLayout({ prompt, title, subtitle, onExperimentationReady }: ChatLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isProcessingComplete, setIsProcessingComplete] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', content: prompt, type: 'user' },
    { id: '2', content: "I'll help you create a new experimentation following good methodologies and helping you organize your ideas according to best practices.", type: 'assistant' },
    { id: '3', content: '', type: 'loader' }
  ]);
  const [input, setInput] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [showShortcutHint, setShowShortcutHint] = useState(false);
  const CHAR_THRESHOLD = 10; // Seuil de caractères pour afficher l'aide
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageCache, setImageCache] = useState<ImageCache>({});
  const [showSkeleton, setShowSkeleton] = useState(false);

  const handleComplete = () => {
    setIsProcessingComplete(true);
    onExperimentationReady();
    setTimeout(() => {
      setShowSummary(true);
    }, 500);
  };

  const handleLoaderPhaseChange = (currentText: string) => {
    if (currentText === "Creating - Hypothesis") {
      setShowSkeleton(true);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const cacheImage = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImageCache(prev => ({
          ...prev,
          [file.name]: base64String
        }));
        resolve(base64String);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleSendMessage = async (text: string = '', images: ImagePreview[] = []) => {
    if (!text.trim() && images.length === 0) return;

    const cachedImages = await Promise.all(
      images.map(async (img) => ({
        id: img.id,
        url: imageCache[img.file.name] || await cacheImage(img.file)
      }))
    );

    const newMessage: Message = {
      id: Date.now().toString(),
      content: text,
      type: 'user',
      images: cachedImages
    };

    setMessages(prev => [...prev, newMessage]);
    setInput("");
    setImagePreviews([]);
  };

  const resetTextareaHeight = (target: HTMLTextAreaElement) => {
    target.style.height = 'auto';
  };

  // Gestionnaire d'événements clavier
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift + Enter pour nouvelle ligne
        return;
      } else {
        // Enter seul pour envoyer
        e.preventDefault();
        if (input.trim() || imagePreviews.length > 0) {
          handleSendMessage(input, imagePreviews);
          const textarea = e.currentTarget;
          resetTextareaHeight(textarea);
        }
      }
    }
  };

  // Gestionnaire de changement de texte
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
    setShowShortcutHint(value.length >= CHAR_THRESHOLD);
  };

  // Nettoyage de l'URL de prévisualisation
  useEffect(() => {
    return () => {
      if (imagePreviews.length > 0) {
        imagePreviews.forEach(img => URL.revokeObjectURL(img.preview));
      }
    };
  }, [imagePreviews]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && imagePreviews.length < 5) {
      const file = e.target.files[0];
      setImagePreviews(prev => [...prev, {
        id: Date.now().toString(),
        file,
        preview: URL.createObjectURL(file)
      }]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (id: string) => {
    setImagePreviews(prev => {
      const imageToRemove = prev.find(img => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  const renderMessage = (message: Message) => (
    <div className={cn(
      "rounded-xl p-4 max-w-[90%]",
      message.type === 'user' 
        ? "bg-primary/10 text-foreground ml-auto"
        : "bg-muted/50 dark:bg-muted/70 text-foreground"
    )}>
      {message.type === 'loader' ? (
        <div className="space-y-4">
          <p className="text-sm">
            {isProcessingComplete 
              ? "Your request has been successfully processed!"
              : (
                <span>
                  Processing your request
                  <LoadingDots />
                </span>
              )}
          </p>
          <div className="relative z-0">
            <TestLoader 
              onComplete={handleComplete} 
              onPhaseChange={handleLoaderPhaseChange}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {message.content && (
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}
          
          {message.images && message.images.length > 0 && (
            <div className="flex flex-col gap-2 mt-2 border-t border-border/20 pt-2">
              <div className="flex flex-wrap gap-2">
                {message.images.map((img) => (
                  <div
                    key={img.id}
                    className="relative"
                  >
                    <img
                      src={img.url}
                      alt="Attached"
                      className="h-16 w-16 rounded-md border border-border/40 object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex flex-1">
        <motion.div
          animate={{ width: isCollapsed ? '60px' : '35%' }}
          transition={{ duration: 0.3 }}
          className="relative h-full flex flex-col bg-background/80 rounded-xl"
        >
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute top-1/2 -translate-y-1/2 z-50",
              isCollapsed ? "-right-6" : "-right-6"
            )}
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>

          {!isCollapsed && (
            <>
              {/* Transparent and Blurred Div (Inline Style with Correct Stacking Context) */}
              <div
                style={{
                  height: '10px',
                  backgroundColor: 'rgba(var(--background), 0.8)', // Transparent background
                  backdropFilter: 'blur(4px)', // Blur effect
                  zIndex: 1, // Ensure it doesn't block other elements
                }}
              >
              </div>

              <div className="flex-1 relative">
                <div className="absolute inset-0 flex flex-col justify-end">
                  {/* Zone de messages */}
                  <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-none px-8">
                    <div className="space-y-4 pb-4 px-2">
                      {messages.map((message) => (
                        <div key={message.id} className="flex animate-in fade-in-0 slide-in-from-bottom-2">
                          {renderMessage(message)}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Zone de prévisualisation d'image */}
                  {imagePreviews.length > 0 && (
                    <div className="mx-auto" style={{ width: '85%' }}>
                      <div className="px-3 py-2 border border-b-0 border-border/40 bg-background/60 backdrop-blur-sm rounded-t-lg">
                        <div className="flex flex-wrap gap-2 items-center">
                          {imagePreviews.map((img) => (
                            <div key={img.id} className="relative">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeImage(img.id)}
                                className="absolute -top-1 -left-1 h-4 w-4 rounded-full bg-background shadow-sm hover:bg-muted z-10"
                              >
                                <X className="h-2 w-2" />
                              </Button>
                              <img 
                                src={img.preview} 
                                alt="Preview" 
                                className="h-[32px] rounded-md border border-border/40 object-cover w-full"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Zone de saisie */}
                  <div className="p-4 pt-0">
                    <div className="relative flex flex-col gap-2">
                      <div className="relative flex items-center">
                        <textarea
                          value={input}
                          onChange={handleInputChange}
                          onKeyDown={handleKeyDown}
                          placeholder="Send a message..."
                          rows={1}
                          className="h-auto min-h-[56px] max-h-[150px] w-full resize-none bg-background/60 backdrop-blur-sm rounded-2xl pr-16 border border-border/40 shadow-sm p-4 text-sm overflow-y-auto"
                          style={{
                            lineHeight: '1.5',
                          }}
                          onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            const newHeight = Math.min(target.scrollHeight, 150);
                            target.style.height = `${newHeight}px`;
                          }}
                        />
                        <Button
                          type="submit"
                          size="icon"
                          onClick={(e) => {
                            e.preventDefault();
                            handleSendMessage(input, imagePreviews);
                            const textarea = e.currentTarget.parentElement?.querySelector('textarea');
                            if (textarea) {
                              resetTextareaHeight(textarea);
                            }
                            setShowShortcutHint(false);
                          }}
                          className="absolute right-2 h-10 w-10 rounded-xl bg-primary hover:bg-primary/90"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between px-4 h-6 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            accept="image/*"
                            className="hidden"
                            id="image-upload"
                            disabled={imagePreviews.length >= 5}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 hover:bg-muted/50 rounded-md"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={imagePreviews.length >= 5}
                          >
                            <ImageIcon className={cn(
                              "h-3 w-3",
                              imagePreviews.length >= 5 ? "text-muted-foreground/40" : "text-muted-foreground"
                            )} />
                          </Button>
                        </div>

                        <div className="flex items-center gap-2">
                          {showShortcutHint && (
                            <div className="flex items-center gap-1">
                              Use <kbd className="px-1 py-0.5 bg-muted rounded-md">Shift</kbd> + <kbd className="px-1 py-0.5 bg-muted rounded-md">Return</kbd> for a new line
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.div>

        <div className="relative flex-1 h-full">
          <AnimatePresence mode="wait">
            {showSkeleton && !showSummary && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 h-full w-full"
              >
                <ExperimentationSummarySkeleton />
              </motion.div>
            )}
            {showSummary && (
              <motion.div
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 300 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className="absolute inset-0 h-full w-full"
              >
                <ExperimentationSummary />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}