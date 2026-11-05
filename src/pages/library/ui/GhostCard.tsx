import { LoaderCircleIcon, LockIcon, Trash2Icon } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import { useTranslation } from 'react-i18next';

type GhostCardProps = {
  title: string;
  description: string;
  removeLabel: string;
  isRemoving: boolean;
  onRemove: () => void;
};

// A reference to an item its owner made private. It has no cover and no link,
// because the target is not readable to this user.
export function GhostCard({
  title,
  description,
  removeLabel,
  isRemoving,
  onRemove,
}: GhostCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="h-full gap-0 border-dashed py-0 opacity-80">
      <div
        className="flex aspect-[16/9] items-center justify-center bg-muted text-muted-foreground"
        aria-hidden="true"
      >
        <LockIcon className="size-8" />
      </div>
      <CardHeader className="pt-4">
        <CardTitle className="truncate" title={title}>
          {title}
        </CardTitle>
        <CardAction>
          <Badge variant="secondary">{t('collection.ghostBadge')}</Badge>
        </CardAction>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-3 pb-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isRemoving}
          onClick={onRemove}
        >
          {isRemoving ? (
            <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
          ) : (
            <Trash2Icon aria-hidden="true" />
          )}
          {removeLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
