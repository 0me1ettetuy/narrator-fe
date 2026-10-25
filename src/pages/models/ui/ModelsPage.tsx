import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AudioLinesIcon,
  CheckCircle2Icon,
  CircleAlertIcon,
  CpuIcon,
  KeyRoundIcon,
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import { DataState } from '@/shared/ui/data-state';
import { Skeleton } from '@/shared/ui/skeleton';
import { FishCredentialForm } from './FishCredentialForm';

export function ModelsPage() {
  const modelsQuery = useQuery(ttsModelsControllerListModelsOptions());

  return (
    <section className="mx-auto max-w-5xl px-4 py-8">
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

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t('models.title')}
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          {t('models.description')}
        </p>
      </div>

      {selectModel.error && (
        <Alert variant="destructive">
          <CircleAlertIcon aria-hidden="true" />
          <AlertTitle>{t('models.selectionFailed')}</AlertTitle>
          <AlertDescription>
            {t(getApiErrorTranslationKey(selectModel.error))}
          </AlertDescription>
        </Alert>
      )}

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

      <section aria-labelledby="fish-audio-title">
        <div className="mb-4">
          <h2 id="fish-audio-title" className="text-xl font-semibold">
            {t('models.fishTitle')}
          </h2>
          <p className="mt-1 text-muted-foreground">
            {t('models.fishDescription')}
          </p>
        </div>

        {fishCredential.credentialState === 'VALID' ? (
          <ModelGroup
            title={t('models.connected')}
            titleIcon={<CheckCircle2Icon className="text-primary" />}
            models={fishGroup?.models ?? []}
            emptyMessage={t('models.noFishModels')}
            selectedModelId={models.selectedModelId}
            isSelecting={selectModel.isPending}
            onSelect={(modelId) => {
              selectModel.reset();
              selectModel.mutate({ body: { modelId } });
            }}
          />
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
    </div>
  );
}

function ModelGroup({
  title,
  titleIcon,
  description,
  models,
  emptyMessage,
  selectedModelId,
  isSelecting,
  onSelect,
}: {
  title: string;
  titleIcon?: ReactNode;
  description?: string;
  models: TtsModelResponseDto[];
  emptyMessage: string;
  selectedModelId: string | null;
  isSelecting: boolean;
  onSelect: (modelId: string) => void;
}) {
  return (
    <section aria-label={title}>
      <div className="mb-4">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          {titleIcon}
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-muted-foreground">{description}</p>
        )}
      </div>
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
  const status = getModelStatus(model.status, t);
  const reason = getModelReason(model.reasonCode, t);

  return (
    <Card
      className={
        !model.selectable
          ? 'opacity-65'
          : isSelected
            ? 'ring-2 ring-primary'
            : undefined
      }
    >
      <CardHeader>
        <CardTitle className="flex items-start gap-2">
          {model.source === 'LOCAL' ? (
            <CpuIcon className="mt-0.5 shrink-0" aria-hidden="true" />
          ) : (
            <AudioLinesIcon className="mt-0.5 shrink-0" aria-hidden="true" />
          )}
          <span>{model.displayName}</span>
        </CardTitle>
        <CardDescription>{model.id}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2">
        <Badge variant={status.variant}>{status.label}</Badge>
        {isSelected && <Badge variant="outline">{t('models.selected')}</Badge>}
        {reason && (
          <span className="text-sm text-muted-foreground">{reason}</span>
        )}
      </CardContent>
      {model.selectable && (
        <CardFooter className="justify-end">
          <Button
            type="button"
            variant={isSelected ? 'outline' : 'default'}
            disabled={isSelected || isSelecting}
            onClick={() => onSelect(model.id)}
          >
            {isSelecting ? (
              <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
            ) : null}
            {isSelected ? t('models.selected') : t('models.select')}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

function ModelsPageSkeleton() {
  const { t } = useTranslation();

  return (
    <div className="space-y-10" aria-label={t('models.loading')}>
      <div className="space-y-2">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>
      {[0, 1].map((section) => (
        <div key={section} className="space-y-4">
          <Skeleton className="h-7 w-40" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-36" />
            <Skeleton className="h-36" />
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
    default:
      return null;
  }
}
