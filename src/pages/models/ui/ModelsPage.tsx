import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AudioLinesIcon,
  CheckCircle2Icon,
  CircleAlertIcon,
  CpuIcon,
  ExternalLinkIcon,
  LoaderCircleIcon,
  ServerIcon,
} from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
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
import { Card, CardContent } from '@/shared/ui/card';
import { PageHeader } from '@/shared/ui/page-header';
import { DataState } from '@/shared/ui/data-state';
import { cn } from '@/shared/lib/utils';
import { Skeleton } from '@/shared/ui/skeleton';
import { FishCredentialForm } from './FishCredentialForm';
import { FishVoiceManager } from './FishVoiceManager';

export function ModelsPage() {
  const modelsQuery = useQuery(ttsModelsControllerListModelsOptions());

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 pb-12 sm:px-8">
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
  const isFishConnected = fishCredential.credentialState === 'VALID';
  const allModels = models.groups.flatMap((group) => group.models);
  const selectedModel = allModels.find(
    (model) => model.id === models.selectedModelId,
  );
  const isFishModelSelected =
    fishGroup?.models.some((model) => model.id === models.selectedModelId) ??
    false;
  const selectedFishVoice = fishCredential.voices.find(
    (voice) => voice.selected,
  );
  const select = (modelId: string) => {
    selectModel.reset();
    selectModel.mutate({ body: { modelId } });
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={t('models.pageTitle')}
        meta={t('models.summary', {
          count: allModels.length,
          ready: allModels.filter((model) => model.selectable).length,
        })}
        description={`${t('models.pageIntro')} ${t('models.newAudioNote')}`}
      />

      <section
        aria-label={t('models.newAudioUses')}
        aria-live="polite"
        className="flex flex-wrap items-center gap-4 bg-card p-4 ring-1 ring-border"
      >
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center bg-brand text-card"
        >
          {selectedModel?.source === 'LOCAL' ? <CpuIcon /> : <AudioLinesIcon />}
        </span>
        <div className="flex min-w-0 flex-1 basis-80 flex-col gap-0.5">
          <span className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
            {t('models.newAudioUses')}
          </span>
          <span className="text-base font-semibold">
            {selectedModel?.selectable
              ? selectedModel.displayName
              : t('models.noModelReady')}
          </span>
          <span className="font-serif text-sm text-muted-foreground">
            {!selectedModel?.selectable
              ? t('models.noModelReadyHint')
              : selectedModel.source === 'LOCAL'
                ? t('models.voiceFollowsBook')
                : selectedFishVoice
                  ? t('models.defaultVoiceLine', {
                      name: selectedFishVoice.name,
                    })
                  : t('models.defaultVoiceTitle')}
          </span>
        </div>
      </section>

      {selectModel.error && (
        <Alert variant="destructive">
          <CircleAlertIcon aria-hidden="true" />
          <AlertTitle>{t('models.selectionFailed')}</AlertTitle>
          <AlertDescription>
            {t(getApiErrorTranslationKey(selectModel.error))}
          </AlertDescription>
        </Alert>
      )}

      <ProviderSection
        id="fish-audio-title"
        title={t('models.fishTitle')}
        description={t('models.fishDescription')}
        aside={
          <>
            <Badge variant="outline">
              {isFishConnected && <CheckCircle2Icon aria-hidden="true" />}
              {isFishConnected
                ? t('models.connected')
                : t('models.notConnected')}
            </Badge>
            <span className="text-[13px] text-muted-foreground">
              {t('models.fishBilling')}
            </span>
            <FishLink>fish.audio</FishLink>
          </>
        }
      >
        {isFishConnected ? (
          <div className="flex flex-col gap-4">
            <ModelGroup
              models={fishGroup?.models ?? []}
              emptyMessage={t('models.noFishModels')}
              selectedModelId={models.selectedModelId}
              isSelecting={selectModel.isPending}
              onSelect={select}
            />
            <FishVoiceManager
              voices={fishCredential.voices}
              disabled={!isFishModelSelected}
            />
          </div>
        ) : (
          <Card className="gap-0 py-0">
            <div className="flex flex-col gap-4 p-4">
              <div className="flex flex-col gap-1">
                <h3 className="text-base font-semibold">
                  {t('models.connectFishTitle')}
                </h3>
                <p className="font-serif text-sm text-muted-foreground">
                  {t('models.connectFishDescription')}
                </p>
              </div>
              <FishCredentialForm
                credentialState={fishCredential.credentialState}
                footer={<FishLink>{t('models.getKey')}</FishLink>}
              />
            </div>
          </Card>
        )}
      </ProviderSection>

      <ProviderSection
        id="local-models-title"
        title={t('models.localTitle')}
        description={t('models.localDescription')}
        aside={
          <Badge variant="outline">
            <ServerIcon aria-hidden="true" />
            {t('models.onThisServer')}
          </Badge>
        }
      >
        <ModelGroup
          models={localGroup?.models ?? []}
          emptyMessage={t('models.noLocalModels')}
          selectedModelId={models.selectedModelId}
          isSelecting={selectModel.isPending}
          onSelect={select}
        />
      </ProviderSection>
    </div>
  );
}

// Two columns: what the provider is on the left, its models on the right.
function ProviderSection({
  id,
  title,
  description,
  aside,
  children,
}: {
  id: string;
  title: string;
  description: string;
  aside: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="grid items-start gap-x-12 gap-y-4 border-t pt-8 lg:grid-cols-[17.5rem_minmax(0,1fr)]"
    >
      <div className="flex flex-col gap-2 lg:sticky lg:top-22">
        <h2 id={id} className="text-xl leading-tight font-semibold">
          {title}
        </h2>
        <p className="font-serif text-sm leading-normal text-muted-foreground">
          {description}
        </p>
        <div className="mt-2 flex flex-col items-start gap-2">{aside}</div>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function FishLink({ children }: { children: ReactNode }) {
  return (
    <a
      href="https://fish.audio"
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 text-sm underline-offset-4 hover:underline"
    >
      {children}
      <ExternalLinkIcon className="size-3.5" aria-hidden="true" />
    </a>
  );
}

function ModelGroup({
  models,
  emptyMessage,
  selectedModelId,
  isSelecting,
  onSelect,
}: {
  models: TtsModelResponseDto[];
  emptyMessage: string;
  selectedModelId: string | null;
  isSelecting: boolean;
  onSelect: (modelId: string) => void;
}) {
  if (models.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted-foreground">
          {emptyMessage}
        </CardContent>
      </Card>
    );
  }

  return (
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
        'h-full gap-0 py-0',
        isSelected && 'ring-2 ring-foreground',
        !isSelectable && 'bg-transparent opacity-70',
      )}
      aria-disabled={!isSelectable}
    >
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center bg-secondary"
            aria-hidden="true"
          >
            {model.source === 'LOCAL' ? <CpuIcon /> : <AudioLinesIcon />}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <h3
              className="truncate text-base leading-snug font-semibold"
              title={model.displayName}
            >
              {model.displayName}
            </h3>
            <span className="truncate font-mono text-xs text-muted-foreground">
              {model.id}
            </span>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        {reason && (
          <p className="flex gap-2 text-[13px] text-destructive-text">
            <CircleAlertIcon
              className="mt-0.5 size-3.5 shrink-0"
              aria-hidden="true"
            />
            {reason}
          </p>
        )}
      </div>
      <div className="flex min-h-8 items-center border-t px-4 py-3">
        {isSelected ? (
          <span className="inline-flex h-8 items-center gap-1.5 text-[13px] font-semibold text-brand">
            <CheckCircle2Icon className="size-4" aria-hidden="true" />
            {t('models.inUse')}
          </span>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!isSelectable || isSelecting}
            aria-label={t('models.selectModel', { name: model.displayName })}
            onClick={() => onSelect(model.id)}
          >
            {isSelecting && (
              <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
            )}
            {t('models.select')}
          </Button>
        )}
      </div>
    </Card>
  );
}

function ModelsPageSkeleton() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-8" aria-label={t('models.loading')}>
      <div className="space-y-2">
        <Skeleton className="h-10 w-48 sm:h-14" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>
      <Skeleton className="h-24 w-full" />
      {[0, 1].map((section) => (
        <div
          key={section}
          className="grid gap-4 border-t pt-8 lg:grid-cols-[17.5rem_1fr] lg:gap-12"
        >
          <Skeleton className="h-24" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
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
      return { label: t('models.statusUnavailable'), variant: 'destructive' };
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
