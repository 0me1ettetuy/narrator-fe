import './client';

export { client } from './generated/client.gen';
export {
  getApiErrorCode,
  getApiErrorTranslationKey,
  getApiErrorTranslationKeyForCode,
  type ApiErrorCode,
} from './api-error';
export { authControllerCsrf, authControllerRefresh } from './generated';
export {
  authControllerLoginMutation,
  authControllerLogoutMutation,
  authControllerMeOptions,
  authControllerMeQueryKey,
  authControllerRegisterMutation,
  booksControllerCancelChapterAudioMutation,
  booksControllerCancelSelectedChapterAudioMutation,
  booksControllerDeleteChapterAudioMutation,
  booksControllerGetBookCoverAccessOptions,
  booksControllerGetChapterAudioAccessOptions,
  booksControllerGetBookQueryKey,
  booksControllerGetBookOptions,
  booksControllerListBooksOptions,
  booksControllerListBooksQueryKey,
  booksControllerQueueChapterAudioMutation,
  booksControllerQueueSelectedChapterAudioMutation,
  ttsModelsControllerListModelsOptions,
  ttsModelsControllerListModelsQueryKey,
  ttsModelsControllerSaveFishCredentialMutation,
  ttsModelsControllerSelectModelMutation,
} from './generated/@tanstack/react-query.gen';
export type {
  AuthControllerLoginResponse,
  AuthControllerMeResponse,
  AuthControllerRegisterResponse,
  BatchChapterAudioResponseDto,
  BookCoverAccessResponseDto,
  BookDetailResponseDto,
  BookSummaryResponseDto,
  ChapterAudioAccessResponseDto,
  ChapterAudioResponseDto,
  ChapterSummaryResponseDto,
  FishCredentialResponseDto,
  TtsModelGroupResponseDto,
  TtsModelResponseDto,
  TtsModelsResponseDto,
} from './generated';
