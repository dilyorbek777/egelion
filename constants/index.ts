import { dark } from '@clerk/themes';
export const CLERK_APPEARANCE = {
  baseTheme: dark,
  variables: {
    colorPrimary: "oklch(0.508 0.118 165.612)",
    borderRadius: "0.625rem",
  },
  elements: {
    card: "bg-transparent shadow-none border-0",
    formButtonPrimary: "bg-primary text-primary-foreground hover:opacity-90",
    socialButtonsBlockButton: "border border-input hover:bg-accent text-white",
    socialButtonsBlockButtonText: "font-medium",
    footer: "hidden",
  }
}