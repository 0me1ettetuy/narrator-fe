# Paper & Ink Primitives Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the 28 shadcn primitives the app uses (in `src/shared/ui/`) to the "paper & ink" design, light and dark, without changing any behaviour or call-site API.

**Architecture:** Tokens in `src/app/styles/index.css` carry colour, radius and fonts. Primitives are edited in place: delete shape/ring classes, set sizes and type, point colours at tokens. Page code is not touched except where a task says so.

**Tech Stack:** React, Tailwind v4 (tokens via `@theme inline`), shadcn style `base-nova` on `@base-ui/react`, class-variance-authority, lucide-react.

**Spec:** The Claude Design canvas https://claude.ai/artifact/QNn3VDL85mL18qFQ5ufch4 (board "Primitives — Light / Dark"). Values below were read from it. Companion docs (not in the repo): `narrator-design-brief.md`, `narrator-design-system-inventory.md`.

## Global Constraints

- **Do not change behaviour.** No prop renames, no removed exports, no changed `data-slot` names, no changed base-ui imports.
- **Colours only through tokens** (`bg-card`, `text-muted-foreground`, `border-border`, `bg-brand`…). No hex literals, no `oklch()` literals in components.
- **Radius is 0 everywhere.** Delete every `rounded-*` utility in the files you touch (including `rounded-[min(var(--radius-md),10px)]`). Exception: none (switch, checkbox, slider, progress, avatar, skeleton are all square in the design).
- **Focus ring:** one global rule (Task 1). In components delete `outline-none`, `focus-visible:border-ring`, `focus-visible:ring-*`, `focus-visible:ring-ring/*`. Do not add per-component focus styles.
- **Invalid state:** `aria-invalid:border-destructive`. Delete `aria-invalid:ring-*` and `dark:aria-invalid:*`.
- **Disabled state:** `disabled:opacity-45` (design uses 0.45).
- **Touch targets:** inputs, selects, tabs, sidebar items 44px (`h-11`). Default button 40px (`h-10`).
- **Type:** UI font Onest (`font-sans`, also `font-heading`). Reading text (descriptions, alert/dialog/card body copy, empty-state titles) uses `font-serif` (Literata).
- **Small caps style** (buttons, badges, field labels, section labels): `uppercase font-semibold` with `text-[11px] tracking-[0.08em]` (buttons, labels) or `text-[10px] tracking-[0.06em]` (badges).
- **Shadows:** only on floating layers. Popover/menu/select: `shadow-[0_12px_28px_-12px_rgba(0,0,0,0.35)]`. Dialog: `shadow-[0_24px_48px_-16px_rgba(0,0,0,0.5)]`. Toast: `shadow-[0_12px_28px_-12px_rgba(0,0,0,0.45)]`. Nothing else has a shadow.
- **Every string stays i18n.** Do not add visible text to primitives.
- Work on the current branch (no new branch). Commit locally after each task. Never push.
- Gate after every task: `pnpm build`, `pnpm lint`, `pnpm format:check` all pass. Run `pnpm exec prettier --write <files>` on edited files first. Do not leave `pnpm dev` running.

## Review Focus

- **Long Russian labels in uppercase 11px buttons** may overflow a fixed height: buttons keep `whitespace-nowrap`; check Library/Book toolbars for wrapping at 375px.
- **Dark theme contrast:** primary button, badge outline and muted text on `bg-card` must be readable; destructive in dark uses a separate text colour (`text-destructive-text`).
- **Switch and checkbox hit areas** must stay ≥44px tall via the existing `after:-inset-*` trick; do not delete those `after:` classes.
- **Base-ui state attributes** (`data-checked`, `data-unchecked`, `data-active`, `data-highlighted`, `data-popup-open`) differ from Radix; keep the attribute names already in each file.
- **Leftover `rounded-full`** on avatars/switch/progress makes round shapes appear against the square system.

---

## Task 0: Baseline

**Files:** none edited.

- [ ] **Step 1:** The working tree already holds the uncommitted token/font change (files `package.json`, `pnpm-lock.yaml`, `src/app/styles/index.css`, `docs/history.md`).
- [ ] **Step 2:** Run `pnpm build && pnpm lint && pnpm format:check`. Expected: all pass.
- [ ] **Step 3:** `git add -A && git commit -m "Paper & ink tokens and fonts"`.

---

## Task 1: Token corrections and global rules

**Files:** Modify `src/app/styles/index.css`, `docs/history.md`.

**Produces:** tokens `brand`, `destructive-foreground`, `destructive-text`; font utility `font-serif`; global focus ring. Later tasks use these names exactly.

- [ ] **Step 1: Fonts.** In `@theme inline` set `--font-heading: 'Onest Variable', system-ui, sans-serif;` (was Literata — a mistake: card/dialog titles are Onest) and add `--font-serif: 'Literata Variable', Georgia, serif;`.
- [ ] **Step 2: Destructive tokens.** In `@theme inline` add `--color-destructive-foreground: var(--destructive-foreground);` and `--color-destructive-text: var(--destructive-text);`. In `:root` add `--destructive-foreground: #f3f0e8;` and `--destructive-text: #a3161c;` (keep `--destructive: #a3161c`). In `.dark` set `--destructive: #d2342f;` (was `#ef6a60`) and add `--destructive-foreground: #f7f3ea;` `--destructive-text: #ef6a60;`.
- [ ] **Step 3: Sidebar tokens** (sidebar uses the "secondary" paper, active item one step darker). `:root`: `--sidebar: #cfccc2; --sidebar-accent: #c2bfb4;`. `.dark`: `--sidebar: #262624; --sidebar-accent: #232321;`. Leave other sidebar tokens.
- [ ] **Step 4: Global rules** inside `@layer base`:
  - replace `* { @apply border-border outline-ring/50; }` with `* { @apply border-border; }`;
  - add `:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }`;
  - add `.lucide { stroke-width: 1.6; stroke-linecap: square; stroke-linejoin: miter; }` (design icons are 1.6px, square caps);
  - add `@media (prefers-reduced-motion: reduce) { *, ::before, ::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }`.
- [ ] **Step 5:** Add a `docs/history.md` entry under "Recent changes": `Paper & ink primitives: restyled shared/ui primitives to the new design (square, 44px targets, cobalt focus ring); adds destructive-foreground/text tokens and a serif reading font.`
- [ ] **Step 6:** Gate (see Global Constraints). Commit `Token corrections and global focus rule`.

---

## Task 2: Button and ButtonGroup

**Files:** Modify `src/shared/ui/button.tsx`, `src/shared/ui/button-group.tsx`.

- [ ] **Step 1: Base string of `buttonVariants`.** Remove `rounded-lg`, `bg-clip-padding`, `outline-none`, `focus-visible:border-ring`, `focus-visible:ring-3`, `focus-visible:ring-ring/50`, `active:not-aria-[haspopup]:translate-y-px`, all `aria-invalid:*` and `dark:aria-invalid:*` except `aria-invalid:border-destructive`. Change `text-sm font-medium` to `text-[11px] font-semibold tracking-[0.08em] uppercase`, and `disabled:opacity-50` to `disabled:opacity-45`. Keep `inline-flex shrink-0 items-center justify-center border border-transparent whitespace-nowrap transition-colors select-none disabled:pointer-events-none` and the `[&_svg]` rules.
- [ ] **Step 2: Variants.**
  - `default`: `border-primary bg-primary text-primary-foreground hover:bg-primary/90`
  - `outline`: `border-border bg-transparent text-foreground hover:bg-muted aria-expanded:bg-muted`
  - `secondary`: `border-secondary bg-secondary text-secondary-foreground hover:bg-secondary/80`
  - `ghost`: `text-foreground hover:bg-muted aria-expanded:bg-muted`
  - `destructive`: `border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90`
  - `link`: `text-foreground text-sm font-medium tracking-normal normal-case underline underline-offset-[3px] hover:text-destructive-text`
    Delete all `dark:` overrides in this block.
- [ ] **Step 3: Sizes** (keys unchanged):
  - `default`: `h-10 gap-2 px-3.5`
  - `xs`: `h-7 gap-1 px-2 text-[10px]`
  - `sm`: `h-8 gap-1.5 px-2.5 text-[10px]`
  - `lg`: `h-12 gap-2 px-5 text-xs`
  - `icon`: `size-10`; `icon-xs`: `size-7`; `icon-sm`: `size-8`; `icon-lg`: `size-12`
    Keep the `has-data-[icon=inline-*]` padding tweaks on default/lg. Remove every `rounded-*` and `in-data-[slot=button-group]:rounded-lg`. SVG sizes: default/lg/icon `size-4`, xs/sm `size-3.5`.
- [ ] **Step 4: `button-group.tsx`.** Delete every `rounded-*` class. Grouped buttons overlap borders by 1px: ensure children after the first have `-ml-px` (horizontal group) and the pressed/active child (`aria-pressed=true`) gets `z-10`. Keep the file's existing selectors otherwise.
- [ ] **Step 5:** Gate. `grep -n "rounded" src/shared/ui/button.tsx src/shared/ui/button-group.tsx` must print nothing. Commit `Restyle button and button group`.

---

## Task 3: Badge

**Files:** Modify `src/shared/ui/badge.tsx`.

- [ ] **Step 1: Base string.** Replace with: `group/badge inline-flex h-5.5 w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden border border-transparent px-2 text-[10px] font-semibold tracking-[0.06em] whitespace-nowrap uppercase transition-colors has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive [&>svg]:pointer-events-none [&>svg]:size-3!`. (`h-5.5` = 22px.)
- [ ] **Step 2: Variants.**
  - `default`: `bg-primary text-primary-foreground [a]:hover:bg-primary/90`
  - `secondary`: `bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80`
  - `destructive`: `bg-destructive text-destructive-foreground [a]:hover:bg-destructive/90`
  - `outline`: `border-border text-foreground [a]:hover:bg-muted`
  - `ghost`: `hover:bg-muted`
  - `link`: `text-foreground normal-case underline underline-offset-[3px] hover:text-destructive-text`
  - **new** `brand`: `border-brand text-brand` (used later for "Generating"/"Connected").
- [ ] **Step 3:** Gate. No `rounded` left in file. Commit `Restyle badge, add brand variant`.

---

## Task 4: Form controls (Input, Textarea, Label, Field, Select)

**Files:** Modify `src/shared/ui/input.tsx`, `textarea.tsx`, `label.tsx`, `field.tsx`, `select.tsx`.

- [ ] **Step 1: Input class string** becomes: `h-11 w-full min-w-0 border border-input bg-card px-3.5 text-[15px] transition-colors file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45 aria-invalid:border-destructive`.
- [ ] **Step 2: Textarea** same treatment: `min-h-20 w-full border border-input bg-card px-3.5 py-3 text-[15px] leading-normal ...` (keep `field-sizing-content`, placeholder, disabled, `aria-invalid:border-destructive`). Remove rounded, ring, `dark:` classes.
- [ ] **Step 3: Label.** Base string: `flex items-center gap-2 text-[11px] leading-none font-semibold tracking-[0.08em] text-muted-foreground uppercase select-none` + keep the two existing `disabled`/`peer-disabled` groups.
- [ ] **Step 4: Field.** Read `field.tsx`. `FieldDescription`: `text-[13px] text-muted-foreground`. `FieldError`: `text-[13px] text-destructive-text`. `FieldLabel`/`FieldTitle` follow the Label style from Step 3 (uppercase 11px). Remove `rounded-*`. Keep `gap-2` between label, control, hint (design: 8px).
- [ ] **Step 5: Select** (read the file; popup parts are `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectSeparator`, scroll buttons).
  - Trigger: same box as Input (`h-11 border border-input bg-card px-3.5 pr-3 text-[15px]`), open state `data-popup-open:border-foreground` (use the attribute already used in the file), chevron icon `size-4`. Remove rounded/ring.
  - Content (popup): `bg-popover text-popover-foreground ring-1 ring-border p-1 shadow-[0_12px_28px_-12px_rgba(0,0,0,0.35)]`. Remove rounded and any `shadow-md`/`ring-foreground/10`.
  - Item: `h-10 px-2.5 text-sm`; highlighted `data-highlighted:bg-secondary`; selected item `font-semibold` with the check icon at the right end. Remove rounded.
- [ ] **Step 6:** Gate. `grep -n "rounded\|ring-3\|ring-ring" ` on the five files prints nothing. Commit `Restyle form controls and select`.

---

## Task 5: Checkbox, Switch, Slider

**Files:** Modify `checkbox.tsx`, `switch.tsx`, `slider.tsx` in `src/shared/ui/`.

- [ ] **Step 1: Checkbox root:** `size-5 border-[1.5px] border-muted-foreground bg-card` (unchecked), checked `data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground` (keep whatever data attribute the file already uses). Delete rounded, focus ring, `dark:` classes. **Keep** the `after:absolute after:-inset-x-3 after:-inset-y-2` hit area. Icon `size-3.5`. Disabled `opacity-45`.
- [ ] **Step 2: Switch.** Default size: track `h-6 w-11`, `border border-border bg-secondary`, checked `data-checked:border-primary data-checked:bg-primary`. Thumb: `size-[18px] bg-muted-foreground data-checked:bg-primary-foreground`, unchecked offset `translate-x-0.5`, checked `translate-x-[21px]`. Small size scaled: track `h-5 w-9`, thumb `size-3.5`, checked `translate-x-[17px]`. Remove rounded-full, ring, `dark:`. Keep `after:` hit area.
- [ ] **Step 3: Slider.** Track `h-1 bg-border` (no rounded), range `bg-primary`, thumb `size-3.5 bg-primary` with no border, no ring, no rounded, no `bg-white`. Keep `after:-inset-2` hit area. Remove hover/active ring classes.
- [ ] **Step 4:** Gate. `grep -n "rounded" ` on the three files prints nothing. Commit `Restyle checkbox, switch, slider`.

---

## Task 6: Card, Separator, Skeleton, Progress, Avatar

**Files:** Modify `card.tsx`, `separator.tsx`, `skeleton.tsx`, `progress.tsx`, `avatar.tsx`.

- [ ] **Step 1: Card.** In `Card` replace `rounded-xl` and `ring-1 ring-foreground/10` with `ring-1 ring-border`; delete `*:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl`. `CardHeader`: delete `rounded-t-xl`. `CardFooter`: delete `rounded-b-xl`, change `bg-muted/50` to `bg-transparent`. `CardTitle`: `font-heading text-base leading-snug font-semibold` (was `font-medium`). `CardDescription`: `font-serif text-sm text-muted-foreground`.
- [ ] **Step 2: Separator:** no change (already `bg-border`, 1px). Confirm only.
- [ ] **Step 3: Skeleton:** `animate-pulse bg-secondary motion-reduce:animate-none` (delete `rounded-md bg-muted`).
- [ ] **Step 4: Progress.** Track: `h-1 bg-border` (delete `rounded-full`, `bg-muted`). Indicator: `bg-brand` (was `bg-primary`). `ProgressValue` keep.
- [ ] **Step 5: Avatar.** Sizes: default `size-9`, `data-[size=lg]:size-11`, `data-[size=sm]:size-7`. Delete every `rounded-full` and the `after:` border overlay (`after:absolute after:inset-0 after:rounded-full after:border ...mix-blend...`). Fallback: `bg-brand text-card text-[13px] font-bold` (delete `bg-muted text-muted-foreground`). `AvatarBadge`, `AvatarGroup`, `AvatarGroupCount`: delete rounded, keep sizes.
- [ ] **Step 6:** Gate. `grep -n "rounded" ` on the five files prints nothing. Commit `Restyle card, skeleton, progress, avatar`.

---

## Task 7: Tabs, Breadcrumb, Sidebar

**Files:** Modify `tabs.tsx`, `breadcrumb.tsx`, `sidebar.tsx`.

- [ ] **Step 1: Tabs** (app uses `variant="line"` only). `TabsList` line variant: `h-11 gap-7 border-b border-border p-0` (remove `rounded-lg`, `p-[3px]`, `bg-muted`). `TabsTrigger`: `h-11 flex-none px-0 text-[15px] font-medium text-muted-foreground hover:text-foreground`; active `data-active:font-semibold data-active:text-foreground`; underline is the existing `after:` bar: set `after:h-0.5 after:bg-foreground` and `group-data-horizontal/tabs:after:bottom-0` (was `-5px`), opacity 100 when active. Delete rounded, ring, border and `dark:` classes.
- [ ] **Step 2: Breadcrumb.** `BreadcrumbList`: `text-xs font-semibold tracking-[0.06em] uppercase text-muted-foreground gap-2.5`. `BreadcrumbLink`: `text-muted-foreground no-underline hover:text-foreground`. `BreadcrumbPage`: `text-foreground`. `BreadcrumbSeparator`: default child is the text `/` instead of the chevron icon (keep prop override working). Remove rounded.
- [ ] **Step 3: Sidebar** (719 lines; touch only these): delete every `rounded-*`; `SidebarMenuButton` size default `h-11 gap-3 px-3 text-[15px] font-medium`, active `data-active:bg-sidebar-accent data-active:font-semibold`; group label `text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground`; collapsed icon-only button `size-11`. Do not change any structure or provider logic.
- [ ] **Step 4:** Gate. `grep -c "rounded" src/shared/ui/sidebar.tsx` prints 0. Commit `Restyle tabs, breadcrumb, sidebar`.

---

## Task 8: Overlays (Tooltip, DropdownMenu, Dialog, AlertDialog)

**Files:** Modify `tooltip.tsx`, `dropdown-menu.tsx`, `dialog.tsx`, `alert-dialog.tsx`.

- [ ] **Step 1: Tooltip content:** `bg-foreground px-2.5 py-1.5 text-xs font-medium text-background` (delete `rounded-md`; arrow: delete `rounded-[2px]`).
- [ ] **Step 2: DropdownMenu** (read file). Content: `bg-popover text-popover-foreground ring-1 ring-border p-1 shadow-[0_12px_28px_-12px_rgba(0,0,0,0.35)]` (remove rounded, `shadow-md`, `ring-foreground/10`). Items: `h-10 gap-2.5 px-2.5 text-sm`, highlighted `data-highlighted:bg-secondary`, `variant="destructive"` item `text-destructive-text` and highlighted `data-highlighted:bg-secondary`. Separator `my-1 h-px bg-border` (remove negative margins if present). Checkbox/radio item indicators keep.
- [ ] **Step 3: Dialog** (read file). Overlay: `bg-foreground/45` (delete `bg-black/*`, `backdrop-blur-xs`, `supports-backdrop-filter:*`). Popup: `bg-background p-5 gap-4 ring-0 shadow-[0_24px_48px_-16px_rgba(0,0,0,0.5)]` (delete rounded, ring). `DialogTitle`: `font-heading text-xl font-semibold tracking-[-0.01em]`. `DialogDescription`: `font-serif text-sm text-muted-foreground`. `DialogFooter`: `flex justify-end gap-2` with no `bg-muted/50`, no `border-t`, no negative margins. Close button stays a ghost `icon-sm` button.
- [ ] **Step 4: AlertDialog:** identical treatment to Dialog (overlay, popup, title, description, footer). Footer buttons order and props unchanged.
- [ ] **Step 5:** Gate. `grep -n "rounded\|backdrop-blur" ` on the four files prints nothing. Commit `Restyle tooltip, menu, dialogs`.

---

## Task 9: Feedback (Alert, Toast, Empty, DataState)

**Files:** Modify `alert.tsx`, `toast.tsx`, `empty.tsx`, `data-state.tsx`.

- [ ] **Step 1: Alert.** Base: `group/alert relative grid w-full gap-1 border px-4 py-3.5 text-left text-sm ...` (delete `rounded-lg`, `px-2.5 py-2`); default variant `bg-card text-foreground border-border`; `destructive` variant `bg-card text-destructive-text border-destructive`. `AlertTitle`: `font-semibold`. `AlertDescription`: `font-serif text-sm leading-[1.45] text-muted-foreground`; in destructive variant description colour stays `text-destructive-text`. Icon `size-4`.
- [ ] **Step 2: Toast** (read file). Toast box: `bg-foreground text-background px-4 py-3 w-85 shadow-[0_12px_28px_-12px_rgba(0,0,0,0.45)]` (delete rounded, ring, `bg-popover`). `type === 'error'` variant: `bg-destructive text-destructive-foreground`. Title `text-sm`. Action button: outline-like on inverted background: `h-8 border border-current bg-transparent px-2.5 text-[10px] text-inherit` (keeps `render` default `Button size="sm"`; override via className). Close button: ghost `icon-sm` with `text-inherit`.
- [ ] **Step 3: Empty.** `Empty`: `border-[1.5px] border-dashed border-border min-h-44 p-4 gap-2.5` (delete rounded). `EmptyMedia` (icon variant): delete box background/size/rounded, keep icon `size-5 text-muted-foreground`. `EmptyTitle`: `font-serif text-[17px] font-medium`. `EmptyDescription`: `text-[13px] text-muted-foreground`.
- [ ] **Step 4: DataState / ErrorState / LoadingState** (`data-state.tsx`). `ErrorState` wrapper: `border border-destructive text-destructive-text` instead of dashed; title keeps `font-serif`. `LoadingState`: bordered box `border border-border text-muted-foreground`, spinner `size-4`, label `text-[10px] font-semibold tracking-[0.08em] uppercase`. Do not change props or the query logic.
- [ ] **Step 5:** Gate. `grep -n "rounded" ` on the four files prints nothing. Commit `Restyle alert, toast, empty, data state`.

---

## Task 10: Sweep and verify

**Files:** any file where a grep hits.

- [ ] **Step 1: Leftover shapes.** Run `grep -rn "rounded" src/shared/ui`. Delete remaining `rounded-*` classes in used primitives (all 28 above). Unused primitives may keep them (radius is 0 so they render square anyway).
- [ ] **Step 2: Leftover rings.** `grep -rn "focus-visible:ring\|ring-ring\|outline-none\|ring-3" src/shared/ui` — delete in the 28 used primitives; keep `outline-none` only if a file also sets its own `focus-visible:outline-*`.
- [ ] **Step 3: Call sites.** `grep -rn "rounded" src/pages src/widgets src/features` and review each hit: remove `rounded-*` that sits on elements which should be square (cards, inputs, thumbnails, covers). Keep `rounded-full` only for the language/theme dots if any. Two `Label` uses wrap non-field content: `src/pages/book/ui/BookCoverEditor.tsx:191` and `src/pages/library/ui/EpubUploadForm.tsx:144`; open each and, if the Label wraps a dropzone or large block, add `className="text-sm font-normal normal-case tracking-normal text-foreground"`.
- [ ] **Step 4: Gate.** `pnpm build && pnpm lint && pnpm format:check` pass.
- [ ] **Step 5: Manual check (human, `pnpm dev`, then stop the server).** With the backend running, open each page in light and dark at 375px and 1280px: `/login`, `/register`, `/library` (3 tabs), a book page, `/library/:id/reorganize`, `/models`. Confirm: square corners, visible cobalt focus on Tab, disabled controls at ~45% opacity, dialogs and menus have a shadow and no blur, no layout overflow with Russian locale.
- [ ] **Step 6:** Update the `docs/history.md` entry from Task 1 if scope changed. Commit `Sweep leftover shapes and rings`.

---

## Out of scope (decide separately)

- Page layout changes (Book, Reorganize, Models, Library) and app patterns: status badge set, chapter row, audio player, model card.
- The "Island" floating player/queue (new feature).
- Success/warning tokens, logo and favicon, public pages.
- Restyling the ~27 installed but unused primitives.
