/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class'],
	content: [
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx}',
	],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px',
			},
		},
		extend: {
			fontFamily: {
				sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'sans-serif'],
			},
			colors: {
				// Brand Colors (Travel Blue)
				primary: {
					50: '#EFF6FF',
					100: '#DBEAFE',
					500: '#2563EB',
					600: '#1D4ED8',
					900: '#1E3A8A',
					DEFAULT: '#2563EB',
					foreground: '#FFFFFF',
				},
				// Neutral Colors
				neutral: {
					50: '#F8F9FA',
					100: '#F0F4F8',
					200: '#E3E8EF',
					500: '#6B7280',
					700: '#374151',
					900: '#1F2937',
				},
				// Semantic Colors
				success: '#10B981',
				warning: '#F59E0B',
				error: '#EF4444',
				info: '#3B82F6',
				// Glass Colors
				glass: {
					standard: 'rgba(255, 255, 255, 0.4)',
					light: 'rgba(255, 255, 255, 0.15)',
					dark: 'rgba(30, 30, 30, 0.5)',
					border: 'rgba(255, 255, 255, 0.3)',
				},
				// Legacy shadcn colors
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))',
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
				},
			},
			// Spacing System (8pt Grid)
			spacing: {
				xs: '8px',
				sm: '12px',
				md: '16px',
				lg: '24px',
				xl: '32px',
				'2xl': '48px',
				'3xl': '64px',
				'4xl': '96px',
				'5xl': '128px',
			},
			// Border Radius System
			borderRadius: {
				sm: '8px',
				md: '12px',
				lg: '16px',
				xl: '20px',
				'2xl': '24px',
				'3xl': '32px',
				full: '9999px',
			},
			// Box Shadow System
			boxShadow: {
				sm: '0 4px 16px rgba(0, 0, 0, 0.06)',
				card: '0 8px 32px rgba(0, 0, 0, 0.08)',
				'card-hover': '0 12px 40px rgba(0, 0, 0, 0.12)',
				modal: '0 20px 60px rgba(0, 0, 0, 0.15)',
				glow: '0 0 20px rgba(37, 99, 235, 0.3)',
				inset: 'inset 0 1px 2px rgba(255, 255, 255, 0.3)',
			},
			// Backdrop Filter
			backdropFilter: {
				glass: 'blur(20px) saturate(150%)',
				'strong-glass': 'blur(40px) saturate(150%)',
				'subtle-glass': 'blur(10px) saturate(160%)',
				'dark-glass': 'blur(30px) saturate(150%)',
			},
			// Animation Duration
			transitionDuration: {
				fast: '200ms',
				standard: '300ms',
				smooth: '400ms',
				luxury: '600ms',
			},
			// Animation Timing
			transitionTimingFunction: {
				smooth: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
			},
			// Keyframes
			keyframes: {
				'accordion-down': {
					from: { height: 0 },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: 0 },
				},
				'shimmer': {
					'0%': { backgroundPosition: '200% 0' },
					'100%': { backgroundPosition: '-200% 0' },
				},
				'dot-bounce': {
					'0%, 80%, 100%': { transform: 'scale(0)' },
					'40%': { transform: 'scale(1)' },
				},
				'typing': {
					from: { width: '0' },
					to: { width: '100%' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'shimmer': 'shimmer 1.5s infinite',
				'dot-bounce': 'dot-bounce 1.4s infinite ease-in-out',
				'typing': 'typing 2s steps(40, end)',
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
}
