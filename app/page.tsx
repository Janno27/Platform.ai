"use client";

import React from 'react';
import { PromptSection } from '@/components/ab-initiator/sections/prompt-section';

export default function ABInitiatorPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-[85%] sm:w-[80%] md:w-[75%] lg:w-[70%] xl:w-[65%] max-w-[1000px]">
        <PromptSection />
      </div>
    </div>
  );
}