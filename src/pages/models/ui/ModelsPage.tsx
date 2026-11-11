import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AudioLinesIcon,
  CheckCircle2Icon,
  CircleAlertIcon,
  CpuIcon,
  KeyRoundIcon,
  LoaderCircleIcon,
} from 'lucide-react';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getApiErrorTranslationKey,
  ttsModelsControllerListModelsOptions,
  ttsModelsControllerListModelsQueryKey,
  ttsModelsControllerSelectModelMutation,
  type FishCredentialResponseDto,
  type TtsModelGroupResponseDto,
  type TtsModelResponseDto,
  type TtsModelsResponseDto,
} from '@/shared/api';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
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
import { DataState } from '@/shared/ui/data-state';
import { cn } from '@/shared/lib/utils';
import { Skeleton } from '@/shared/ui/skeleton';
import { FishCredentialForm } from './FishCredentialForm';
import { FishVoiceManager } from './FishVoiceManager';

export function ModelsPage() {
  const modelsQuery = useQuery(ttsModelsControllerListModelsOptions());

  return (
    <section className="mx-auto max-w-6xl px-4 pt-4 pb-6 sm:px-6 sm:pt-6 sm:pb-10">
      <DataState
        query={modelsQuery}
        isEmpty={() => false}
        loading={<ModelsPageSkeleton />}
      >
        {(models) => <ModelsContent models={models} />}
      </DataState>
    </section>
  );
}

function ModelsContent({ models }: { models: TtsModelsResponseDto }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const selectModel = useMutation({
    ...ttsModelsControllerSelectModelMutation(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ttsModelsControllerListModelsQueryKey(),
      });
    },
  });
  const localGroup = findGroup(models, 'local');
  const fishGroup = findGroup(models, 'fish-audio');
  const fishCredential =
    models.providers.find((provider) => provider.id === 'fish-audio') ??
    FALLBACK_FISH_CREDENTIAL;
  const isFishModelSelected =
    fishGroup?.models.some((model) => model.id === models.selectedModelId) ??
    false;

  return (
    <div className="space-y-10">
      <header className="flex max-w-[620px] flex-col gap-3.5">
        <h1 className="font-heading text-4xl leading-none font-medium tracking-[-0.03em] sm:text-[56px]">
          {t('models.pageTitle')}
        </h1>
        <p className="font-serif text-base text-muted-foreground">
          {t('models.pageIntro')}
        </p>
      </header>
      {selectModel.error && (
        <Alert variant="destructive">
          <CircleAlertIcon aria-hidden="true" />
          <AlertTitle>{t('models.selectionFailed')}</AlertTitle>
          <AlertDescription>
            {t(getApiErrorTranslationKey(selectModel.error))}
          </AlertDescription>
        </Alert>
      )}

      <section aria-labelledby="fish-audio-title">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 id="fish-audio-title" className={SECTION_TITLE}>
              {t('models.fishTitle')}
            </h2>
            <p className={SECTION_HINT}>{t('models.fishDescription')}</p>
          </div>
          {fishCredential.credentialState === 'VALID' && (
            <Badge variant="brand">
              <CheckCircle2Icon aria-hidden="true" />
              {t('models.connected')}
            </Badge>
          )}
        </div>

        {fishCredential.credentialState === 'VALID' ? (
          <div className="space-y-6">
            <ModelGroup
              models={fishGroup?.models ?? []}
              emptyMessage={t('models.noFishModels')}
              selectedModelId={models.selectedModelId}
              isSelecting={selectModel.isPending}
              onSelect={(modelId) => {
                selectModel.reset();
                selectModel.mutate({ body: { modelId } });
              }}
            />
            <FishVoiceManager
              voices={fishCredential.voices}
              disabled={!isFishModelSelected}
            />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRoundIcon aria-hidden="true" />
                {t('models.connectFishTitle')}
              </CardTitle>
              <CardDescription>
                {t('models.connectFishDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FishCredentialForm
                credentialState={fishCredential.credentialState}
              />
            </CardContent>
          </Card>
        )}
      </section>

      <div className="border-t pt-8">
        <ModelGroup
          title={t('models.localTitle')}
          description={t('models.localDescription')}
          models={localGroup?.models ?? []}
          emptyMessage={t('models.noLocalModels')}
          selectedModelId={models.selectedModelId}
          isSelecting={selectModel.isPending}
          onSelect={(modelId) => {
            selectModel.reset();
            selectModel.mutate({ body: { modelId } });
          }}
        />
      </div>
    </div>
  );
}

const SECTION_TITLE =
  'font-heading text-2xl leading-tight font-medium tracking-[-0.02em]';
const SECTION_HINT = 'mt-1.5 text-sm text-muted-foreground';

function ModelGroup({
  title,
  description,
  models,
  emptyMessage,
  selectedModelId,
  isSelecting,
  onSelect,
}: {
  title?: string;
  description?: string;
  models: TtsModelResponseDto[];
  emptyMessage: string;
  selectedModelId: string | null;
  isSelecting: boolean;
  onSelect: (modelId: string) => void;
}) {
  return (
    <section aria-label={title}>
      {(title || description) && (
        <div className="mb-4">
          {title && <h2 className={SECTION_TITLE}>{title}</h2>}
          {description && <p className={SECTION_HINT}>{description}</p>}
        </div>
      )}
      {models.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {models.map((model) => (
            <ModelCard
              key={model.id}
              model={model}
              isSelected={model.id === selectedModelId}
              isSelecting={isSelecting}
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-muted-foreground">
            {emptyMessage}
          </CardContent>
        </Card>
      )}
    </section>
  );
}

function ModelCard({
  model,
  isSelected,
  isSelecting,
  onSelect,
}: {
  model: TtsModelResponseDto;
  isSelected: boolean;
  isSelecting: boolean;
  onSelect: (modelId: string) => void;
}) {
  const { t } = useTranslation();
  const isSelectable = model.selectable;
  const status = getModelStatus(model.status, t);
  const reason = getModelReason(model.reasonCode, t);

  return (
    <Card
      className={cn(
        'h-full',
        isSelected && 'ring-2 ring-brand',
        !isSelectable && 'bg-transparent',
      )}
      aria-disabled={!isSelectable}
    >
      <CardHeader>
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'flex size-10 shrink-0 items-center justify-center bg-muted text-muted-foreground',
              isSelected && 'bg-brand text-card',
            )}
            aria-hidden="true"
          >
            {model.source === 'LOCAL' ? <CpuIcon /> : <AudioLinesIcon />}
          </span>
          <div className="min-w-0">
            <CardTitle
              className={cn(
                'truncate',
                !isSelectable && 'text-muted-foreground',
              )}
              title={model.displayName}
            >
              {model.displayName}
            </CardTitle>
            <CardDescription className="truncate font-sans text-xs">
              {model.id}
            </CardDescription>
          </div>
        </div>
        {isSelectable && !isSelected && (
          <CardAction>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isSelecting}
              onClick={() => onSelect(model.id)}
            >
              {isSelecting ? (
                <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
              ) : null}
              {t('models.select')}
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2">
        {isSelected && (
          <Badge variant="brand">
            <CheckCircle2Icon aria-hidden="true" />
            {t('models.selected')}
          </Badge>
        )}
        <Badge variant={status.variant}>{status.label}</Badge>
        {reason && (
          <span className="text-[13px] text-muted-foreground">{reason}</span>
        )}
      </CardContent>
    </Card>
  );
}

function ModelsPageSkeleton() {
  const { t } = useTranslation();

  return (
    <div className="space-y-10" aria-label={t('models.loading')}>
      <div className="max-w-[620px] space-y-3.5">
        <Skeleton className="h-10 w-48 sm:h-14" />
        <Skeleton className="h-5 w-full" />
      </div>
      {[0, 1].map((section) => (
        <div key={section} className="space-y-4">
          <Skeleton className="h-8 w-40" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
        </div>
      ))}
    </div>
  );
}

const FALLBACK_FISH_CREDENTIAL: FishCredentialResponseDto = {
  id: 'fish-audio',
  credentialState: 'MISSING',
  setupRequired: true,
  lastValidatedAt: null,
  voices: [],
};

function findGroup(
  models: TtsModelsResponseDto,
  id: TtsModelGroupResponseDto['id'],
) {
  return models.groups.find((group) => group.id === id);
}

function getModelStatus(
  status: TtsModelResponseDto['status'],
  t: ReturnType<typeof useTranslation>['t'],
): { label: string; variant: ComponentProps<typeof Badge>['variant'] } {
  switch (status) {
    case 'READY':
      return { label: t('models.statusReady'), variant: 'default' };
    case 'UNAVAILABLE':
      return { label: t('models.statusUnavailable'), variant: 'secondary' };
    case 'DISABLED':
      return { label: t('models.statusDisabled'), variant: 'outline' };
  }
}

function getModelReason(
  reasonCode: TtsModelResponseDto['reasonCode'] | null | undefined,
  t: ReturnType<typeof useTranslation>['t'],
) {
  switch (reasonCode) {
    case 'MODEL_DISABLED':
      return t('models.modelDisabled');
    case 'MODEL_SERVICE_UNREACHABLE':
      return t('models.modelUnavailable');
    case 'FISH_CREDIT_REQUIRED':
      return t('models.fishCreditRequired');
    default:
      return null;
  }
}
