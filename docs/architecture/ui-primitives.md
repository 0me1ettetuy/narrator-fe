# UI primitives: sizes and settings

Every size, spacing and type setting of the shadcn primitives in `src/shared/ui`
(style "Paper & ink"), so designs and screens reuse them instead of inventing
custom sizes.

Status: current

Source of truth is the primitive's file in `src/shared/ui` and the tokens in
`src/app/styles/index.css`. When a primitive's size changes, update this table.

## Contents

- [Rules for designs](#rules-for-designs)
- [Tokens](#tokens)
- [Controls](#controls)
- [Surfaces and overlays](#surfaces-and-overlays)
- [Feedback](#feedback)
- [Navigation](#navigation)
- [Layout recipes](#layout-recipes)

## Rules for designs

1. Use a primitive with its own `size`/`variant`. Do not set `h-*`, `px-*`,
   `text-*` or `rounded-*` on it to get a "custom" size; if none fits, pick the
   nearest size below.
2. One control height per row: 32px (`sm`) rows or 40px (`default`) rows. Form
   inputs, selects and tabs are 44px, so a form row is 44px throughout.
3. Corners are square (`--radius: 0`). No rounded corners, no shadows on
   surfaces. Only floating layers (menus, dialogs, toasts) have a shadow.
4. Spacing steps are 4px multiples: 8 (`gap-2`), 12 (`gap-3`), 16 (`p-4`,
   `gap-4`), 20 (`p-5`, `gap-5`), 32 (`mt-8`). Padding inside bordered bars,
   cards and rows is 16px sides.
5. Labels on controls are uppercase 10-11px tracked; reading text is sentence
   case. Never uppercase body copy, breadcrumbs or select-all labels.
6. Focus ring is global (2px cobalt, 2px offset); never add per-component rings.
7. Icons are lucide, 1.6px stroke, 16px by default (14px in `sm`/`xs`).

## Tokens

| Token                              | Light     | Dark                  | Use                                  |
| ---------------------------------- | --------- | --------------------- | ------------------------------------ |
| `background`                       | `#e2dfd6` | `#151514`             | page                                 |
| `card` / `popover`                 | `#f1eee6` | `#1c1c1b`             | raised surfaces, inputs              |
| `foreground` / `primary`           | `#191918` | `#dedbd1`             | text, solid buttons, ink bands       |
| `secondary` / `muted` / `accent`   | `#cfccc2` | `#262624`             | quiet fills, hover                   |
| `muted-foreground`                 | `#55534c` | `#a19e94`             | secondary text                       |
| `border` / `input`                 | `#bdbab0` | `#363531`             | all borders                          |
| `brand` / `ring`                   | `#1f3be6` | `#5b76ff`             | cobalt: focus, progress, in-progress |
| `destructive` / `destructive-text` | `#a3161c` | `#d2342f` / `#ef6a60` | errors, delete                       |

Fonts: `font-sans` Onest (UI, headings), `font-serif` Literata (descriptions,
book/collection titles, empty-state titles).

Type scale in use: 9px (tile author label), 10px (badges, `sm` buttons), 11px
(buttons, labels), 12px (`text-xs` meta), 13px (hints, errors, meta lines), 14px
(`text-sm` body, menus, alerts), 15px (inputs, selects, tabs), 16px (`text-base`
card title), 18px (tile title, `text-lg`), 20px (`text-xl` dialog title), 32px
(section heading), 46px (book title).

## Controls

| Primitive             | Settings                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`              | variants `default` `outline` `secondary` `ghost` `destructive` `link`. Sizes: `xs` 28px / `sm` 32px / `default` 40px / `lg` 48px; icon-only `icon-xs` 28 / `icon-sm` 32 / `icon` 40 / `icon-lg` 48. Label 11px semibold uppercase tracked (10px in `xs`/`sm`, 12px in `lg`); padding 14px (`default`), 10px (`sm`), 8px (`xs`), 20px (`lg`); gap 8px (`default`/`lg`), 6px (`sm`), 4px (`xs`). `link` is 14px sentence case. |
| `ButtonGroup`         | buttons overlap borders by 1px; pressed button above neighbours. Group gap 8px between nested groups.                                                                                                                                                                                                                                                                                                                        |
| `Toggle`              | height and padding as `Button` (`sm` 32, `default` 40, `lg` 48); 11px uppercase.                                                                                                                                                                                                                                                                                                                                             |
| `Input`               | height 44px, padding 14px, text 15px, card background, 1px `input` border.                                                                                                                                                                                                                                                                                                                                                   |
| `Textarea`            | min height 80px, padding 14px x 12px, text 15px.                                                                                                                                                                                                                                                                                                                                                                             |
| `Select` trigger      | `default` 44px / `sm` 32px; padding 14px left, 12px right, text 15px. Popup: padding 4px, items 40px high, 14px, min width 144px.                                                                                                                                                                                                                                                                                            |
| `InputGroup`          | 44px high; addons 14px text; addon buttons `xs` 28 / `icon-xs` 28 / `icon-sm` 32.                                                                                                                                                                                                                                                                                                                                            |
| `Checkbox`            | 20px square, 1.5px border, check icon 14px; hit area extends 12px sideways, 8px vertically.                                                                                                                                                                                                                                                                                                                                  |
| `Switch`              | `default` 44x24px, `sm` 36x20px; thumb 18px / 14px.                                                                                                                                                                                                                                                                                                                                                                          |
| `Slider`              | full width; square thumb.                                                                                                                                                                                                                                                                                                                                                                                                    |
| `Label`, `FieldLabel` | 11px semibold uppercase tracked, `muted-foreground`. For a sentence-case label (checkbox rows) use `text-sm font-medium tracking-normal normal-case` on `FieldLabel`.                                                                                                                                                                                                                                                        |
| `Field`               | vertical gap 8px between label, control and hint; `FieldGroup` gap 20px (16px nested); `FieldSet` gap 16px. Hint 13px muted; error 13px `destructive-text`.                                                                                                                                                                                                                                                                  |

## Surfaces and overlays

| Primitive      | Settings                                                                                                                                                                                                                                 |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Card`         | `ring-1 ring-border`, no radius or shadow. Padding and gap 16px (`--card-spacing`); `size="sm"` 12px. Header gap 4px. Title 16px semibold (14px in `sm`), description Literata 14px muted, footer has a top border and the card padding. |
| `Dialog`       | content padding 20px, gap 16px, max width 384px (`sm:max-w-sm`; wider forms pass `sm:max-w-lg`). Header gap 8px, footer buttons gap 8px, right aligned. Title Onest, description Literata 14px.                                          |
| `AlertDialog`  | padding 20px, gap 16px, width 384px (`default`) / compact `sm`. Title 20px semibold; media icon box 40px. Footer buttons gap 8px.                                                                                                        |
| `Sheet`        | header/footer padding 20px, gap 8px; body gap 16px.                                                                                                                                                                                      |
| `DropdownMenu` | content padding 4px, min width 128px; items 40px high, 14px text, 10px side padding, icon gap 10px; label 12px muted; separator 1px with 4px margin.                                                                                     |
| `Tooltip`      | ink background, 12px medium text, padding 10px x 6px, max width 320px.                                                                                                                                                                   |
| `Separator`    | 1px line in `border`.                                                                                                                                                                                                                    |
| `Skeleton`     | `bg-muted` block, size it to the content it replaces.                                                                                                                                                                                    |

## Feedback

| Primitive  | Settings                                                                                                                               |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `Badge`    | height 22px, padding 8px, text 10px semibold uppercase tracked. Variants `default` `secondary` `destructive` `outline` `brand` `link`. |
| `Alert`    | padding 16px x 14px, text 14px, icon 16px. Title semibold; description Literata 14px muted. Variants `default`, `destructive`.         |
| `Toast`    | 340px wide, ink background, padding 16px, title 14px, description 14px; action button 32px.                                            |
| `Progress` | 4px high track in `border`, cobalt fill.                                                                                               |
| `Empty`    | dashed 1.5px border, min height 176px, padding 16px, gap 10px; title Literata 17px, description 13px muted, icon 20px.                 |
| `Avatar`   | `sm` 28px / `default` 36px / `lg` 44px; fallback `brand` fill with the initial.                                                        |
| `Spinner`  | compact, indeterminate actions only; lists use `Skeleton`.                                                                             |

## Navigation

| Primitive       | Settings                                                                                                                                                                          |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Tabs` (`line`) | list 44px high, tab gap 28px, tab text 15px medium (semibold when active), 2px ink underline, bottom border on the list. Panel spacing is the page's job (tabs root has gap 8px). |
| `Breadcrumb`    | 14px medium sentence case, separator `/`, item gap 10px.                                                                                                                          |
| `Sidebar`       | 256px wide (288px mobile), icon rail 56px; menu items 44px high, 15px medium, 12px side padding; header 56px high.                                                                |

## Layout recipes

Reuse these instead of designing new ones.

| Recipe                  | Settings                                                                                                                                                                                                                                                        |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page header (top bar)   | 56px high, sticky, page background, bottom border; filters/toolbars that stick under it use `top-14`.                                                                                                                                                           |
| Island                  | `widgets/island`: ink container, 640px max, fixed 16px from the bottom of the content column; 32px-high header strip ("Activity N" + collapse), then stacked items divided by hairlines; each item is `px-4 py-3` with a 32px icon box and 32px (`sm`) buttons. |
| Title page header       | `PageHeader`: 56px medium title (36px on mobile), 14px muted meta on the same baseline, 17px serif intro under it (14px gap), optional actions right. Library, Home, Models.                                                                                    |
| Section heading         | 32px medium, count and actions on the same baseline; 16px (`mt-4`) to its content.                                                                                                                                                                              |
| Bordered bar / list row | 16px side padding, 12px vertical (`px-4 py-3`); rows divided by 1px lines.                                                                                                                                                                                      |
| Bar controls            | all 32px (`sm` buttons, `sm` select) in one bar.                                                                                                                                                                                                                |
| Cover grid              | `gap-5`; 2 columns, 3 at `sm`/`lg`, 4 at `xl`.                                                                                                                                                                                                                  |
| Book tile               | 3:4; cover 4:3 on top, ink band with 9px author, 18px Literata title; status chip top right (20px high); meta line 13px muted under the tile, min height 32px.                                                                                                  |
| Collection tile         | same 3:4 footprint; two offset sheets behind the cover read as a stack; band says "Collection . N books".                                                                                                                                                       |
| Chapter row             | flat list row, 16px sides, min 64px, divided by 1px lines: 20px checkbox, serif 16px title + 12px meta, 320px audio column (32px lead, middle, 32px action). Toolbar above is a sticky bar with an ink bottom border.                                           |
| Add card                | dashed 3:4 tile, same footprint as a tile.                                                                                                                                                                                                                      |
| Hover actions on tiles  | 32px icon buttons top-left of the tile, visible on hover/focus, always on touch.                                                                                                                                                                                |
| Book page header        | 220px 2:3 cover; owner actions are 32px secondary icon buttons (cover edit on the cover, actions menu at top right of the details).                                                                                                                             |
