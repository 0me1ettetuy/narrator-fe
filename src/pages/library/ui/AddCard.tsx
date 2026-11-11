import { useState, type ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

type AddCardProps = {
  title: string;
  hint: string;
  icon: ReactNode;
  onClick: () => void;
  // When set, the card also accepts dropped files.
  onDropFiles?: (files: File[]) => void;
};

// The dashed first tile of a library grid: click it to add something, or drop
// files on it when `onDropFiles` is given.
export function AddCard({
  title,
  hint,
  icon,
  onClick,
  onDropFiles,
}: AddCardProps) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onDragOver={
        onDropFiles
          ? (event) => {
              event.preventDefault();
              setIsDragging(true);
            }
          : undefined
      }
      onDragLeave={onDropFiles ? () => setIsDragging(false) : undefined}
      onDrop={
        onDropFiles
          ? (event) => {
              event.preventDefault();
              setIsDragging(false);
              const files = Array.from(event.dataTransfer.files);

              if (files.length > 0) {
                onDropFiles(files);
              }
            }
          : undefined
      }
      className={cn(
        'flex aspect-[3/4] w-full flex-col items-center justify-center gap-2.5 border-[1.5px] border-dashed border-border bg-transparent p-4 text-center transition-colors hover:border-foreground/35 hover:bg-muted/60',
        isDragging && 'border-foreground/60 bg-muted/60',
      )}
    >
      <span className="flex size-11 items-center justify-center bg-primary text-primary-foreground [&_svg]:size-5">
        {icon}
      </span>
      <span className="text-sm font-semibold">{title}</span>
      <span className="font-serif text-[13px] leading-[1.35] text-muted-foreground">
        {hint}
      </span>
    </button>
  );
}
