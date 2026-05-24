interface SectionHeaderProps {
  title: string;
  subtitle: string;
}

export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <div className="border-b border-border/50 pb-4">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {subtitle}
      </p>
    </div>
  );
}
