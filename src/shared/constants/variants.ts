import { History, Wrench, Sparkles, Cross } from "lucide-react";

export const VARIANTS = [
  'legacy',
  'dev',
  'beta',
  'respawned'
] as const;

export type Variant = typeof VARIANTS[number];

export const VARIANT_STYLES: Record<Variant, string> = {
  legacy: 'bg-yellow-300',
  dev: 'bg-purple-300',
  beta: 'bg-blue-300',
  respawned: 'bg-green-300',
} as const;

export const VARIANT_ICONS: Record<Variant, any> = {
  legacy: History,
  dev: Wrench,
  beta: Sparkles,
  respawned: Cross
};