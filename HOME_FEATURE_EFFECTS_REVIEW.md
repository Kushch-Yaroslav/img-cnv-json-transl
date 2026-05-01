# Home Feature Effects Review

Scope: only Home page, tool cards, drag/drop/open effects, DropDock, Home composables, and Header interactions related to Home navigation. No code changes were made.

## Files Reviewed

- `client/client/src/Pages/Home/HomePage.vue`
- `client/client/src/Pages/Home/HomePage.module.css`
- `client/client/src/Pages/Home/config/toolsConfig.ts`
- `client/client/src/Pages/Home/Composables/useCards.ts`
- `client/client/src/Pages/Home/Composables/useDragCards.ts`
- `client/client/src/Pages/Home/Composables/useMagnet.ts`
- `client/client/src/Pages/Home/Composables/useTilt.ts`
- `client/client/src/components/DropDock/DropDock.vue`
- `client/client/src/components/DropDock/DropDock.module.css`
- `client/client/src/components/Header/Header.vue`
- `client/client/src/components/Header/Header.module.css`

## Current Interactive Capabilities

### Home Tool Cards

`HomePage.vue` renders one featured tool and a grid of normal tool cards.

The featured card is `All-in-One Image Optimizer` and navigates directly to `/convert`. It is not draggable and does not use the dock behavior.

The normal grid cards come from `getHomeTools(appConfig.mode)` in `toolsConfig.ts`. Current cards are:

- `Compress Images` -> `/compress`
- `Resize Images` -> `/resize`
- `Convert Format` -> `/convert-format`
- `Crop Images` -> `/crop`
- `Remove BG` -> `/remove-bg`
- `Upscale` -> `/upscale`
- `Translate` -> `/translate`

Availability is mode-aware:

- In `local` / `development`, commercial tools are `available`.
- In `free` / `pro`, commercial tools are `coming-soon`.

Disabled cards remain visible but do not navigate or start drag in `HomePage.vue`.

### Card Opening

Available normal cards use `onToolClick`, which delegates to `onCardClick` from `useCards`. That function:

- Reads the click position.
- Sets CSS variables `--ripple-x` and `--ripple-y`.
- Adds a `cardRippling` CSS module class.
- Delays `router.push(to)` by `260ms`.

This means card navigation is currently coupled to a visual click effect and a delayed route transition.

The featured All-in-One card bypasses `onCardClick` and directly calls `router.push(to)`, so its behavior is simpler and does not use the ripple delay.

### Hover And Motion Effects

`useCards` registers DOM refs for card wrappers and card inner elements. On mount it initializes:

- Magnet effect for the page title.
- Magnet effect for each card wrapper.
- Tilt/glare/shadow effect for each card inner element.

`useMagnet` uses GSAP and global `pointermove`, `resize`, `scroll`, and `ResizeObserver` to pull elements toward the pointer. For cards it is `onlyHover: true`; for the title it is always active after attach.

`useTilt` is manual CSS-variable based tilt:

- `--tilt-rx`
- `--tilt-ry`
- `--tilt-scale`
- `--glare`

`HomePage.module.css` uses those variables for 3D-like transform, shine/glare, card enter animation, soft floating animation, disabled styling, drag avatar styling, ghost styling, and reduced-motion handling.

### Drag And Reorder

Available normal cards can be long-pressed and dragged. The drag starts after `LONG_PRESS_MS = 100`.

`useDragCards` behavior:

- On pointer down, it records the card element, link element, pointer start, shift, current index, and timer.
- If pointer drift exceeds `TAP_SLOP = 6` before the long press starts, the timer is canceled.
- Once drag starts, it clones the card into an avatar attached to `document.body`.
- It creates a ghost placeholder after the original link and hides the original link.
- While dragging inside the grid active area, it moves the ghost and plays FLIP-style transitions.
- On pointer up outside the dock, it commits reorder by replacing `itemsRef.value`.

This means grid order is mutable during the current Home session, but it is not persisted.

### Dock / Open On Home

`DropDock` is exposed through a template ref. `HomePage` shows it in two cases:

- On card hover after a 1000ms timer: `dockRef.value?.show('hover')`.
- During drag start: `dockRef.value?.show('drag')`.

The dock has two concepts:

- A sticky drop zone near the bottom.
- A list of opened tool cards above it.

When a dragged card is released inside the dock rectangle:

- `useDragCards` calls `dropToDock(item)`.
- `DropDock.add(item)` pushes the item into a local reactive `opened` array.
- `DropDock` emits `opened:add`.
- `HomePage` adds the path to `hiddenPaths`.
- `visibleItems` filters that path out of the grid.
- `DropDock` renders the mapped Vue component via `<component :is="componentMap[it.path]" />` inside `<KeepAlive>`.

Closing a dock card removes it from `opened`, emits `opened:remove`, and `HomePage` removes the path from `hiddenPaths`, making the card visible in the grid again.

### State Model

Local Home state:

- `items`: ordered list of `HomeTool`.
- `ready`: enables enter animations.
- `hiddenPaths`: paths currently opened in the dock.
- `dockHoverTimer`: timer for delayed dock reveal.
- `dragging`: returned from `useDragCards`.
- `cardTilt`: returned from `useCards`.

Local DropDock state:

- `opened`: reactive array of opened tools.
- `visible`: whether drop zone is visible.
- `armed`: whether it was shown for active drag.
- `zone`: drop zone DOM ref.

No Home interaction state is persisted to storage or global store. Refreshing the page resets order, pinned/opened tools, dock state, and hidden cards.

## Product Feature Mapping

### Free Feature Candidates

- Basic Home navigation cards.
- Featured All-in-One entry point.
- Hover polish: card hover, focus ring, simple enter animation.
- Coming soon visibility for commercial tools.

These improve perceived quality but do not create a complex workspace contract.

### Pro Feature Candidates

- Custom workspace with opened tools rendered directly on Home.
- Pinned tools / quick access dock.
- Draggable card ordering.
- Drag-to-open workflow.
- Persisted card order and dock contents.
- Multiple tools visible together through `DropDock`.

This is the clearest commercial angle: "workspace customization" rather than "visual effects". The current behavior already resembles a lightweight workspace builder, but needs stabilization before being sold.

### Local / Dev Only Candidates

- Opening experimental tools such as Remove BG, Upscale, Translate while they are not product-ready.
- Rendering real tool components inside Home through `DropDock`.
- Any workflow involving unfinished or heavy tools.

Current config already supports this direction by marking commercial tools as available only in `local/development`.

### Experimental Feature Candidates

- Magnetic card attraction.
- 3D tilt/glare.
- Long-press drag threshold behavior.
- FLIP reorder animation.
- Drop-to-dock avatar transition.

These are good demos, but should be treated as experimental until edge cases, accessibility, and persistence are handled.

## Risks And Fragile Areas

### Routing Is Mixed With Effects

`useCards` owns `router.push` and click animation timing. This couples visual feedback to navigation. If cards later become buttons, pinned tiles, or workflow nodes, the click effect and route transition will be harder to reuse separately.

Recommendation: later split into `useCardEffects` and a page-level navigation handler. Do not do this yet unless adding a real Pro workspace setting.

### DOM Queries Depend On CSS Module Class Names

`HomePage` retrieves card elements using `querySelectorAll('.${s.cardMover}')` and `closest('.${s.cardLink}')`. `useDragCards` also queries `.${opts.s.cardLink}` and ghost classes.

This is workable, but fragile. Renaming CSS module classes or changing markup can break drag/drop silently.

### `cardRippling` Looks Undefined In CSS

`useCards` adds `s.cardRippling`, but `HomePage.module.css` defines `.ripple` and `@keyframes rippleFade`; there is no visible `.cardRippling` class in the reviewed CSS. So the delayed navigation still happens, but the intended ripple may be missing or incomplete.

This is a low-risk cleanup candidate later.

### Drag Item Index Can Drift From Visible Items

`useDragCards` mutates `itemsRef`, while `HomePage` renders `visibleItems`, which filters out dock-opened cards. `getItemByIndex` uses `visibleItems.value[i]`, but reorder commit uses `itemsRef.value.length` and `startIndex/currentIndex` from the rendered grid.

This is acceptable when no hidden cards exist or when hidden cards are at positions that do not affect expectations. It can become incorrect if multiple cards are opened in the dock and the user reorders the remaining visible cards.

### Dock Allows Duplicate Opens

`DropDock.add` pushes items into `opened` without checking for existing paths. Because `hiddenPaths` hides a card after open, duplicates are less likely through normal UI, but the component itself does not enforce uniqueness.

### Opened Tools Render Full Feature Components Inside Home

`DropDock` renders full pages/components with `<KeepAlive>`. For Convert-like tools this can be heavy and can create nested page layouts inside Home. It also means Home owns a map of feature components.

This is powerful for a Pro workspace, but risky as a default UX because full tool pages were not designed as embedded widgets.

### Hardcoded Behavior

Examples:

- Drag thresholds are constants inside `useDragCards`.
- Dock hover reveal is hardcoded to 1000ms in `HomePage`.
- Dock protection only blocks `/home` and `/main`.
- `componentMap` is hardcoded in `HomePage`.
- Commercial availability logic is split between `toolsConfig.ts` and `Header.vue`.

These should move toward config only if the feature graduates into product behavior.

### Accessibility And Mobile Risk

Drag requires pointer interactions and long press. Keyboard reorder, screen reader affordances, and explicit "pin/open" buttons are missing. Touch behavior may conflict with scroll because drag starts after 100ms and uses `prevent` on pointerdown in the template.

For Pro positioning, the feature needs accessible non-drag controls.

### Header Interactions Are Adjacent But Separate

Header uses `appConfig.mode` to decide if Remove BG / Upscale / Translate are links or disabled spans. This is related product gating, but it is not part of the Home workspace state. Similar availability logic exists in Home config, which creates a future consistency risk.

## Recommended Safe Plan

### Leave As Is For Now

- Keep Home cards and featured All-in-One block.
- Keep current dock behavior in local/dev as an exploratory interaction.
- Keep current `DropDock` rendering model until there is a clearer widget contract.
- Keep commercial tools visible as coming soon.

### Extract To Config Later

- Dock eligibility per tool: `dockable: boolean`.
- Draggable/reorderable flag per tool: `draggable: boolean`.
- Tool component key instead of direct `componentMap` in `HomePage`.
- Per-mode availability so Header and Home share the same source.
- Feature labels like `Free`, `Pro`, `Experimental`, `Coming soon`.

### Good Pro-Only Candidates

- Persisted custom Home layout.
- Pinned quick access dock.
- Open multiple tools on Home.
- Reorder tool cards.
- Drag-to-dock workflow builder.
- Saved workspaces/presets.

The marketable feature should be "custom workspace and quick access", not "animations".

### Keep Experimental For Now

- Magnetic attraction.
- 3D tilt/glare.
- FLIP reorder animation.
- Long-press drag.
- Embedded full pages in dock.

These need hardening and accessibility before becoming a paid promise.

### Better Not To Touch Yet

- Do not refactor `DropDock` into global state yet.
- Do not persist `items` order yet.
- Do not split full feature pages into dock widgets yet.
- Do not make drag/drop a paid gate until there is a fallback open/pin button.
- Do not move Home into a new architecture layer yet.

## First Safe Follow-Ups

1. Add `dockable`, `draggable`, and `productTier` fields to `HomeTool` config, but keep current behavior unchanged.
2. Move Header commercial link availability to shared tool config so Home and Header do not drift.
3. Add uniqueness guard in `DropDock.add` by path.
4. Fix or remove the unused/missing `cardRippling` CSS connection.
5. Add an explicit "Open in workspace" or pin button before making dock behavior Pro-only.
6. Add local persistence only after the reorder/dock index issue is resolved.

## Summary

The Home page already contains the foundation for a commercial "custom workspace" feature: draggable cards, reorder, dock reveal, drag-to-open, opened tool panels, and mode-aware availability. The current implementation is best treated as experimental/local-dev UX. The safest product direction is to keep basic cards free, reserve persisted workspace/dock customization for Pro later, and avoid selling the visual effects themselves until the interaction model is more robust.
