# Frontend Architecture Review

Scope: only `client` frontend code: Vue, TypeScript, state, components, composables, routing, styles, Vite/build config. Backend, Python, AI/ML implementation details were intentionally not reviewed.

## Current Architecture Summary

The frontend is a Vue 3 + TypeScript + Vite app located in `client`. It uses `vue-router`, CSS modules, and a small set of page-level composables. There is no centralized state manager and no dedicated API/client layer.

Current high-level structure:

```txt
client/src
  App.vue
  main.ts
  style.css
  Router/
    router.ts
  Layouts/
    FXLayout/
  Pages/
    Home/
    ConvertPage/
    RemoveBgPage/
    UpscalePage/
    JsonTranslatePage/
    MainPage/
  Shared/
    Components/
    Helpers/
  components/
    Header/
    DropDock/
    PipelineHard.vue
  Lib/
    gsapClient.ts
```

The code already has a useful feature-based direction: `Pages/ConvertPage`, `Pages/RemoveBgPage`, `Pages/UpscalePage`, and `Pages/JsonTranslatePage` each contain local composables. That is a good base. The main issue is that the boundaries are not consistent: page components, composables, API calls, browser APIs, file download logic, object URL management, and image/canvas logic are mixed inside the same layer.

Important examples:

- `ConvertPage.vue` composes the page reasonably, but owns crop modal orchestration and passes raw `File` objects directly through UI events.
- `OptionsPanel.vue` is both UI and option business behavior: format controls, resize variants, presets, and `inFolders` auto-toggle logic live in the same component.
- `CropModal.vue` is a large smart component with modal UI, canvas rendering, crop geometry, pointer/touch handling, bitmap loading, MIME inference, and output file creation in one file.
- `useConvert.ts`, `useRmbgBatch.ts`, `useUpscaleBatch.ts`, `useJsonTranslate.ts`, and `PipelineHard.vue` all repeat the same pattern: create `FormData`, call `fetch`, read `Blob`, create object URL, create `<a>`, trigger download.
- `vite.config.ts` hardcodes backend proxy targets and routes.

## Main Problems

### 1. Directory Naming And Layer Boundaries Are Inconsistent

There are both `Shared/Components` and `components`, plus capitalized folders like `Pages`, `Router`, `Layouts`, `Lib`. This is not technically wrong, but it reads as organically grown rather than intentionally structured.

Recommended direction: use one convention and one responsibility per layer:

- `app/` for app bootstrap, router, providers.
- `pages/` or `features/` for route-level screens.
- `shared/ui/` for reusable presentational components.
- `shared/lib/` for pure helpers.
- `shared/api/` for HTTP client and endpoint wrappers.
- `shared/platform/` for browser/desktop adapters.
- `entities/` or `domain/` for shared app models such as files, export options, image operations, presets.

This can be done gradually. Do not move everything at once.

### 2. UI, Business Logic, And Platform Logic Are Mixed

The largest concern is not file size alone. The concern is that different reasons to change are coupled together.

Examples:

- `CropModal.vue` handles UI, crop math, canvas rendering, file creation, body scroll locking, and global event listeners.
- `useConvert.ts` handles operation state, API request serialization, endpoint selection, response handling, and browser download.
- `useRmbgPreviews.ts` owns preview state and API cancellation, but also directly creates/revokes object URLs.
- `HomePage.vue` contains route metadata, drag behavior wiring, dock component map, visibility state, and direct component imports.

This makes later desktop packaging harder because browser-specific behavior is scattered across feature code.

### 3. Repeated API And Download Code

The following logic is repeated in multiple places:

- Build `FormData`.
- `fetch('/some-endpoint', { method: 'POST', body })`.
- Validate `resp.ok`.
- Read `Blob`.
- `URL.createObjectURL(blob)`.
- Create an anchor element.
- Trigger `a.click()`.
- Revoke object URL.

This appears in convert, remove background, upscale, JSON translate, and pipeline flows. It should become shared infrastructure:

- `shared/api/httpClient.ts`
- `shared/api/imageToolsApi.ts`
- `shared/platform/downloadAdapter.ts`
- `shared/platform/objectUrlRegistry.ts`

### 4. Components That Should Be Split

Most important candidates:

- `CropModal.vue` at 484 lines: split into a container and smaller units.
- `OptionsPanel.vue` at 203 lines plus 350 lines of CSS: split into format, resize, multi-resize presets, quality, metadata options, and folder behavior.
- `HomePage.vue` and `useDragCards.ts`: home routing, dock behavior, drag behavior, and card metadata should be separated.
- `PipelineHard.vue`: currently looks like a prototype component and should move into a feature module or be hidden behind feature flags.

Suggested splits:

```txt
features/convert/
  ui/
    ConvertPage.vue
    ConvertOptionsPanel.vue
    FormatSection.vue
    ResizeSection.vue
    MultiResizeSection.vue
    PreviewGrid.vue
    CropModal.vue
    CropCanvas.vue
  model/
    useConvertFiles.ts
    useConvertOptions.ts
    useCropEditor.ts
  lib/
    cropGeometry.ts
    resizePresets.ts
    convertFormData.ts
  api/
    convertApi.ts
```

### 5. State Is Mostly Local, Which Is Fine For Now

Current state is held in local refs/reactive objects:

- Convert files: `useFiles`.
- Convert options: `useOptions`.
- Crop modal state: `ConvertPage.vue` and `CropModal.vue`.
- Remove BG files and preview state: `useRmbgFiles`, `useRmbgPreviews`.
- Upscale files/preview/options: page refs plus `useUpscaleFiles`, `useUpscalePreview`, `useUpscaleBatch`.
- JSON translate file/status/preview: `useJsonTranslate`.
- Home dock/opened tools: `HomePage.vue` and `DropDock.vue`.

This is acceptable while each route is isolated. A global Pinia store is not critical yet. I would introduce Pinia only when one of these becomes true:

- The same files/settings must survive route changes.
- Multiple tools share a queue/history.
- Free/pro limits need app-wide enforcement.
- Desktop app needs a persistent settings/profile layer.
- Long-running operations need shared progress/status/errors outside a single page.

Before Pinia, a better first step is typed feature composables plus small shared services. If a store is added later, keep it thin and domain-focused:

- `useWorkspaceStore`: selected files, sessions, recent operations.
- `useExportSettingsStore`: reusable export defaults.
- `useEntitlementsStore`: mode, feature flags, limits.
- `useJobStore`: active jobs, progress, errors.

### 6. Version Modes Need A Config Layer

There is no app mode abstraction today. Vite only uses `import.meta.env.BASE_URL` in router setup, and backend proxy target is hardcoded in `vite.config.ts`.

Recommended app config:

```txt
src/shared/config/
  appMode.ts
  features.ts
  limits.ts
  endpoints.ts
```

Example model:

```ts
export type AppMode = 'local' | 'development' | 'free' | 'pro'

export interface AppConfig {
  mode: AppMode
  apiBaseUrl: string
  features: {
    removeBg: boolean
    upscaleAi: boolean
    batchExport: boolean
    pipelineHard: boolean
  }
  limits: {
    maxFiles: number
    maxFileSizeMb: number
    maxBatchMegapixels: number
    previewConcurrency: number
  }
}
```

Use `VITE_APP_MODE`, `VITE_API_BASE_URL`, and optional `VITE_ENABLE_*` variables. Avoid duplicating code per edition. Edition differences should be config and entitlement checks, not separate components.

### 7. Desktop Readiness Issues

The app is strongly browser-oriented right now. That is normal for a Vite app, but the browser APIs are not isolated.

Browser-only API usage that should be wrapped before Electron/Tauri packaging:

- `fetch` to relative backend paths.
- `File`, `Blob`, `FormData`.
- `URL.createObjectURL` and `URL.revokeObjectURL`.
- `document.createElement('a')` for downloads.
- `document.body` scroll locking.
- `window` global event listeners and timers.
- `createImageBitmap`, `canvas`, `toBlob`.
- Drag-and-drop `DataTransfer`.

Recommended adapter layer:

```txt
shared/platform/
  platform.ts
  browserPlatform.ts
  desktopPlatform.ts
  fileSystemAdapter.ts
  downloadAdapter.ts
  objectUrlAdapter.ts
  imageBitmapAdapter.ts
```

The UI should call intentions like `downloadBlob(blob, filename)`, `createPreviewUrl(file)`, `readImageDimensions(file)`, and `pickFiles()` rather than directly touching DOM APIs everywhere.

For Electron/Tauri specifically:

- Relative API URLs may not behave the same when served from `file://` or a custom protocol.
- Browser download via anchor click may not map to a user-selected desktop path.
- Large file operations through browser memory can become expensive.
- `createImageBitmap` support can differ depending on runtime/webview.
- CSP and asset loading rules may affect object URLs and workers.

### 8. TypeScript Needs Strictness And Shared Domain Types

`tsconfig.json` does not enable `strict`, `noImplicitAny`, `noUncheckedIndexedAccess`, or `useDefineForClassFields`. There are several `any` usages:

- `useOptions<T extends Record<string, any>>`.
- `useConvert` generic options and `variants.filter((v: any) => ...)`.
- `useCards(router: any, ...)`.
- `useDragCards` with `Ref<any[]>`, `dropToDock?: (item: any)`, `getItemByIndex?: ... => any`.
- `DropDock` uses `Record<string, any>` for components.
- catch blocks use `e:any`.
- `prettyJson(obj: any)`.

Recommended domain types:

```txt
shared/types/
  files.ts
  image.ts
  operations.ts
  appConfig.ts
features/convert/model/types.ts
features/remove-bg/model/types.ts
features/upscale/model/types.ts
```

Useful types to introduce:

- `ImageFileItem`
- `ObjectUrl`
- `ExportFormat`
- `ResizeVariant`
- `ConvertOptions`
- `RemoveBgOptions`
- `UpscaleMethod`
- `UpscaleOptions`
- `OperationStatus`
- `PreviewState`
- `ApiError`
- `FeatureFlags`
- `AppLimits`

Enable stricter TS gradually. First add types without changing behavior. Then add `strict: true` only after obvious implicit types are cleaned up.

### 9. Build And Config

Current scripts:

- root: `start`, `dev:client`, `dev:server`.
- client: `dev`, `build`, `preview`.

Issues:

- `client/package.json` dev script uses port `8888`, but `vite.config.ts` sets server port `5173`; the script wins, but this is confusing.
- Backend proxy target is hardcoded as `http://localhost:3000`.
- Build always emits sourcemaps.
- No `typecheck` script.
- No mode-specific build scripts.
- No lint/format/test scripts.
- `@types/gsap` is installed even though GSAP ships its own types in modern versions; this may be unnecessary.
- `tsconfig.json` includes `"node"` types in a frontend project, likely because Vite config needs Node types. Better split app and node config later.

Recommended scripts:

```json
{
  "dev": "vite --host --port 8888",
  "dev:local": "vite --mode local --host --port 8888",
  "dev:free": "vite --mode free --host --port 8888",
  "build": "vue-tsc --noEmit && vite build",
  "build:local": "vue-tsc --noEmit && vite build --mode local",
  "build:free": "vue-tsc --noEmit && vite build --mode free",
  "build:pro": "vue-tsc --noEmit && vite build --mode pro",
  "preview": "vite preview",
  "typecheck": "vue-tsc --noEmit"
}
```

For desktop later:

- Add `base: './'` or desktop-specific base config if needed.
- Move proxy targets to env.
- Avoid hardcoded relative API assumptions in feature code.
- Add a desktop mode config that uses a platform adapter instead of only HTTP.

## Recommended Target Structure

Target structure without a full rewrite:

```txt
client/src
  app/
    App.vue
    main.ts
    router/
      routes.ts
      router.ts

  shared/
    ui/
      DropZone/
      Header/
      Modal/
      Button/
    lib/
      bytes.ts
      json.ts
      errors.ts
    api/
      httpClient.ts
      downloadResponse.ts
    platform/
      browserPlatform.ts
      downloadAdapter.ts
      fileAdapter.ts
      imageAdapter.ts
      objectUrlRegistry.ts
    config/
      appConfig.ts
      features.ts
      limits.ts
      endpoints.ts
    types/
      files.ts
      image.ts
      operations.ts

  features/
    convert/
      page/
      ui/
      model/
      api/
      lib/
    remove-bg/
      page/
      ui/
      model/
      api/
    upscale/
      page/
      ui/
      model/
      api/
    json-translate/
      page/
      ui/
      model/
      api/
    home/
      page/
      ui/
      model/

  layouts/
    FXLayout/
```

Migration rule: move one feature at a time, keep route paths and public component behavior unchanged.

## Refactoring Roadmap

### Critical / важно сейчас

1. Add shared domain types for files, export formats, resize variants, operation status, preview state, and feature flags.
2. Extract a shared API/download layer from duplicated `fetch + Blob + anchor download` code.
3. Extract app config from hardcoded endpoints and future edition logic.
4. Split `CropModal.vue` by moving crop math and image output generation into composables/lib modules.
5. Remove prototype leakage: either route/register `PipelineHard.vue` intentionally behind a feature flag or move it into a proper `features/pipeline` module.

### Should Improve / желательно

1. Normalize folder naming and gradually move `Pages`, `Shared`, `components`, `Lib`, `Router` to a consistent structure.
2. Split `OptionsPanel.vue` into smaller presentational sections.
3. Create a reusable file collection composable used by convert/remove-bg/upscale instead of three similar local implementations.
4. Introduce `objectUrlRegistry` to centralize URL creation/revocation.
5. Add `vue-tsc --noEmit` and start tightening TypeScript.
6. Move route/tool metadata out of `HomePage.vue` into a typed `toolsConfig.ts`.
7. Move resize preset data from `useMultiResize.ts` into a pure config/lib module.
8. Standardize error handling into `toUserMessage(error)` and a typed `OperationStatus`.

### Later / можно позже

1. Add Pinia only when state must be shared between routes, persisted, or edition-aware.
2. Add desktop adapters for Tauri/Electron file picking, saving, and local processing.
3. Add operation history/job queue.
4. Add tests for pure modules: crop geometry, resize presets, FormData serializers, config limits.
5. Add visual/component tests for heavy UI components after they are split.
6. Consider Web Workers for heavy browser-side image operations if client-side processing grows.

## Risks

- Moving folders too aggressively can break imports without improving behavior. Migrate one feature at a time.
- Extracting services before adding types may preserve current ambiguity. Add types first or together with extraction.
- Introducing Pinia too early may turn local page state into global accidental state. Keep state local until there is a real cross-feature need.
- Desktop packaging will be fragile if downloads, file paths, and API base URLs stay embedded in feature code.
- Current preview flows can create many object URLs and concurrent requests; central cleanup and concurrency limits are needed before large batches/free-pro limits.
- Crop logic has many pointer/canvas edge cases. Extract pure geometry first and test it before changing UI behavior.

## First 5 Safe Tasks To Implement

1. Add `shared/types` and move duplicated literal unions there: `ExportFormat`, `ResizeVariant`, `OperationStatus`, `PreviewState`, `ImageFileItem`.
2. Add `shared/platform/downloadAdapter.ts` with `downloadBlob(blob, filename)` and replace only one flow first, preferably `useConvert.ts`.
3. Add `shared/api/httpClient.ts` and feature API wrapper for convert without changing request payload shape.
4. Extract `resizePresets.ts` from `useMultiResize.ts`; keep `useMultiResize` public API unchanged.
5. Add `shared/config/appConfig.ts` with `VITE_APP_MODE`, `VITE_API_BASE_URL`, feature flags, and limits, then use it only in non-invasive places first.

## Notes By Review Area

### Structure

Keep the current feature-based direction, but make it explicit. `Pages/*/Composables` should become `features/*/model`, route components should become `features/*/page`, and UI-only subcomponents should live in `features/*/ui`. Shared UI should be under one shared directory, not split between `Shared/Components` and `components`.

### Components

Good candidates for dumb/presentational components:

- `DropZone`: already close to presentational, but should accept `accept`, `multiple`, and maybe validation as props.
- `PreviewGrid`: should receive prepared preview URLs or use a shared URL adapter.
- `OptionsPanel` sections: format, resize, quality, metadata, folder output.
- `CompareSlider`: presentational, but should avoid hardcoded global class selectors if made reusable.

Good candidates for smart/container components:

- `ConvertPage`
- `RemoveBgPage`
- `UpscalePage`
- `JsonTranslatePage`
- future `PipelinePage`

### Business Logic

Conversion/export/remove-bg/upscale logic should not live in Vue components. Keep Vue composables as orchestration, but move serialization and API operations to typed modules:

- `convertFormData(options, files)`
- `convertApi.convertBatch(request)`
- `removeBgApi.createPreview(request)`
- `upscaleApi.createPreview(request)`
- `downloadAdapter.downloadBlob(blob, filename)`
- `imageAdapter.cropImage(file, cropRect, shape)`

### State Management

Composables are enough for now. Add Pinia later for workspace/session/edition/job state. Do not centralize every checkbox.

### Version Modes

Add edition config now, but enforce limits gradually. The UI can read `features` and `limits`; service layer should validate limits before requests. Free/pro should not be separate branches of code.

### Desktop Readiness

The key desktop preparation is adapter extraction, not Electron/Tauri setup yet. Wrap browser-only APIs now so the later desktop implementation can replace behavior behind the same interface.

### TypeScript

Introduce shared types first, then enable stricter compiler checks. Avoid turning on all strictness before cleaning obvious `any` usage, otherwise the diff will become noisy.

### Build/Config

Add `vue-tsc`, env modes, and config-driven API base URL. Keep Vite proxy for development, but do not let feature code depend on proxy paths forever.
