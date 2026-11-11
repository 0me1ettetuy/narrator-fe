# Unused UI primitives still in the old style

Status: deferred. These `src/shared/ui` primitives are not imported by any app
file, so they were left out of the Paper & ink restyle. They still carry the
old shadcn look (rounded corners, 3px focus rings, 32px heights).

- **Still rounded (24):** accordion, calendar, carousel, chart, combobox,
  command, context-menu, drawer, hover-card, input-otp, item, kbd, menubar,
  native-select, navigation-menu, popover, radio-group, resizable,
  scroll-area, toggle-group, plus the chat leftovers below that have rounded
  classes (attachment, bubble, message, questionnaire).
- **Chat leftovers, probably dead:** attachment, bubble, marker, message,
  message-scroller, questionnaire, direction. Confirm they have no importers,
  then delete them.
- **Also unused, no styling to change:** aspect-ratio, pagination, table.

**When one is first used:** restyle it to match the app's primitives (square
corners, `border-input`, 44px controls, 45% disabled, global cobalt focus
outline, `font-serif` for body text in popups) and add a history entry.

**Not checked after the restyle:** light and dark themes, 375px and 1280px,
Russian label overflow, keyboard-opened popups showing the cobalt outline, and
the border colour of a button inside a toast. All need a browser.
