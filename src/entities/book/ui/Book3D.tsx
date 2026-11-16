import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import type { Group } from 'three';
import {
  BOOK_W,
  TILT_X,
  TURN_Y,
  getBookHeight,
  hashString,
  useCoverImage,
} from '../model/book-3d';
import { drawBookFront, drawBookSide } from '../model/book-front';

const PAGES_COLOR = '#e6dfcb';
const PAGES_SHADE_COLOR = '#c9c2ad';

// One 3D book (react-three-fiber, orthographic canvas, 1 unit = 1px) standing on
// the line at (x, y): the cover is the front face and the word count sets the
// thickness. Active turns it clockwise until the cover faces you. Render it
// inside a <Canvas>; load this file lazily, it pulls in three.js.
export default function Book3D({
  bookId,
  title,
  author,
  coverUrl,
  wordCount,
  x,
  y,
  unit,
  isActive,
  onSettled,
}: {
  bookId: string;
  title: string;
  author: string;
  coverUrl: string | undefined;
  // Undefined until the book's chapters have loaded.
  wordCount: number | undefined;
  x: number;
  y: number;
  // Scale of the whole book relative to the base size.
  unit: number;
  isActive: boolean;
  // True once the turn to face you has finished, false as it starts to leave.
  onSettled?: (isSettled: boolean) => void;
}) {
  const invalidate = useThree((state) => state.invalidate);
  const image = useCoverImage(coverUrl);
  const hash = hashString(bookId);
  const height = getBookHeight(bookId);
  const depth = Math.min(52, Math.max(30, 16 + (wordCount ?? 0) / 8_000));
  const bodyColor = `hsl(${hash % 360}, 25%, 30%)`;
  const texture = useMemo(
    () =>
      drawBookFront({
        title,
        author,
        image,
        width: BOOK_W,
        height,
        fallbackColor: bodyColor,
      }),
    [title, author, image, height, bodyColor],
  );
  useEffect(() => () => texture.dispose(), [texture]);
  // The spine (left face) carries the title; the back face is the same without it.
  const spineTexture = useMemo(
    () =>
      drawBookSide({
        image,
        fallbackColor: bodyColor,
        title,
        width: depth,
        height,
      }),
    [image, bodyColor, title, depth, height],
  );
  useEffect(() => () => spineTexture.dispose(), [spineTexture]);
  const backTexture = useMemo(
    () =>
      drawBookSide({ image, fallbackColor: bodyColor, width: depth, height }),
    [image, bodyColor, depth, height],
  );
  useEffect(() => () => backTexture.dispose(), [backTexture]);
  const group = useRef<Group>(null);
  const hover = useRef({ target: 0, value: 0 });
  const wasSettled = useRef(false);

  useEffect(() => {
    hover.current.target = isActive ? 1 : 0;
    invalidate();
  }, [isActive, invalidate]);

  useFrame((state) => {
    const current = hover.current;
    current.value += (current.target - current.value) * 0.2;
    if (Math.abs(current.target - current.value) < 0.001) {
      current.value = current.target;
    } else {
      state.invalidate();
    }
    const isSettled = current.target === 1 && current.value === 1;
    if (isSettled !== wasSettled.current) {
      wasSettled.current = isSettled;
      onSettled?.(isSettled);
    }
    group.current?.position.set(0, height / 2, 0);
    group.current?.rotation.set(
      TILT_X * (1 - current.value),
      TURN_Y * (1 - current.value),
      0,
    );
  });

  return (
    <group position={[x, y, 0]} scale={unit}>
      <group ref={group}>
        <mesh>
          <boxGeometry args={[BOOK_W, height, depth]} />
          {/* Box faces: right, left, top, bottom, front, back. */}
          <meshBasicMaterial attach="material-0" color={PAGES_COLOR} />
          <meshBasicMaterial attach="material-1" map={spineTexture} />
          <meshBasicMaterial attach="material-2" color={PAGES_COLOR} />
          <meshBasicMaterial attach="material-3" color={PAGES_SHADE_COLOR} />
          <meshBasicMaterial attach="material-4" map={texture} />
          <meshBasicMaterial attach="material-5" map={backTexture} />
        </mesh>
      </group>
    </group>
  );
}
