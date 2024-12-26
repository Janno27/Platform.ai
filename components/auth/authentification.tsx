"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuthService } from '@/lib/services/auth-service';
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, CheckCircle2 } from "lucide-react"

// Animation variants
const tabVariants = {
  enter: { y: 10, opacity: 0 },
  center: { y: 0, opacity: 1 },
  exit: { y: -10, opacity: 0 },
};

type AuthStep = 'email' | 'login' | 'signup';
interface FormData {
  email: string
  password: string
  name: string
  organizationName: string
  hasOrganization: boolean
  isOrganizationValidated: boolean
}

export const AuthForm = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<AuthStep>('email');
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    name: '',
    organizationName: '',
    hasOrganization: false,
    isOrganizationValidated: false
  })
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const [orgSuggestions, setOrgSuggestions] = useState<string[]>([])
  const [showOrgSuggestions, setShowOrgSuggestions] = useState(false)

  // Gestion de la position de la souris
  const handleMouseMove = (e: React.MouseEvent) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) return;

    try {
      setIsLoading(true);
      await checkEmailExists(formData.email);
    } catch (err) {
      toast.error("Error", {
        description: "An error occurred while checking your email. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkEmailExists = async (email: string) => {
    try {
      setIsLoading(true);

      // Vérifier d'abord dans profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          // Email n'existe pas
          setCurrentStep('signup');
          toast("Account Creation", {
            description: "This email is not registered. Let's create your account!",
          });
        } else {
          throw profileError;
        }
      } else {
        // Email existe
        setCurrentStep('login');
      }
    } catch (err: any) {
      if (err.code === 'PGRST116') {
        setCurrentStep('signup');
        toast("Account Creation", {
          description: "This email is not registered. Let's create your account!",
        });
      } else {
        toast.error("Verification Failed", {
          description: "Unable to verify email. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (currentStep === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (signInError) throw signInError;

        toast.success("Welcome back!", {
          description: "Successfully signed in to your account.",
        });
        router.push('/overview');
      } else {
        await AuthService.signUp({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          organizationName: formData.organizationName
        });
        
        toast.success("Account Created", {
          description: "Please check your email to verify your account.",
          action: {
            label: "Resend Email",
            onClick: () => AuthService.resendVerificationEmail(formData.email),
          },
        });
        setCurrentStep('login');
      }
    } catch (err: any) {
      toast.error("Authentication Error", {
        description: err.message || "An error occurred during authentication.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrgSuggestions = async (query: string) => {
    if (query.length < 2) {
      setOrgSuggestions([])
      return
    }
  
    try {
      const { data: orgs, error } = await supabase
        .from('organizations')
        .select('name')
        .ilike('name', `%${query}%`)
        .limit(5)
  
      if (error) {
        console.error('Error fetching organizations:', error)
        setOrgSuggestions([])
        return
      }
  
      // S'assurer que orgs est un tableau et que chaque élément a une propriété name
      const validSuggestions = Array.isArray(orgs) ? orgs.map(org => org.name).filter(Boolean) : []
      setOrgSuggestions(validSuggestions)
    } catch (error) {
      console.error('Error fetching organizations:', error)
      setOrgSuggestions([])
    }
  }
  const checkSimilarOrganizations = async (name: string): Promise<string[]> => {
    const { data: orgs } = await supabase
      .from('organizations')
      .select('name')
      .or(`name.ilike.%${name}%,name.ilike.${name.replace(/\s+/g, '%')}%`)
      .limit(5)
  
    return (orgs || []).map(org => org.name)
  }

  const renderForm = () => {
    switch (currentStep) {
      case 'email':
        return (
          <form onSubmit={handleEmailSubmit} className="space-y-4 p-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                autoFocus
              />
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Checking...' : 'Continue'}
            </Button>
          </form>
        );

      case 'login':
        return (
          <form onSubmit={handleSubmit} className="space-y-4 p-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                autoFocus
              />
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full mt-2"
              onClick={() => setCurrentStep('email')}
            >
              Use a different email
            </Button>
          </form>
        );

      case 'signup':
        return (
          <form onSubmit={handleSubmit} className="space-y-4 p-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="hasOrganization" className="text-sm text-muted-foreground">
                  I have a company
                </Label>
                <Switch
                  id="hasOrganization"
                  checked={formData.hasOrganization}
                  onCheckedChange={(checked) => {
                    setFormData(prev => ({
                      ...prev,
                      hasOrganization: checked,
                      organizationName: '',
                      isOrganizationValidated: false
                    }))
                  }}
                />
              </div>

              {formData.hasOrganization && (
                <div className="space-y-2">
                  <Label htmlFor="organization">Company Name</Label>
                  <div className="relative">
                    <Input
                      id="organization"
                      value={formData.organizationName}
                      onChange={async (e) => {
                        const value = e.target.value
                        setFormData(prev => ({
                          ...prev,
                          organizationName: value,
                          isOrganizationValidated: false
                        }))
                        
                        if (value.length >= 2) {
                          const similarOrgs = await checkSimilarOrganizations(value)
                          setOrgSuggestions(similarOrgs)
                          setShowOrgSuggestions(similarOrgs.length > 0)
                        } else {
                          setOrgSuggestions([])
                          setShowOrgSuggestions(false)
                        }
                      }}
                      placeholder="Enter your company name"
                      className="pr-10"
                    />
                    {formData.organizationName && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          isOrganizationValidated: true
                        }))}
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                      >
                        <CheckCircle2
                          className={cn(
                            "h-6 w-6 transition-colors",
                            formData.isOrganizationValidated
                              ? "text-green-500"
                              : "text-muted-foreground/40 hover:text-muted-foreground"
                          )}
                        />
                      </button>
                    )}
                  </div>
                  {showOrgSuggestions && (
                    <div className="mt-1 rounded-md border bg-popover p-1 text-sm">
                      <p className="px-2 py-1 text-xs text-muted-foreground">
                        Similar companies found:
                      </p>
                      {orgSuggestions.map((org) => (
                        <button
                          key={org}
                          className="w-full px-2 py-1 text-left hover:bg-accent rounded-sm"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              organizationName: org,
                              isOrganizationValidated: true
                            }))
                            setShowOrgSuggestions(false)
                          }}
                        >
                          {org}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading || (formData.hasOrganization && !formData.isOrganizationValidated)}
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full mt-2"
              onClick={() => setCurrentStep('email')}
            >
              Use a different email
            </Button>
          </form>
        );
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Colonne gauche - Formulaire */}
      <div className="relative flex flex-col items-center justify-between py-8">
        {/* Logo simplifié */}
        <div className="mb-12">
          <span className="text-xl font-bold tracking-tight text-gray-600">
            Platform.ai
          </span>
        </div>

        {/* Contenu principal */}
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-4 text-center">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#1e1b4b]/20 via-purple-500/10 to-gray-600/20 rounded-lg blur-lg" />
              <h1 className="relative text-4xl font-bold tracking-tighter bg-gradient-to-r from-[#1e1b4b] via-gray-800 to-gray-600 bg-clip-text text-transparent">
                Your ideas, amplified
              </h1>
            </div>
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#1e1b4b]/10 via-purple-500/5 to-gray-600/10 rounded-lg blur-lg" />
              <p className="relative text-lg font-light bg-gradient-to-r from-[#1e1b4b]/80 via-gray-700 to-gray-500 bg-clip-text text-transparent">
                Privacy-first AI that helps you create in confidence.
              </p>
            </div>
          </div>

          <div 
            ref={cardRef}
            onMouseMove={handleMouseMove}
            className="relative"
          >
            <div
              className="absolute -inset-0.5 bg-gradient-to-r from-[#1e1b4b]/70 via-purple-500/30 to-gray-600/50 rounded-xl blur-sm opacity-50 transition duration-500"
              style={{
                maskImage: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, black, transparent 250px)`,
                WebkitMaskImage: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, black, transparent 250px)`
              }}
            />
            <div
              className="absolute -inset-0.5 bg-gradient-to-r from-[#1e1b4b] to-purple-500/50 rounded-xl blur-[2px] opacity-20 animate-pulse"
            />
            <Card className="relative backdrop-blur-sm border border-purple-200/10 dark:border-purple-800/10 shadow-lg hover:shadow-xl transition-all duration-300">
              {renderForm()}
            </Card>
          </div>

          {/* CTA simplifié */}
          <div className="text-center space-y-4">
            <p className="text-sm text-gray-500">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>

        {/* Learn More CTA - Version simplifiée */}
        <div className="mt-12">
          <Button
            variant="ghost"
            size="sm"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 group transition-colors duration-300"
          >
            Learn More
            <ArrowDown className="h-3 w-3 transition-transform duration-300 group-hover:translate-y-0.5" />
          </Button>
        </div>
      </div>

      {/* Colonne droite - Preview avec nouveau design */}
      <div className="hidden lg:block relative overflow-hidden bg-gradient-to-br from-slate-900 via-[#1e1b4b] to-indigo-950 rounded-3xl my-4 mx-4">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:16px]" />
        <div className="absolute h-full w-full bg-gradient-to-t from-black/80 via-transparent" />
        <div className="relative z-20 flex h-full flex-col justify-between p-12">
          <div className="flex items-center text-lg font-medium text-white">
            <span className="font-mono">AB Test Analyzer</span>
          </div>

          <blockquote className="space-y-4">
            <p className="text-xl font-light leading-relaxed text-white/90">
              "This platform has revolutionized how we handle our A/B tests. The analytics and insights are invaluable."
            </p>
            <footer className="text-sm font-medium text-white/70">
              Sofia Davis
            </footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;