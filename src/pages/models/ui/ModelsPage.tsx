import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AudioLinesIcon,
  CheckCircle2Icon,
  CircleAlertIcon,
  CpuIcon,
  ExternalLinkIcon,
  LoaderCircleIcon,
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
    <section className="mx-auto max-w-[65rem] px-4 py-8 pb-12 sm:px-8">
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
  const isFishModelSelected =
    fishGroup?.models.some((model) => model.id === models.selectedModelId) ??
    false;
  const select = (modelId: string) => {
    selectModel.reset();
    selectModel.mutate({ body: { modelId } });
  };

  return (
    <div className="flex flex-col gap-12">
      <PageHeader
        title={t('models.pageTitle')}
        meta={t('models.summary', {
          count: allModels.length,
          ready: allModels.filter((model) => model.selectable).length,
        })}
        description={`${t('models.pageIntro')} ${t('models.newAudioNote')}`}
      />

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
        badge={
          <Badge variant="outline">
            {isFishConnected && <CheckCircle2Icon aria-hidden="true" />}
            {isFishConnected ? t('models.connected') : t('models.notConnected')}
          </Badge>
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

// A provider's title row (with an optional status badge) above its content.
function ProviderSection({
  id,
  title,
  description,
  badge,
  children,
}: {
  id: string;
  title: string;
  description: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 id={id} className="text-xl leading-tight font-semibold">
            {title}
          </h2>
          <p className="font-serif text-sm text-muted-foreground">
            {description}
          </p>
        </div>
        {badge}
      </div>
      {children}
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
    <Card className="h-full gap-0 py-0" aria-disabled={!isSelectable}>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className={cn(
              'flex size-10 shrink-0 items-center justify-center',
              isSelected && 'bg-brand text-card',
              isSelectable && !isSelected && 'bg-secondary',
              !isSelectable && 'border border-dashed text-muted-foreground',
            )}
          >
            {model.source === 'LOCAL' ? <CpuIcon /> : <AudioLinesIcon />}
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <h3
              className={cn(
                'truncate text-sm font-semibold',
                !isSelectable && 'text-muted-foreground',
              )}
              title={model.displayName}
            >
              {model.displayName}
            </h3>
            <span className="truncate font-mono text-xs text-muted-foreground">
              {model.id}
            </span>
          </div>
        </div>
        <p className="text-[13px] text-muted-foreground">
          {model.source === 'LOCAL'
            ? t('models.localNote')
            : t('models.cloudNote')}
        </p>
      </div>
      <div className="flex min-h-10 flex-wrap items-center gap-2 border-t p-4">
        {isSelected ? (
          <Badge variant="outline">
            <CheckCircle2Icon aria-hidden="true" />
            {t('models.selected')}
          </Badge>
        ) : isSelectable ? (
          <Badge variant="outline">{status.label}</Badge>
        ) : (
          <>
            <Badge
              variant="outline"
              className="border-destructive text-destructive-text"
            >
              {status.label}
            </Badge>
            {reason && (
              <span className="text-[13px] text-muted-foreground">
                {reason}
              </span>
            )}
          </>
        )}
        {isSelectable && !isSelected && (
          <Button
            type="button"
            variant="outline"
            className="ml-auto"
            disabled={isSelecting}
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
    <div className="flex flex-col gap-12" aria-label={t('models.loading')}>
      <div className="space-y-2">
        <Skeleton className="h-10 w-48 sm:h-14" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>
      <Skeleton className="h-24 w-full" />
      {[0, 1].map((section) => (
        <div key={section} className="space-y-4">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-44" />
            <Skeleton className="h-44" />
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
