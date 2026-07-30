export const designTokenClassNames = {
  elevation: {
    level1: "shadow-level-1",
    level2: "shadow-level-2",
  },
  radius: {
    control: "rounded",
    largeContainer: "rounded-lg",
    pill: "rounded-full",
  },
  typography: {
    body: "font-sans",
    heading: "font-heading",
  },
} as const;

export const leafItemStatusTokens = {
  critical: "status-critical",
  warning: "status-warning",
  recent: "status-recent",
} as const;

export const systemStatusTokens = {
  neutral: "outline",
  success: "status-success",
} as const;

export type LeafItemStatusTone = keyof typeof leafItemStatusTokens;
export type SystemStatusTone = keyof typeof systemStatusTokens;
