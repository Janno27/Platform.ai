export const EXPERIMENT_PARAMETERS = {
  SECTION_TITLE: "COUNTRIES",
  STATUS_OPTIONS: [
    { label: "To be prioritized", value: "to_prioritize" },
    { label: "In progress", value: "in_progress" },
    { label: "Done", value: "done" },
  ],
  MIN_EXPERIMENT_DAYS: 30,
} as const;

// Nouvelles couleurs plus vives et modernes pour les variations
export const VARIATION_COLORS = {
  primary: "hsl(243, 75%, 59%)", // Violet vif
  secondary: "hsl(162, 73%, 46%)", // Vert menthe
  accent: "hsl(326, 100%, 74%)", // Rose vif
  yellow: "hsl(31, 95%, 64%)",  // Orange pastel
  blue: "hsl(190, 90%, 50%)",   // Bleu électrique
  control: "hsl(230, 15%, 50%)" // Gris neutre
} as const;

// Fonction pour obtenir la couleur d'une variation
export const getVariationColor = (variation: string, control: string, index: number = 0): string => {
  // Si c'est le contrôle, retourner la couleur de contrôle
  if (variation === control) {
    return VARIATION_COLORS.control;
  }

  // Liste des couleurs disponibles (sans la couleur de contrôle)
  const colors = [
    VARIATION_COLORS.primary,
    VARIATION_COLORS.secondary,
    VARIATION_COLORS.accent,
    VARIATION_COLORS.yellow,
    VARIATION_COLORS.blue
  ];

  // Retourner une couleur basée sur l'index
  return colors[index % colors.length];
};

// Fonction pour formater le nom de la variation
export const formatVariationName = (variation: string): string => {
  // Si c'est le contrôle, retourner "Control"
  if (variation.toLowerCase().includes('control')) {
    return 'Control';
  }
  
  // Chercher différents patterns pour les variations
  const patterns = [
    /\[.*\]\s*Variation\s*(\d+)/,  // [1630345] Variation 1
    /var(\d+)/i,                   // var1
    /variation\s*(\d+)/i,          // variation1
    /var_(\d+)/i,                  // var_1
    /v(\d+)/i                      // v1
  ];

  for (const pattern of patterns) {
    const match = variation.match(pattern);
    if (match) {
      return `Var ${match[1]}`;
    }
  }
  
  // Si aucun pattern ne correspond, essayer d'extraire juste le dernier nombre
  const numberMatch = variation.match(/(\d+)/);
  if (numberMatch) {
    return `Var ${numberMatch[1]}`;
  }
  
  // Fallback au cas où
  return variation;
};

// Fonction pour obtenir la couleur de l'uplift
export const getUpliftColor = (uplift: number): string => {
  if (uplift > 0) return "text-green-500";
  if (uplift < 0) return "text-red-500";
  return "text-muted-foreground";
};

// Fonction pour obtenir le niveau de confiance
export const getConfidenceLevel = (confidence: number): { label: string, color: string } => {
  if (confidence >= 95) {
    return { label: 'Statistically Significant', color: 'text-green-500' };
  }
  if (confidence >= 90) {
    return { label: 'Partially Significant', color: 'text-yellow-500' };
  }
  return { label: 'Not Significant', color: 'text-muted-foreground' };
};