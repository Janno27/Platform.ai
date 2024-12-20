import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
	content: [
		"./pages/**/*.{js,ts,jsx,tsx}",
		"./components/**/*.{js,ts,jsx,tsx}",
		"./app/**/*.{js,ts,jsx,tsx}",
	  ],
    theme: {
        extend: {
            colors: {
                // Define the base background color
                background: {
                    DEFAULT: 'hsl(var(--background))',
                    '50': 'hsl(var(--background) / 0.5)',
                    '80': 'hsl(var(--background) / 0.8)',
                    '90': 'hsl(var(--background) / 0.9)',
                    '100': 'hsl(var(--background))',
                },
                foreground: 'hsl(var(--foreground))',
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))'
                },
                backgroundImage: {
                    'grid-light': 'linear-gradient(to right, rgba(0, 0, 100, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 100, 0.05) 1px, transparent 1px)',
                    'grid-dark': 'linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
                },
                backgroundSize: {
                    'grid': '20px 20px',
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))'
                },
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))'
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))'
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))'
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))'
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))'
                },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                chart: {
                    '1': 'hsl(var(--chart-1))',
                    '2': 'hsl(var(--chart-2))',
                    '3': 'hsl(var(--chart-3))',
                    '4': 'hsl(var(--chart-4))',
                    '5': 'hsl(var(--chart-5))'
                },
                sidebar: {
                    DEFAULT: 'hsl(var(--sidebar-background))',
                    foreground: 'hsl(var(--sidebar-foreground))',
                    primary: 'hsl(var(--sidebar-primary))',
                    'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
                    accent: 'hsl(var(--sidebar-accent))',
                    'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
                    border: 'hsl(var(--sidebar-border))',
                    ring: 'hsl(var(--sidebar-ring))'
                },
                tech: {
                    DEFAULT: 'hsl(var(--tech))',
                    foreground: 'hsl(var(--tech-foreground))',
                    background: 'hsl(var(--tech-background))',
                },
                data: {
                    DEFAULT: 'hsl(var(--data))',
                    foreground: 'hsl(var(--data-foreground))',
                    background: 'hsl(var(--data-background))',
                },
                ai: {
                    DEFAULT: 'hsl(var(--ai))',
                    foreground: 'hsl(var(--ai-foreground))',
                    background: 'hsl(var(--ai-background))',
                },
            },
            height: {
                '48': '12rem', // Ajout explicite de la classe h-48
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)'
            },
            keyframes: {
                'accordion-down': {
                    from: {
                        height: '0'
                    },
                    to: {
                        height: 'var(--radix-accordion-content-height)'
                    }
                },
                'accordion-up': {
                    from: {
                        height: 'var(--radix-accordion-content-height)'
                    },
                    to: {
                        height: '0'
                    }
                },
                shine: {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' }
                },
                gradient: {
                    '0%, 100%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' }
                },
                glow: {
                    '0%, 100%': { 
                        filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.8))'
                    },
                    '50%': { 
                        filter: 'drop-shadow(0 0 12px rgba(255,255,255,1))'
                    }
                }
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
                shine: 'shine 1.5s ease-in-out infinite',
                gradient: 'gradient 3s ease-in-out infinite',
                glow: 'glow 1.5s ease-in-out infinite'
            },
            spacing: {
                // Espacements personnalisés
                '2xs': '0.125rem',    // 2px
                'xs': '0.25rem',      // 4px
                'sm': '0.5rem',       // 8px
                'md': '1rem',         // 16px
                'lg': '1.5rem',       // 24px
                'xl': '2rem',         // 32px
                '2xl': '3rem',        // 48px
            },
            gap: {
                // Gaps personnalisés
                '2xs': '0.125rem',
                'xs': '0.25rem',
                'sm': '0.5rem',
                'md': '1rem',
                'lg': '1.5rem',
                'xl': '2rem',
                '2xl': '3rem',
            },
        }
    },
    plugins: [require("tailwindcss-animate")],
};
export default config;