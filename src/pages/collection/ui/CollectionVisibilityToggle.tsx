import { GlobeIcon, LockIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';

// Flips the collection between public and private in the page's draft; nothing
// is sent until the island's Save changes. Going public is blocked while a book
// that would be published is still being processed.
export function CollectionVisibilityToggle({
  isPublic,
  isBlocked,
  onToggle,
}: {
  isPublic: boolean;
  isBlocked: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={!isPublic && isBlocked}
      title={!isPublic && isBlocked ? t('collection.notReadyHint') : undefined}
      onClick={onToggle}
    >
      {isPublic ? (
        <LockIcon aria-hidden="true" />
      ) : (
        <GlobeIcon aria-hidden="true" />
      )}
      {isPublic ? t('collection.makePrivate') : t('collection.makePublic')}
    </Button>
  );
}
