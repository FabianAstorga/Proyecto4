import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/format';

type ModuloButtonVariant = 'primary' | 'secondary' | 'inverse' | 'danger';

interface ModuloButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ModuloButtonVariant;
}

const VARIANTS: Record<ModuloButtonVariant, string> = {
  primary:
    'bg-[#003B5C] text-white hover:bg-[#002B45] focus-visible:ring-[#7DD3FC]/50',
  secondary:
    'border border-slate-200 bg-white text-[#003B5C] hover:border-[#0F766E]/40 hover:text-[#0F766E] focus-visible:ring-[#0F766E]/30',
  inverse:
    'bg-white text-[#003B5C] shadow-lg hover:bg-blue-50 focus-visible:ring-white/40',
  danger:
    'border border-red-200 bg-white text-red-600 hover:bg-red-50 focus-visible:ring-red-300/50',
};

export const ModuloButton = ({
  variant = 'primary',
  className,
  type = 'button',
  ...props
}: ModuloButtonProps) => (
  <button
    type={type}
    className={cn(
      'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[10px] font-black uppercase tracking-[0.16em] transition-colors outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50',
      VARIANTS[variant],
      className,
    )}
    {...props}
  />
);
