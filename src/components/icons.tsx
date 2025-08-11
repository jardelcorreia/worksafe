import { ShieldCheck } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';


const logoVariants = cva(
    'flex items-center justify-center gap-2',
    {
      variants: {
        size: {
          default: 'group-data-[collapsible=icon]:h-12 group-data-[collapsible=icon]:w-12 group-data-[collapsible=icon]:p-2',
          large: 'flex-col gap-4',
        },
      },
      defaultVariants: {
        size: 'default',
      },
    }
  );

const iconVariants = cva(
    'transition-all',
    {
        variants: {
            size: {
                default: 'size-12 group-data-[collapsible=icon]:size-8',
                large: 'size-20',
            }
        },
        defaultVariants: {
            size: 'default'
        }
    }
);

const textVariants = cva(
    'font-bold transition-all group-data-[collapsible=icon]:hidden',
    {
        variants: {
            size: {
                default: 'text-3xl',
                large: 'text-5xl mt-2 tracking-tight'
            }
        },
        defaultVariants: {
            size: 'default'
        }
    }
)
  
export interface LogoProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof logoVariants>,
    VariantProps<typeof iconVariants>,
    VariantProps<typeof textVariants> {}


export function Logo({className, size}: LogoProps) {
  return (
    <div className={cn(logoVariants({ size, className }))}>
      <ShieldCheck
        className={cn(iconVariants({ size }))}
        strokeWidth={1.5}
      />
      <div className={cn(textVariants({ size }))}>
        <span className="font-headline">WorkSafe</span>
      </div>
    </div>
  );
}
