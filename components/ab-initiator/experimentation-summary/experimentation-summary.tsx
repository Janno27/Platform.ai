"use client";

import { useState, useRef } from 'react';
import { format } from "date-fns";
import { PencilIcon, ImageIcon, Smartphone, Monitor, Palette, Trash2, Link, CalendarIcon, PlusCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { EXPERIMENT_PARAMETERS } from "@/lib/constants";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Roadmap } from "./roadmap";
import { ExpectedResults } from "./expected-results";
import { DrawOverlay } from "./draw-overlay";

const TEST_TYPES = [
  { label: "A/B Test", value: "ab_test" },
  { label: "Personalization", value: "personalization" },
  { label: "Patch", value: "patch" }
] as const;

type TestType = typeof TEST_TYPES[number]['value'];

interface Variation {
  id: string;
  desktopImage?: string;
  mobileImage?: string;
  description: string;
}

interface DescriptionEditState {
  [key: string]: boolean;
}

interface CountryRoadmap {
  id: string;
  countryCode: string;
  startDate?: Date;
}

export function ExperimentationSummary() {
  const [testName] = useState("Homepage Optimization Test");
  const [selectedType, setSelectedType] = useState<TestType>("ab_test");
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile' | 'draw'>('desktop');
  const [isEditingHypothesis, setIsEditingHypothesis] = useState(false);
  const [isEditingContext, setIsEditingContext] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState<DescriptionEditState>({});
  const [hypothesisValue, setHypothesisValue] = useState(
    "Simplifying the checkout process with autofill capabilities will reduce cart abandonment by 15%."
  );
  const [contextValue, setContextValue] = useState(
    "Current checkout process shows a high drop-off rate at the shipping information step, with users taking an average of 3 minutes to complete the form."
  );
  const [startDate, setStartDate] = useState<Date>();
  const [variations, setVariations] = useState<Variation[]>([
    { id: 'control', description: 'Original version control description...' },
    { id: 'var1', description: 'First variation description...' }
  ]);
  const [isEditingRoadmap, setIsEditingRoadmap] = useState(false);
  const [roadmaps, setRoadmaps] = useState<CountryRoadmap[]>([
    { id: '1', countryCode: 'FR' }
  ]);
  const [isDrawMode, setIsDrawMode] = useState(false);

  const handleImageUpload = (variationId: string, event: React.ChangeEvent<HTMLInputElement>, imageType: 'desktop' | 'mobile') => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target?.result) {
          if (variationId === 'new') {
            const newVarId = `var${variations.length}`;
            setVariations(prev => [...prev, {
              id: newVarId,
              [imageType === 'desktop' ? 'desktopImage' : 'mobileImage']: e.target!.result as string,
              description: `New variation ${variations.length} description...`
            }]);
          } else {
            setVariations(prevVariations => 
              prevVariations.map(variation => 
                variation.id === variationId
                  ? { 
                      ...variation, 
                      [imageType === 'desktop' ? 'desktopImage' : 'mobileImage']: e.target!.result as string 
                    }
                  : variation
              )
            );
          }
        }
      };
      
      reader.readAsDataURL(file);
    }
  };

  const removeVariation = (variationId: string) => {
    if (variationId !== 'control' && variationId !== 'var1') {
      setVariations(prev => prev.filter(v => v.id !== variationId));
    }
  };

  const removeImage = (variationId: string, imageType: 'desktop' | 'mobile') => {
    setVariations(prevVariations => 
      prevVariations.map(variation => 
        variation.id === variationId
          ? { 
              ...variation, 
              [imageType === 'desktop' ? 'desktopImage' : 'mobileImage']: undefined 
            }
          : variation
      )
    );
  };

  const toggleDescriptionEdit = (variationId: string) => {
    setIsEditingDescription(prev => ({
      ...prev,
      [variationId]: !prev[variationId]
    }));
  };

  const addNewRoadmap = () => {
    setRoadmaps(prev => [
      ...prev,
      { 
        id: Date.now().toString(),
        countryCode: 'FR',
      }
    ]);
  };

  const handleRoadmapDateChange = (roadmapId: string, date: Date | undefined) => {
    setRoadmaps(prev => prev.map(roadmap => 
      roadmap.id === roadmapId 
        ? { ...roadmap, startDate: date }
        : roadmap
    ));
  };

  const removeRoadmap = (roadmapId: string) => {
    console.log('Removing roadmap:', roadmapId);
    if (roadmaps.length > 1) {
      setRoadmaps(prevRoadmaps => {
        console.log('Previous roadmaps:', prevRoadmaps);
        const updated = prevRoadmaps.filter(roadmap => roadmap.id !== roadmapId);
        console.log('Updated roadmaps:', updated);
        return updated;
      });
    }
  };

  const handleDrawingSave = (variationId: string, newImageData: string) => {
    setVariations(prevVariations => 
      prevVariations.map(variation => {
        if (variation.id === variationId) {
          return {
            ...variation,
            [viewMode === 'mobile' ? 'mobileImage' : 'desktopImage']: newImageData
          };
        }
        return variation;
      })
    );
  };

  return (
    <ScrollArea className="h-full px-8">
      <div className="space-y-8 pb-8">
        {/* En-tête */}
        <div className="grid grid-cols-2">
          {/* Colonne gauche de l'en-tête */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Select value={selectedType} onValueChange={(value: TestType) => setSelectedType(value)}>
                <SelectTrigger className="w-[180px] rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEST_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Badge variant="secondary" className="rounded-full px-4 py-1">
                To be prioritized
              </Badge>
            </div>
  
            <h2 className="text-2xl font-semibold tracking-tight">{testName}</h2>
          </div>
  
          {/* Outils alignés à droite */}
          <div className="flex justify-end">
            <div className="flex items-center gap-2">
              {['desktop', 'mobile', 'draw'].map((mode) => (
                <Button
                  key={mode}
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (mode === 'draw') {
                      setIsDrawMode(true);
                    } else {
                      setViewMode(mode as 'desktop' | 'mobile' | 'draw');
                    }
                  }}
                  className={cn(
                    "rounded-full transition-all focus-visible:ring-0 hover:bg-transparent",
                    (viewMode === mode || (mode === 'draw' && isDrawMode)) && "animate-glow"
                  )}
                >
                  {mode === 'desktop' && <Monitor className={cn("h-4 w-4", viewMode === mode ? "text-foreground" : "text-muted-foreground")} />}
                  {mode === 'mobile' && <Smartphone className={cn("h-4 w-4", viewMode === mode ? "text-foreground" : "text-muted-foreground")} />}
                  {mode === 'draw' && <Palette className={cn("h-4 w-4", isDrawMode ? "text-foreground" : "text-muted-foreground")} />}
                </Button>
              ))}
            </div>
          </div>
        </div>
  
        {/* Corps principal */}
        <div style={{ gap: '5px' }} className="grid grid-cols-2">
          {/* Colonne gauche */}
          <div className="space-y-8 pr-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Hypothesis</label>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 hover:bg-muted/50"
                  onClick={() => setIsEditingHypothesis(!isEditingHypothesis)}
                >
                  <PencilIcon className="h-3 w-3 text-muted-foreground" />
                </Button>
              </div>
              {isEditingHypothesis ? (
                <Textarea
                  value={hypothesisValue}
                  onChange={(e) => setHypothesisValue(e.target.value)}
                  placeholder="If we [make this change] for [these users], then [this metric] will [increase/decrease] by [this amount]"
                  className="min-h-[100px] text-xs text-muted-foreground bg-muted/50 resize-none"
                />
              ) : (
                <div className="text-xs whitespace-pre-wrap break-words">
                  {hypothesisValue}
                </div>
              )}
            </div>
  
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Context</label>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 hover:bg-muted/50"
                  onClick={() => setIsEditingContext(!isEditingContext)}
                >
                  <PencilIcon className="h-3 w-3 text-muted-foreground" />
                </Button>
              </div>
              {isEditingContext ? (
                <Textarea
                  value={contextValue}
                  onChange={(e) => setContextValue(e.target.value)}
                  placeholder="Describe the current situation, problems, and opportunity..."
                  className="min-h-[100px] text-xs text-muted-foreground bg-muted/50 resize-none"
                />
              ) : (
                <div className="text-xs whitespace-pre-wrap break-words">
                  {contextValue}
                </div>
              )}
            </div>
  
            {/* Roadmaps */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Roadmap</label>
                </div>
                <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[10px]">
                  To be prioritized
                </Badge>
              </div>

              <div className="space-y-4">
                {roadmaps.map((roadmap) => (
                  <Roadmap
                    key={roadmap.id}
                    startDate={roadmap.startDate}
                    onStartDateSelect={(date) => handleRoadmapDateChange(roadmap.id, date)}
                    isEditing={isEditingRoadmap}
                    onEditToggle={() => setIsEditingRoadmap(!isEditingRoadmap)}
                    countryCode={roadmap.countryCode}
                    onRemove={() => removeRoadmap(roadmap.id)}
                    canRemove={roadmaps.length > 1}
                  />
                ))}
                
                {/* Add Country Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addNewRoadmap}
                  className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 hover:bg-transparent hover:animate-glow border-none"
                >
                  <PlusCircle className="h-3 w-3" />
                  Add country
                </Button>
              </div>
            </div>

            {/* Expected Results Section */}
            <ExpectedResults />
          </div>
  
          {/* Colonne droite - Variations */}
          <div className="space-y-8">
            {/* Section Preview */}
            <div className="space-y-6">
              <h3 className="text-xs font-medium text-muted-foreground">Preview variations</h3>
              
              <div className={cn(
                "flex",
                viewMode === 'mobile' 
                  ? "flex-row flex-nowrap overflow-x-auto gap-4 pb-4"
                  : "flex-col gap-6 max-h-[800px] overflow-y-auto pr-4"
              )}>
                {variations.map((variation, index) => (
                  <div key={variation.id} 
                    className={cn(
                      viewMode === 'mobile' 
                        ? "flex-shrink-0 w-[280px]" 
                        : "w-full"
                    )}
                  >
                    <h4 className={cn(
                      "text-xs font-medium text-muted-foreground mb-2",
                      viewMode === 'mobile' ? "text-center" : "text-left"
                    )}>
                      {variation.id === 'control' ? 'Control' : `Variation ${index}`}
                    </h4>
                    <div className={cn(
                      "relative overflow-hidden rounded-lg border border-border/20 hover:border-border/40 transition-colors group",
                      viewMode === 'mobile' 
                        ? "h-[400px]"
                        : "h-[200px]"
                    )}
                    style={{
                      height: viewMode === 'mobile' ? '400px' : '200px'
                    }}>
                      {/* Bouton de suppression toujours visible pour les variations > 1 */}
                      {index > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 left-2 z-10 bg-background/80 hover:bg-background/90"
                          onClick={() => removeVariation(variation.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}

                      {viewMode === 'mobile' ? (
                        variation.mobileImage ? (
                          <div className="relative h-full">
                            <img
                              src={variation.mobileImage}
                              alt={`${variation.id === 'control' ? 'Control' : `Variation ${index}`} (Mobile)`}
                              className="w-full h-full object-cover"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80"
                              onClick={() => removeImage(variation.id, 'mobile')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="relative h-full">
                            <label 
                              htmlFor={`${viewMode}-upload-${variation.id}`}
                              className="cursor-pointer flex flex-col items-center justify-center w-full h-full hover:bg-muted/50 transition-colors bg-muted/10 border-2 border-dashed border-muted-foreground/20"
                            >
                              <input
                                type="file"
                                id={`${viewMode}-upload-${variation.id}`}
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(variation.id, e, viewMode)}
                              />
                              <div className="flex flex-col items-center gap-2">
                                <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                                <span className="text-xs text-muted-foreground">Click to upload image</span>
                              </div>
                            </label>
                          </div>
                        )
                      ) : (
                        variation.desktopImage ? (
                          <div className="relative h-full">
                            <img
                              src={variation.desktopImage}
                              alt={`${variation.id === 'control' ? 'Control' : `Variation ${index}`} (Desktop)`}
                              className="w-full h-full object-cover"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80"
                              onClick={() => removeImage(variation.id, 'desktop')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="relative h-full">
                            <label 
                              htmlFor={`${viewMode}-upload-${variation.id}`}
                              className="cursor-pointer flex flex-col items-center justify-center w-full h-full hover:bg-muted/50 transition-colors bg-muted/10 border-2 border-dashed border-muted-foreground/20"
                            >
                              <input
                                type="file"
                                id={`${viewMode}-upload-${variation.id}`}
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(variation.id, e, viewMode)}
                              />
                              <div className="flex flex-col items-center gap-2">
                                <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                                <span className="text-xs text-muted-foreground">Click to upload image</span>
                              </div>
                            </label>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Variation Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newVarId = `var${variations.length}`;
                  setVariations(prev => [...prev, {
                    id: newVarId,
                    description: `New variation ${variations.length} description...`
                  }]);
                }}
                className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 hover:bg-transparent hover:animate-glow border-none"
              >
                <PlusCircle className="h-3 w-3" />
                Add variation
              </Button>
            </div>
  
            {/* Section Description */}
            <div className="space-y-6">
              <h4 className="text-sm font-medium">Description</h4>
              <div className="space-y-4">
                {variations.map((variation, index) => (
                  <div key={variation.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-muted-foreground">
                        {variation.id === 'control' ? 'Control' : `Variation ${index}`}
                      </label>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 hover:bg-muted/50"
                        onClick={() => toggleDescriptionEdit(variation.id)}
                      >
                        <PencilIcon className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                    {isEditingDescription[variation.id] ? (
                      <Textarea
                        value={variation.description}
                        onChange={(e) => setVariations(prevVariations =>
                          prevVariations.map(v =>
                            v.id === variation.id
                              ? { ...v, description: e.target.value }
                              : v
                          )
                        )}
                        placeholder={variation.id === 'control' ? 
                          "Describe the current control version..." : 
                          "Describe the changes in this variation..."
                        }
                        className="text-xs text-muted-foreground bg-muted/50 resize-none min-h-[80px]"
                      />
                    ) : (
                      <div className="text-xs whitespace-pre-wrap break-words">
                        {variation.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <DrawOverlay
        variations={variations}
        isOpen={isDrawMode}
        onClose={() => setIsDrawMode(false)}
        viewMode={viewMode}
        onSave={handleDrawingSave}
      />
    </ScrollArea>
  );
}