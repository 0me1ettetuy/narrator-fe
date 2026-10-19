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
  booksControllerGetBookQueryKey,
  booksControllerGetBookOptions,
  booksControllerListBooksOptions,
  booksControllerListBooksQueryKey,
  booksControllerQueueChapterAudioMutation,
} from './generated/@tanstack/react-query.gen';
export type {
  AuthControllerLoginResponse,
  AuthControllerMeResponse,
  AuthControllerRegisterResponse,
  BookDetailResponseDto,
  BookSummaryResponseDto,
  ChapterAudioResponseDto,
  ChapterSummaryResponseDto,
} from './generated';
