import { ShieldCheck } from 'lucide-react';

export function Logo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <div className="flex items-center justify-center gap-2 group-data-[collapsible=icon]:h-12 group-data-[collapsible=icon]:w-12 group-data-[collapsible=icon]:p-2">
      <ShieldCheck
        className="size-8 transition-all group-data-[collapsible=icon]:size-8"
        strokeWidth={1.5}
      />
      <div className="text-lg font-bold transition-all group-data-[collapsible=icon]:hidden">
        <span className="font-headline">WorkSafe</span>
      </div>
    </div>
  );
}
