"use client";

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Trash2, ChevronRight, FileText, Share2 } from "lucide-react";
import { ABTestService } from '@/lib/services/ab-test-service';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { useOrganization } from '@/hooks/useOrganization';
import type { ABTestSummary } from '@/types/ab-test';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface Draft extends ABTestSummary {
  current_version?: {
    hypothesis: string;
    context: string;
    type: 'ab_test' | 'personalization' | 'patch';
  };
}

const formatTypeLabel = (type: string) => {
  switch (type) {
    case 'ab_test':
      return 'A/B Test';
    case 'personalization':
      return 'Personalization';
    case 'patch':
      return 'Patch';
    default:
      return type;
  }
};

export function RecentDrafts() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const { toast } = useToast();
  const { organization } = useOrganization();

  useEffect(() => {
    if (organization?.id) {
      loadRecentDrafts();
    }
  }, [organization?.id]);

  const loadRecentDrafts = async () => {
    try {
      if (!organization?.id) {
        throw new Error('No organization found');
      }

      setIsLoading(true);
      
      // Récupérer les drafts
      const { data: allDrafts, error } = await supabase
        .from('ab_tests_summary')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('status', 'draft')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (!allDrafts) {
        throw new Error('No drafts found');
      }

      // Filtrer et trier les drafts
      const recentDrafts = showAll ? allDrafts : allDrafts.slice(0, 3);
      setDrafts(recentDrafts);
    } catch (error: any) {
      console.error('Error loading drafts:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load recent drafts",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ab_test':
        return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
      case 'personalization':
        return 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20';
      case 'patch':
        return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20';
    }
  };

  const formatTimeAgo = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const handleDelete = async (id: string) => {
    try {
      // Optimistic UI update
      setDrafts(prev => prev.filter(draft => draft.id !== id));
      
      // 1. Supprimer d'abord les enregistrements d'audit
      const { error: auditError } = await supabase
        .from('ab_tests_audit')
        .delete()
        .match({ test_id: id });

      if (auditError) {
        throw auditError;
      }

      // 2. Ensuite supprimer le test
      const { error: testError } = await supabase
        .from('ab_tests_summary')
        .delete()
        .match({ id });

      if (testError) {
        throw testError;
      }

      toast({
        title: "Success",
        description: "Draft deleted successfully"
      });
    } catch (error: any) {
      console.error('Error deleting draft:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete draft",
        variant: "destructive"
      });
      // Recharger les drafts en cas d'erreur
      loadRecentDrafts();
    }
  };

  const DraftCard = ({ draft, isListView = false }: { draft: Draft; isListView?: boolean }) => {
    const router = useRouter();

    const handleClick = () => {
      router.push(`/playground/initiator/draft/${draft.id}`);
    };

    const handleShare = (e: React.MouseEvent) => {
      e.stopPropagation(); // Empêcher la propagation du clic
      // Logique de partage à implémenter
    };

    const handleDelete = async (e: React.MouseEvent) => {
      e.stopPropagation(); // Empêcher la propagation du clic
      try {
        // Optimistic UI update
        setDrafts(prev => prev.filter(d => d.id !== draft.id));
        
        // 1. Supprimer d'abord les enregistrements d'audit
        const { error: auditError } = await supabase
          .from('ab_tests_audit')
          .delete()
          .match({ test_id: draft.id });

        if (auditError) throw auditError;

        // 2. Ensuite supprimer le test
        const { error: testError } = await supabase
          .from('ab_tests_summary')
          .delete()
          .match({ id: draft.id });

        if (testError) throw testError;

        toast({
          title: "Success",
          description: "Draft deleted successfully"
        });
      } catch (error: any) {
        console.error('Error deleting draft:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to delete draft",
          variant: "destructive"
        });
        loadRecentDrafts();
      }
    };

    return (
      <div
        onClick={handleClick}
        className={cn(
          "group relative bg-muted/50 hover:bg-muted p-4 rounded-xl transition-all duration-200 cursor-pointer",
          isListView ? "flex items-center justify-between" : "flex flex-col h-full min-h-[160px]"
        )}
      >
        <div 
          className={cn(
            "absolute top-2 right-2 flex gap-1 z-10", // Ajout de z-10
            isListView && "relative top-0 right-0 ml-4"
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleShare}
          >
            <Share2 className="h-3 w-3 text-muted-foreground hover:text-primary" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleDelete}
          >
            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
          </Button>
        </div>

        <div className={cn(
          isListView 
            ? "flex items-center gap-6 flex-1" 
            : "flex-1 space-y-4"
        )}>
          <div className="space-y-2">
            <Badge 
              variant="secondary" 
              className={cn(
                "px-2 py-0.5 text-[10px] font-medium whitespace-nowrap",
                getTypeColor(draft.type)
              )}
            >
              {formatTypeLabel(draft.type) || 'Unknown Type'}
            </Badge>

            <h4 className="text-sm font-medium line-clamp-1">{draft.name}</h4>
          </div>

          {!isListView && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {draft.hypothesis}
            </p>
          )}
        </div>

        <div className={cn(
          "flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap",
          !isListView && "mt-4 pt-4 border-t border-border/10"
        )}>
          <FileText className="h-3 w-3" />
          <span>{formatTimeAgo(draft.created_at!)}</span>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <div className="animate-pulse">Loading drafts...</div>;
  }

  if (!drafts.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Your recent drafts</h3>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={() => {
            setShowAll(!showAll);
            if (!showAll) loadRecentDrafts();
          }}
        >
          {showAll ? "Show less" : "View all"}
          <ChevronRight className={cn(
            "ml-1 h-3 w-3 transition-transform",
            showAll && "rotate-90"
          )} />
        </Button>
      </div>

      <div className={cn(
        !showAll ? "grid grid-cols-3 gap-4" : "space-y-2"
      )}>
        {drafts.map((draft) => (
          <DraftCard 
            key={draft.id} 
            draft={draft}
            isListView={showAll}
          />
        ))}
      </div>
    </div>
  );
} 