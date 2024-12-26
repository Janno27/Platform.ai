"use client";

import React from 'react';
import { ChatLayout } from "../test-loader/chat-layout";
import { useExperimentation } from '@/providers/experimentation-provider';
import { supabase } from '@/lib/supabase';

interface DraftEditorProps {
  draftId: string;
}

export function DraftEditor({ draftId }: DraftEditorProps) {
  const { updateFormData } = useExperimentation();
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const loadDraft = async () => {
      try {
        const { data: draft, error: draftError } = await supabase
          .from('ab_tests_summary')
          .select('*')
          .eq('id', draftId)
          .single();

        if (draftError) throw draftError;
        if (!draft) throw new Error('Draft not found');

        console.log('Raw draft data:', draft);

        // Formater les données pour correspondre à la structure attendue
        const formattedData = {
          id: draft.id,
          organization_id: draft.organization_id,
          name: draft.name,
          type: draft.type || 'ab_test',
          status: draft.status || 'draft',
          hypothesis: draft.hypothesis || '',
          context: draft.context || '',
          variations: Array.isArray(draft.variations) ? draft.variations : [],
          roadmap: Array.isArray(draft.roadmap) ? draft.roadmap : [],
          expectedResults: Array.isArray(draft.expected_results) ? draft.expected_results : [],
          owner_id: draft.owner_id,
          created_by: draft.created_by,
          last_modified_by: draft.last_modified_by,
          created_at: draft.created_at,
          updated_at: draft.updated_at
        };

        console.log('Formatted data for form:', formattedData);

        // Mettre à jour le formulaire avec les données formatées
        updateFormData(formattedData, true);
        setIsLoading(false);
      } catch (err: any) {
        console.error('Error loading draft:', {
          message: err.message,
          details: err.details,
          hint: err.hint,
          status: err.status,
          statusText: err.statusText
        });
        setError(new Error(err.message || 'Failed to load draft'));
        setIsLoading(false);
      }
    };

    loadDraft();
  }, [draftId, updateFormData]);

  if (isLoading) {
    return <div className="animate-pulse">Loading draft...</div>;
  }

  if (error) {
    return <div className="text-destructive">Error loading draft: {error.message}</div>;
  }

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="w-full h-full max-w-[1400px]">
        <ChatLayout
          title="Welcome back to your draft"
          subtitle="I'm here to help you complete your test"
          initialMessage="Welcome back! I'm here to assist you in completing your test. Feel free to make any adjustments or ask questions as needed."
          skipLoader
          onExperimentationReady={() => {}} // L'expérimentation est déjà prête
          showExperimentationImmediately
        />
      </div>
    </div>
  );
} 