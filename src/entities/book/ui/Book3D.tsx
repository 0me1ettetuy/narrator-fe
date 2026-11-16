import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { BoxGeometry, type Group } from 'three';
import {
  BOOK_W,
  TILT_X,
  TURN_Y,
  getBookHeightFor,
  hashString,
  useCoverImage,
} from '../model/book-3d';
import { drawBookFront, drawBookSide } from '../model/book-front';

const PAGES_COLOR = '#e6dfcb';
const PENDING_COLOR = 'hsl(0, 0%, 32%)';
const PAGES_SHADE_COLOR = '#c9c2ad';
// How far the spine arcs out (share of the book's thickness) and how many
// slices make the arc.
const SPINE_BULGE = 0.15;
const SPINE_SEGMENTS = 12;
// Hard covers: boards this thick wrap the pages, which sit this far in from the
// cover's top, bottom and right edges. The spine is as thick as the boards.
const COVER_THICKNESS = 2;
const PAGE_INSET = 2;
const SPINE_WIDTH = COVER_THICKNESS;

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
  onHeight,
  isPending = false,
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
  // The book's height in base px, which follows its cover once that has loaded;
  // callers lay the book out with it.
  onHeight?: (height: number) => void;
  // Still being parsed: with no cover it is a gray blank, not a coloured band
  // with the title.
  isPending?: boolean;
}) {
  const invalidate = useThree((state) => state.invalidate);
  const [image, isCoverSettled] = useCoverImage(coverUrl);
  const hash = hashString(bookId);
  const height = getBookHeightFor(bookId, image);
  useEffect(() => {
    if (isCoverSettled) onHeight?.(height);
  }, [height, isCoverSettled, onHeight]);
  const depth = Math.min(52, Math.max(30, 16 + (wordCount ?? 0) / 8_000));
  const bodyColor = isPending ? PENDING_COLOR : `hsl(${hash % 360}, 25%, 30%)`;
  const texture = useMemo(
    () =>
      drawBookFront({
        title,
        author,
        image,
        width: BOOK_W,
        height,
        fallbackColor: bodyColor,
        isBlank: isPending,
      }),
    [title, author, image, height, bodyColor, isPending],
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
        faceWidth: BOOK_W,
        height,
      }),
    [image, bodyColor, title, depth, height],
  );
  useEffect(() => () => spineTexture.dispose(), [spineTexture]);
  const backTexture = useMemo(
    () =>
      drawBookSide({
        image,
        fallbackColor: bodyColor,
        width: depth,
        faceWidth: BOOK_W,
        height,
      }),
    [image, bodyColor, depth, height],
  );
  useEffect(() => () => backTexture.dispose(), [backTexture]);
  // The spine is a band as thick as the boards, bent into an arc (like a real
  // book's rounded spine); the page block's left edge follows the same arc, so
  // the cover is an even thickness all the way round.
  const { spine, pages } = useMemo(() => {
    const bulge = depth * SPINE_BULGE;
    const bend = (box: BoxGeometry, edgeX: number) => {
      const position = box.attributes.position;
      for (let i = 0; i < position.count; i += 1) {
        if (Math.abs(position.getX(i) - edgeX) > 1e-6) continue;
        const t = position.getZ(i) / (depth / 2);
        position.setX(i, edgeX - bulge * (1 - t * t));
      }
      return box;
    };
    const spineBox = new BoxGeometry(
      SPINE_WIDTH,
      height,
      depth,
      1,
      1,
      SPINE_SEGMENTS,
    );
    // Both long edges bend: the outer one and the inner one.
    bend(spineBox, SPINE_WIDTH / 2);
    bend(spineBox, -SPINE_WIDTH / 2);
    const pagesWidth = BOOK_W - PAGE_INSET - SPINE_WIDTH;
    return {
      spine: spineBox,
      pages: bend(
        new BoxGeometry(
          pagesWidth,
          height - 2 * PAGE_INSET,
          depth - 2 * COVER_THICKNESS,
          1,
          1,
          SPINE_SEGMENTS,
        ),
        -pagesWidth / 2,
      ),
    };
  }, [height, depth]);
  useEffect(
    () => () => {
      spine.dispose();
      pages.dispose();
    },
    [spine, pages],
  );
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

  // Hidden until the cover has loaded: its height decides the book's height, and
  // a book shown first and resized after makes the whole shelf jump.
  return (
    <group position={[x, y, 0]} scale={unit} visible={isCoverSettled}>
      <group ref={group}>
        {/* Box faces: right, left, top, bottom, front, back. */}
        <mesh geometry={spine} position={[(SPINE_WIDTH - BOOK_W) / 2, 0, 0]}>
          <meshBasicMaterial attach="material-0" visible={false} />
          <meshBasicMaterial attach="material-1" map={spineTexture} />
          <meshBasicMaterial attach="material-2" color={bodyColor} />
          <meshBasicMaterial attach="material-3" color={bodyColor} />
          <meshBasicMaterial attach="material-4" visible={false} />
          <meshBasicMaterial attach="material-5" visible={false} />
        </mesh>
        <mesh
          geometry={pages}
          position={[(SPINE_WIDTH - PAGE_INSET) / 2, 0, 0]}
        >
          <meshBasicMaterial attach="material-0" color={PAGES_COLOR} />
          <meshBasicMaterial attach="material-1" color={PAGES_COLOR} />
          <meshBasicMaterial attach="material-2" color={PAGES_COLOR} />
          <meshBasicMaterial attach="material-3" color={PAGES_SHADE_COLOR} />
          <meshBasicMaterial attach="material-4" color={PAGES_COLOR} />
          <meshBasicMaterial attach="material-5" color={PAGES_COLOR} />
        </mesh>
        {[1, -1].map((side) => (
          <mesh
            key={side}
            position={[0, 0, side * (depth / 2 - COVER_THICKNESS / 2)]}
          >
            <boxGeometry args={[BOOK_W, height, COVER_THICKNESS]} />
            {[0, 1, 2, 3].map((face) => (
              <meshBasicMaterial
                key={face}
                attach={`material-${face}`}
                color={bodyColor}
              />
            ))}
            <meshBasicMaterial
              attach={`material-${side === 1 ? 4 : 5}`}
              map={side === 1 ? texture : backTexture}
            />
            <meshBasicMaterial
              attach={`material-${side === 1 ? 5 : 4}`}
              color={bodyColor}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
