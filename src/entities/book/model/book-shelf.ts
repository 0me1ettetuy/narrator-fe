// Pixel layout of 3D books standing on a shelf, shared by every shelf (the
// library, the landing page): the canvas draws the books and the DOM lays its
// hover areas and actions over the same cells. Base sizes; a shelf scales them
// so up to MAX_COLUMNS books fill a row.
const CELL_W = 160;
const MIN_CELL_W = 120;
const MAX_COLUMNS = 7;
const BOOK_AREA_H = 270;
export const SHELF_INSET = 6;
export const SHELF_GAP_X = 8;
export const SHELF_GAP_Y = 24;

// Cells stretch to fill the row (up to a limit on phones); books scale with
// them. `cellAt` is a cell's top left corner from the shelf's top left corner.
// A shelf with a fixed height passes `maxCellH` to shrink the books to fit it.
export function getShelfLayout(width: number, maxCellH = Infinity) {
  const columns = Math.min(
    MAX_COLUMNS,
    Math.max(1, Math.floor((width + SHELF_GAP_X) / (MIN_CELL_W + SHELF_GAP_X))),
  );
  const cellW = Math.min(
    CELL_W * 1.25,
    (width - (columns - 1) * SHELF_GAP_X) / columns,
  );
  const unit = Math.min(cellW / CELL_W, (maxCellH - SHELF_INSET) / BOOK_AREA_H);
  const areaH = BOOK_AREA_H * unit;
  const cellH = areaH + SHELF_INSET;
  const offsetX = (width - (columns * cellW + (columns - 1) * SHELF_GAP_X)) / 2;

  return {
    columns,
    cellW,
    unit,
    areaH,
    cellH,
    cellAt: (index: number) => ({
      left: offsetX + (index % columns) * (cellW + SHELF_GAP_X),
      top: Math.floor(index / columns) * (cellH + SHELF_GAP_Y),
    }),
  };
}
