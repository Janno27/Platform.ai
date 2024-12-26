"use client";

import { DraftEditor } from '@/components/ab-initiator/draft-editor';

interface DraftEditorPageProps {
  draftId: string;
}

export function DraftEditorPage({ draftId }: DraftEditorPageProps) {
  return <DraftEditor draftId={draftId} />;
} 