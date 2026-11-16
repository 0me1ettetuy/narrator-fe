import { lazy } from 'react';
export { BookCoverThumb } from './ui/BookCoverThumb';
export { BookCoverTile } from './ui/BookCoverTile';
export { sampleCoverBandColor, useCoverColor } from './model/use-cover-color';
export { getAudioProgress, getAudioStageLabel } from './model/chapter-audio';
export { shouldPollBook } from './model/book-polling';
export { BookMetadata } from './ui/BookMetadata';
export { formatFileSize, getLanguageName } from './model/book-format';
// Lazy: Book3D pulls in three.js, so only the pages that draw 3D books load it.
export const Book3D = lazy(() => import('./ui/Book3D'));
export { BOOK_W, BOOK_H, getBookHeight } from './model/book-3d';
