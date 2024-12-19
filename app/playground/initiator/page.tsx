"use client";

import React from 'react';
import { PromptSection } from '@/components/ab-initiator/sections/prompt-section';

export default function ABInitiatorPage() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="w-full h-full max-w-[1400px]">
        <PromptSection />
      </div>
    </div>
  );
}