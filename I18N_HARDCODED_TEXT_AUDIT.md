# I18N Hardcoded Text Audit

## Scope

Frontend-only audit for `client/client/src`:

- Vue pages and components
- composables with user-facing status, warning, or error text
- config files with visible labels, titles, descriptions, badges

No code changes were made.

## Priority Guide

- `critical`: visible on primary flows or active routes now
- `normal`: visible on secondary or experimental flows
- `later`: legacy, hidden, low-frequency, or technical-only UI copy

## Findings

| File path | String | Suggested i18n key | Priority |
|---|---|---|---|
| `client/client/src/components/Header/Header.vue` | `Image Tools — Home` | `header.logo.ariaLabel` | critical |
| `client/client/src/components/Header/Header.vue` | `Home` | `header.nav.home` | critical |
| `client/client/src/components/Header/Header.vue` | `All-in-One` | `header.nav.allInOne` | critical |
| `client/client/src/components/Header/Header.vue` | `Remove BG` | `header.nav.removeBg` | normal |
| `client/client/src/components/Header/Header.vue` | `Upscale` | `header.nav.upscale` | normal |
| `client/client/src/components/Header/Header.vue` | `Translate` | `header.nav.translate` | normal |
| `client/client/src/components/Header/Header.vue` | `Soon` | `common.badges.soon` | critical |
| `client/client/src/components/Header/Header.vue` | `Profile` | `header.profile.ariaLabel` | normal |
| `client/client/src/components/Header/Header.vue` | `Dev` | `appMode.development.short` | critical |
| `client/client/src/components/Header/Header.vue` | computed labels from mode value: `Local`, `Free`, `Pro` | `appMode.local.label`, `appMode.free.label`, `appMode.pro.label` | critical |
| `client/client/src/Pages/Home/HomePage.vue` | `Local image optimization for web stores, marketplaces and e-commerce content.` | `home.hero.subtitle` | critical |
| `client/client/src/Pages/Home/HomePage.vue` | `Advanced workflow` | `home.featured.kicker` | critical |
| `client/client/src/Pages/Home/HomePage.vue` | `Made with ❤️ on Vue 3` | `home.footer.caption` | later |
| `client/client/src/Pages/Home/config/toolsConfig.ts` | `All-in-One Image Optimizer` | `tools.allInOne.title` | critical |
| `client/client/src/Pages/Home/config/toolsConfig.ts` | `Convert, compress, resize, crop and export in one workflow` | `tools.allInOne.description` | critical |
| `client/client/src/Pages/Home/config/toolsConfig.ts` | `Free up to 5 images / Pro unlimited` | `tools.allInOne.badge` | critical |
| `client/client/src/Pages/Home/config/toolsConfig.ts` | `Compress Images` | `tools.compress.title` | critical |
| `client/client/src/Pages/Home/config/toolsConfig.ts` | `Reduce image weight for faster product pages` | `tools.compress.description` | critical |
| `client/client/src/Pages/Home/config/toolsConfig.ts` | `Simple` | `common.badges.simple` | critical |
| `client/client/src/Pages/Home/config/toolsConfig.ts` | `Resize Images` | `tools.resize.title` | critical |
| `client/client/src/Pages/Home/config/toolsConfig.ts` | `Prepare exact sizes for web and marketplaces` | `tools.resize.description` | critical |
| `client/client/src/Pages/Home/config/toolsConfig.ts` | `Convert Format` | `tools.format.title` | critical |
| `client/client/src/Pages/Home/config/toolsConfig.ts` | `Switch between WebP, JPEG, PNG and AVIF` | `tools.format.description` | critical |
| `client/client/src/Pages/Home/config/toolsConfig.ts` | `Crop Images` | `tools.crop.title` | critical |
| `client/client/src/Pages/Home/config/toolsConfig.ts` | `Frame product images and thumbnails` | `tools.crop.description` | critical |
| `client/client/src/Pages/Home/config/toolsConfig.ts` | `Remove BG` | `tools.removeBg.title` | normal |
| `client/client/src/Pages/Home/config/toolsConfig.ts` | `AI background removal for product images` | `tools.removeBg.description` | normal |
| `client/client/src/Pages/Home/config/toolsConfig.ts` | `Coming soon` | `common.badges.comingSoon` | critical |
| `client/client/src/Pages/Home/config/toolsConfig.ts` | `Upscale` | `tools.upscale.title` | normal |
| `client/client/src/Pages/Home/config/toolsConfig.ts` | `Improve resolution and sharpness` | `tools.upscale.description` | normal |
| `client/client/src/Pages/Home/config/toolsConfig.ts` | `Translate` | `tools.translate.title` | normal |
| `client/client/src/Pages/Home/config/toolsConfig.ts` | `JSON localization workflow` | `tools.translate.description` | normal |
| `client/client/src/components/DropDock/DropDock.vue` | `Перетащите сюда карточку` | `dock.dropZone.label` | normal |
| `client/client/src/Shared/Components/DropZone.vue` | `Перетащи сюда файлы` | `dropzone.title` | critical |
| `client/client/src/Shared/Components/DropZone.vue` | `…или нажми, чтобы выбрать` | `dropzone.subtitle` | critical |
| `client/client/src/Pages/ConvertPage/ConvertPage.vue` | `All-in-One` | `convert.mode.allInOne.titleStart` | critical |
| `client/client/src/Pages/ConvertPage/ConvertPage.vue` | `Image Optimizer` | `convert.mode.allInOne.titleAccent` | critical |
| `client/client/src/Pages/ConvertPage/ConvertPage.vue` | `Convert, compress, resize, crop and export in one workflow` | `convert.mode.allInOne.subtitle` | critical |
| `client/client/src/Pages/ConvertPage/ConvertPage.vue` | `Compress` | `convert.mode.compress.titleStart` | critical |
| `client/client/src/Pages/ConvertPage/ConvertPage.vue` | `Images` | `convert.mode.compress.titleAccent` | critical |
| `client/client/src/Pages/ConvertPage/ConvertPage.vue` | `Reduce file size for faster web pages` | `convert.mode.compress.subtitle` | critical |
| `client/client/src/Pages/ConvertPage/ConvertPage.vue` | `Resize` | `convert.mode.resize.titleStart` | critical |
| `client/client/src/Pages/ConvertPage/ConvertPage.vue` | `Prepare exact sizes for web and marketplaces` | `convert.mode.resize.subtitle` | critical |
| `client/client/src/Pages/ConvertPage/ConvertPage.vue` | `Convert` | `convert.mode.format.titleStart` | critical |
| `client/client/src/Pages/ConvertPage/ConvertPage.vue` | `Format` | `convert.mode.format.titleAccent` | critical |
| `client/client/src/Pages/ConvertPage/ConvertPage.vue` | `Switch between JPEG, PNG, WebP and AVIF` | `convert.mode.format.subtitle` | critical |
| `client/client/src/Pages/ConvertPage/ConvertPage.vue` | `Crop` | `convert.mode.crop.titleStart` | critical |
| `client/client/src/Pages/ConvertPage/ConvertPage.vue` | `Frame product images and thumbnails` | `convert.mode.crop.subtitle` | critical |
| `client/client/src/Pages/ConvertPage/ConvertPage.vue` | `Файлов:` | `convert.stats.files` | critical |
| `client/client/src/Pages/ConvertPage/ConvertPage.vue` | `Суммарно:` | `convert.stats.totalSize` | critical |
| `client/client/src/Pages/ConvertPage/ConvertPage.vue` | `Source images:` | `convert.stats.sourceImages` | critical |
| `client/client/src/Pages/ConvertPage/ConvertPage.vue` | `Конвертирую…` | `convert.actions.processing` | critical |
| `client/client/src/Pages/ConvertPage/ConvertPage.vue` | `Конвертировать` | `convert.actions.submit` | critical |
| `client/client/src/Pages/ConvertPage/ConvertPage.vue` | `Очистить файлы` | `common.actions.clearFiles` | critical |
| `client/client/src/Pages/ConvertPage/ConvertPage.vue` | `Free limit: ${sourceImagesLimit.value} source images` | `convert.limits.freeLimitExceeded` | critical |
| `client/client/src/Pages/ConvertPage/Components/OptionsPanel/OptionsPanel.vue` | `Формат вывода` | `convert.options.outputFormat.label` | critical |
| `client/client/src/Pages/ConvertPage/Components/OptionsPanel/OptionsPanel.vue` | `Сохранить как есть` | `convert.options.outputFormat.same` | critical |
| `client/client/src/Pages/ConvertPage/Components/OptionsPanel/OptionsPanel.vue` | `Изменить размер` | `convert.options.resize.toggle` | critical |
| `client/client/src/Pages/ConvertPage/Components/OptionsPanel/OptionsPanel.vue` | `Max width` | `convert.options.resize.maxWidth` | critical |
| `client/client/src/Pages/ConvertPage/Components/OptionsPanel/OptionsPanel.vue` | `напр. 1600` | `convert.options.resize.maxWidthPlaceholder` | normal |
| `client/client/src/Pages/ConvertPage/Components/OptionsPanel/OptionsPanel.vue` | `Max height` | `convert.options.resize.maxHeight` | critical |
| `client/client/src/Pages/ConvertPage/Components/OptionsPanel/OptionsPanel.vue` | `опционально` | `common.placeholders.optional` | normal |
| `client/client/src/Pages/ConvertPage/Components/OptionsPanel/OptionsPanel.vue` | `Мульти-размеры` | `convert.options.multiResize.toggle` | critical |
| `client/client/src/Pages/ConvertPage/Components/OptionsPanel/OptionsPanel.vue` | `+ Добавить размер` | `convert.options.multiResize.addVariant` | normal |
| `client/client/src/Pages/ConvertPage/Components/OptionsPanel/OptionsPanel.vue` | `Сбросить всё` | `common.actions.resetAll` | normal |
| `client/client/src/Pages/ConvertPage/Components/OptionsPanel/OptionsPanel.vue` | `Сортировать` | `common.actions.sort` | normal |
| `client/client/src/Pages/ConvertPage/Components/OptionsPanel/OptionsPanel.vue` | `Режим наборов` | `convert.options.multiResize.modeLabel` | normal |
| `client/client/src/Pages/ConvertPage/Components/OptionsPanel/OptionsPanel.vue` | `Переключать` | `convert.options.multiResize.mode.switch` | normal |
| `client/client/src/Pages/ConvertPage/Components/OptionsPanel/OptionsPanel.vue` | `Добавлять` | `convert.options.multiResize.mode.add` | normal |
| `client/client/src/Pages/ConvertPage/Components/OptionsPanel/OptionsPanel.vue` | `Десктопы` | `convert.options.multiResize.presets.desktop` | normal |
| `client/client/src/Pages/ConvertPage/Components/OptionsPanel/OptionsPanel.vue` | `Планшеты` | `convert.options.multiResize.presets.tablet` | normal |
| `client/client/src/Pages/ConvertPage/Components/OptionsPanel/OptionsPanel.vue` | `Телефоны` | `convert.options.multiResize.presets.phone` | normal |
| `client/client/src/Pages/ConvertPage/Components/OptionsPanel/OptionsPanel.vue` | `Все сразу` | `convert.options.multiResize.presets.all` | normal |
| `client/client/src/Pages/ConvertPage/Components/OptionsPanel/OptionsPanel.vue` | `Макрос 1` | `convert.options.multiResize.presets.macro1` | later |
| `client/client/src/Pages/ConvertPage/Components/OptionsPanel/OptionsPanel.vue` | `W` | `convert.options.multiResize.variantWidth` | later |
| `client/client/src/Pages/ConvertPage/Components/OptionsPanel/OptionsPanel.vue` | `напр. 1080` | `convert.options.multiResize.variantWidthPlaceholder` | later |
| `client/client/src/Pages/ConvertPage/Components/OptionsPanel/OptionsPanel.vue` | `H` | `convert.options.multiResize.variantHeight` | later |
| `client/client/src/Pages/ConvertPage/Components/OptionsPanel/OptionsPanel.vue` | `опц.` | `common.placeholders.optionalShort` | later |
| `client/client/src/Pages/ConvertPage/Components/OptionsPanel/OptionsPanel.vue` | `Удалить` | `common.actions.remove` | critical |
| `client/client/src/Pages/ConvertPage/Components/OptionsPanel/OptionsPanel.vue` | `Если указать только ширину — высота подберётся пропорционально (fit: inside).` | `convert.options.multiResize.hint` | normal |
| `client/client/src/Pages/ConvertPage/Components/OptionsPanel/OptionsPanel.vue` | `Сохранять в папках` | `convert.options.export.inFolders` | normal |
| `client/client/src/Pages/ConvertPage/Components/OptionsPanel/OptionsPanel.vue` | `Lossless (без потерь)` | `convert.options.compression.lossless` | normal |
| `client/client/src/Pages/ConvertPage/Components/OptionsPanel/OptionsPanel.vue` | `Качество (для lossy):` | `convert.options.compression.quality` | normal |
| `client/client/src/Pages/ConvertPage/Components/OptionsPanel/OptionsPanel.vue` | `Целевой вес (KB)` | `convert.options.compression.targetWeight` | normal |
| `client/client/src/Pages/ConvertPage/Components/OptionsPanel/OptionsPanel.vue` | `например 180` | `convert.options.compression.targetWeightPlaceholder` | later |
| `client/client/src/Pages/ConvertPage/Components/OptionsPanel/OptionsPanel.vue` | `Удалить EXIF/метаданные` | `convert.options.optimize.stripMetadata` | normal |
| `client/client/src/Pages/ConvertPage/Components/OptionsPanel/OptionsPanel.vue` | `minSize` | `convert.options.optimize.minSize` | later |
| `client/client/src/Pages/ConvertPage/Components/OptionsPanel/OptionsPanel.vue` | `smartSubsample` | `convert.options.optimize.smartSubsample` | later |
| `client/client/src/Pages/ConvertPage/Components/PreviewGrid/PreviewGrid.vue` | `Удалить` | `previewGrid.remove.title` | normal |
| `client/client/src/Pages/ConvertPage/Components/PreviewGrid/PreviewGrid.vue` | `Обрезано` | `previewGrid.badges.cropped` | normal |
| `client/client/src/Pages/ConvertPage/Components/PreviewGrid/PreviewGrid.vue` | `Оригинал` | `previewGrid.badges.original` | normal |
| `client/client/src/Pages/ConvertPage/Components/CropModal/CropModal.vue` | `Сбросить область` | `cropModal.actions.resetArea` | critical |
| `client/client/src/Pages/ConvertPage/Components/CropModal/CropModal.vue` | `Восстановить исходник` | `cropModal.actions.restoreOriginal` | critical |
| `client/client/src/Pages/ConvertPage/Components/CropModal/CropModal.vue` | `Сохранить` | `common.actions.save` | critical |
| `client/client/src/Pages/ConvertPage/Components/CropModal/CropModal.vue` | `Форма:` | `cropModal.shape.label` | normal |
| `client/client/src/Pages/ConvertPage/Components/CropModal/CropModal.vue` | `Прямоугольник` | `cropModal.shape.rectangle` | normal |
| `client/client/src/Pages/ConvertPage/Components/CropModal/CropModal.vue` | `Круг` | `cropModal.shape.circle` | normal |
| `client/client/src/Pages/ConvertPage/Components/CropModal/CropModal.vue` | `Тяни рамку или углы. Область всегда внутри изображения.` | `cropModal.hint` | normal |
| `client/client/src/Pages/ConvertPage/Components/CropModal/CropModal.vue` | `Свободно` | `cropModal.ratio.free` | normal |
| `client/client/src/Pages/ConvertPage/Composables/useConvert.ts` | `Обработка...` | `common.status.processing` | critical |
| `client/client/src/Pages/ConvertPage/Composables/useConvert.ts` | `Готово ✔` | `common.status.success` | critical |
| `client/client/src/Pages/ConvertPage/Composables/useConvert.ts` | `Ошибка :(` | `common.status.errorGeneric` | critical |
| `client/client/src/Pages/RemoveBgPage/RemoveBgPage.vue` | `Remove` | `removeBg.title.start` | normal |
| `client/client/src/Pages/RemoveBgPage/RemoveBgPage.vue` | `Background` | `removeBg.title.accent` | normal |
| `client/client/src/Pages/RemoveBgPage/RemoveBgPage.vue` | `Удаление фона AI с предпросмотром. Модель и сессия — auto.` | `removeBg.subtitle` | normal |
| `client/client/src/Pages/RemoveBgPage/RemoveBgPage.vue` | `Файлов:` | `removeBg.stats.files` | normal |
| `client/client/src/Pages/RemoveBgPage/RemoveBgPage.vue` | `Суммарно:` | `removeBg.stats.totalSize` | normal |
| `client/client/src/Pages/RemoveBgPage/RemoveBgPage.vue` | `Предпросмотр` | `removeBg.preview.title` | normal |
| `client/client/src/Pages/RemoveBgPage/RemoveBgPage.vue` | `Выходной формат` | `removeBg.options.outputFormat` | normal |
| `client/client/src/Pages/RemoveBgPage/RemoveBgPage.vue` | `PNG (прозрачность)` | `removeBg.options.outputFormat.png` | normal |
| `client/client/src/Pages/RemoveBgPage/RemoveBgPage.vue` | `WEBP` | `removeBg.options.outputFormat.webp` | later |
| `client/client/src/Pages/RemoveBgPage/RemoveBgPage.vue` | `JPEG (без прозрачности)` | `removeBg.options.outputFormat.jpeg` | normal |
| `client/client/src/Pages/RemoveBgPage/RemoveBgPage.vue` | `AVIF` | `removeBg.options.outputFormat.avif` | later |
| `client/client/src/Pages/RemoveBgPage/RemoveBgPage.vue` | `Цвет фона (для JPEG / опционально)` | `removeBg.options.backgroundColor` | normal |
| `client/client/src/Pages/RemoveBgPage/RemoveBgPage.vue` | `Оригинал` | `removeBg.compare.original` | normal |
| `client/client/src/Pages/RemoveBgPage/RemoveBgPage.vue` | `Без фона` | `removeBg.compare.result` | normal |
| `client/client/src/Pages/RemoveBgPage/RemoveBgPage.vue` | `Обработка…` | `common.status.processing` | normal |
| `client/client/src/Pages/RemoveBgPage/RemoveBgPage.vue` | `Удалить фон (ZIP)` | `removeBg.actions.submit` | normal |
| `client/client/src/Pages/RemoveBgPage/RemoveBgPage.vue` | `Очистить файлы` | `common.actions.clearFiles` | normal |
| `client/client/src/Pages/RemoveBgPage/RemoveBgPage.vue` | `Сравнение 1000×1000 — {{ largeItem.file.name }}` | `removeBg.compare.largeTitle` | later |
| `client/client/src/Pages/RemoveBgPage/Composables/useRmbgBatch.ts` | `Обработка…` | `common.status.processing` | normal |
| `client/client/src/Pages/RemoveBgPage/Composables/useRmbgBatch.ts` | `remove error` | `removeBg.errors.batchFailedFallback` | normal |
| `client/client/src/Pages/RemoveBgPage/Composables/useRmbgBatch.ts` | `Готово ✔` | `common.status.success` | normal |
| `client/client/src/Pages/RemoveBgPage/Composables/useRmbgBatch.ts` | `Ошибка :(` | `common.status.errorGeneric` | normal |
| `client/client/src/Pages/RemoveBgPage/Composables/useRmbgPreview.ts` | `preview error` | `removeBg.errors.previewFailedFallback` | normal |
| `client/client/src/Pages/RemoveBgPage/Composables/useRmbgPreview.ts` | `Ошибка предпросмотра` | `removeBg.errors.previewGeneric` | normal |
| `client/client/src/Pages/UpscalePage/UpscalePage.vue` | `Image` | `upscale.title.start` | normal |
| `client/client/src/Pages/UpscalePage/UpscalePage.vue` | `Upscale` | `upscale.title.accent` | normal |
| `client/client/src/Pages/UpscalePage/UpscalePage.vue` | `Увеличение и улучшение изображений. Поддержаны быстрый «без ИИ», Real-ESRGAN и Waifu2x.` | `upscale.subtitle` | normal |
| `client/client/src/Pages/UpscalePage/UpscalePage.vue` | `Файлов:` | `upscale.stats.files` | normal |
| `client/client/src/Pages/UpscalePage/UpscalePage.vue` | `Суммарно:` | `upscale.stats.totalSize` | normal |
| `client/client/src/Pages/UpscalePage/UpscalePage.vue` | `Предпросмотр` | `upscale.preview.title` | normal |
| `client/client/src/Pages/UpscalePage/UpscalePage.vue` | `Метод` | `upscale.options.method` | normal |
| `client/client/src/Pages/UpscalePage/UpscalePage.vue` | `Без ИИ (быстро)` | `upscale.options.method.nonAi` | normal |
| `client/client/src/Pages/UpscalePage/UpscalePage.vue` | `Real-ESRGAN (AI)` | `upscale.options.method.realEsrgan` | normal |
| `client/client/src/Pages/UpscalePage/UpscalePage.vue` | `Waifu2x (AI, арт/аниме)` | `upscale.options.method.waifu2x` | normal |
| `client/client/src/Pages/UpscalePage/UpscalePage.vue` | `Целевой размер (max сторона)` | `upscale.options.targetSize` | normal |
| `client/client/src/Pages/UpscalePage/UpscalePage.vue` | `например 1600` | `upscale.options.targetSizePlaceholder` | later |
| `client/client/src/Pages/UpscalePage/UpscalePage.vue` | `Модель` | `upscale.options.model` | normal |
| `client/client/src/Pages/UpscalePage/UpscalePage.vue` | `x4plus (фото)` | `upscale.options.model.x4plus` | normal |
| `client/client/src/Pages/UpscalePage/UpscalePage.vue` | `x4plus-anime` | `upscale.options.model.x4plusAnime` | later |
| `client/client/src/Pages/UpscalePage/UpscalePage.vue` | `GPU ускорение` | `upscale.hints.gpuAcceleration` | later |
| `client/client/src/Pages/UpscalePage/UpscalePage.vue` | `Шумоподавление` | `upscale.options.noiseReduction` | normal |
| `client/client/src/Pages/UpscalePage/UpscalePage.vue` | `Подходит для арта/манги` | `upscale.hints.artManga` | later |
| `client/client/src/Pages/UpscalePage/UpscalePage.vue` | `Оригинал` | `upscale.compare.original` | normal |
| `client/client/src/Pages/UpscalePage/UpscalePage.vue` | `Улучшено` | `upscale.compare.result` | normal |
| `client/client/src/Pages/UpscalePage/UpscalePage.vue` | `Обработка…` | `common.status.processing` | normal |
| `client/client/src/Pages/UpscalePage/UpscalePage.vue` | `Улучшить (ZIP)` | `upscale.actions.submit` | normal |
| `client/client/src/Pages/UpscalePage/UpscalePage.vue` | `Очистить файлы` | `common.actions.clearFiles` | normal |
| `client/client/src/Pages/UpscalePage/Composables/useUpscaleBatch.ts` | `Обработка…` | `common.status.processing` | normal |
| `client/client/src/Pages/UpscalePage/Composables/useUpscaleBatch.ts` | `enhance error` | `upscale.errors.batchFailedFallback` | normal |
| `client/client/src/Pages/UpscalePage/Composables/useUpscaleBatch.ts` | `Готово ✔` | `common.status.success` | normal |
| `client/client/src/Pages/UpscalePage/Composables/useUpscaleBatch.ts` | `Ошибка :(` | `common.status.errorGeneric` | normal |
| `client/client/src/Pages/UpscalePage/Composables/useUpscalePreview.ts` | `preview error` | `upscale.errors.previewFailedFallback` | normal |
| `client/client/src/Pages/UpscalePage/Composables/useUpscalePreview.ts` | `Ошибка предпросмотра` | `upscale.errors.previewGeneric` | normal |
| `client/client/src/Pages/JsonTranslatePage/JsonTranslatePage.vue` | `Перевод JSON` | `jsonTranslate.title` | normal |
| `client/client/src/Pages/JsonTranslatePage/JsonTranslatePage.vue` | `Скоро` | `common.badges.comingSoonShort` | normal |
| `client/client/src/Pages/JsonTranslatePage/JsonTranslatePage.vue` | `легкая` | `jsonTranslate.models.small.description` | later |
| `client/client/src/Pages/JsonTranslatePage/JsonTranslatePage.vue` | `сбалансированная` | `jsonTranslate.models.medium.description` | later |
| `client/client/src/Pages/JsonTranslatePage/JsonTranslatePage.vue` | `текущая` | `jsonTranslate.models.active.description` | later |
| `client/client/src/Pages/JsonTranslatePage/JsonTranslatePage.vue` | `JSON-файл` | `jsonTranslate.file.label` | normal |
| `client/client/src/Pages/JsonTranslatePage/JsonTranslatePage.vue` | `Выбрать файл` | `common.actions.selectFile` | normal |
| `client/client/src/Pages/JsonTranslatePage/JsonTranslatePage.vue` | `Файл не выбран` | `jsonTranslate.file.empty` | normal |
| `client/client/src/Pages/JsonTranslatePage/JsonTranslatePage.vue` | `Исходный язык (пусто = авто)` | `jsonTranslate.languages.source` | normal |
| `client/client/src/Pages/JsonTranslatePage/JsonTranslatePage.vue` | `it / ru / en ...` | `jsonTranslate.languages.sourcePlaceholder` | later |
| `client/client/src/Pages/JsonTranslatePage/JsonTranslatePage.vue` | `Целевой язык` | `jsonTranslate.languages.target` | normal |
| `client/client/src/Pages/JsonTranslatePage/JsonTranslatePage.vue` | `en` | `jsonTranslate.languages.targetPlaceholder` | later |
| `client/client/src/Pages/JsonTranslatePage/JsonTranslatePage.vue` | `Перевести (ZIP)` | `jsonTranslate.actions.submit` | normal |
| `client/client/src/Pages/JsonTranslatePage/JsonTranslatePage.vue` | `Скрыть JSON` | `jsonTranslate.actions.hidePreview` | normal |
| `client/client/src/Pages/JsonTranslatePage/JsonTranslatePage.vue` | `Просмотреть JSON` | `jsonTranslate.actions.showPreview` | normal |
| `client/client/src/Pages/JsonTranslatePage/JsonTranslatePage.vue` | `Сбросить` | `common.actions.reset` | normal |
| `client/client/src/Pages/JsonTranslatePage/JsonTranslatePage.vue` | `Исходный JSON` | `jsonTranslate.preview.sourceTitle` | normal |
| `client/client/src/Pages/JsonTranslatePage/JsonTranslatePage.vue` | `read-only` | `jsonTranslate.preview.readOnly` | later |
| `client/client/src/Pages/JsonTranslatePage/JsonTranslatePage.vue` | `Перевод` | `jsonTranslate.preview.resultTitle` | normal |
| `client/client/src/Pages/JsonTranslatePage/JsonTranslatePage.vue` | `обработка…` | `common.status.processingLower` | later |
| `client/client/src/Pages/JsonTranslatePage/JsonTranslatePage.vue` | `готово` | `common.status.ready` | later |
| `client/client/src/Pages/JsonTranslatePage/Composables/useJsonTranslate.ts` | `Перевод…` | `jsonTranslate.status.processing` | normal |
| `client/client/src/Pages/JsonTranslatePage/Composables/useJsonTranslate.ts` | `{ /* не удалось отобразить результат как JSON */ }` | `jsonTranslate.preview.invalidJsonFallback` | normal |
| `client/client/src/Pages/JsonTranslatePage/Composables/useJsonTranslate.ts` | `Готово ✔` | `common.status.success` | normal |
| `client/client/src/Pages/JsonTranslatePage/Composables/useJsonTranslate.ts` | `Ошибка: ` | `common.status.errorPrefix` | normal |
| `client/client/src/Pages/JsonTranslatePage/Composables/useJsonTranslate.ts` | `unknown` | `common.errors.unknown` | normal |
| `client/client/src/components/PipelineHard.vue` | `Конвейер 1080×1080 → RemoveBG → WebP(85)` | `pipeline.title` | later |
| `client/client/src/components/PipelineHard.vue` | `Файлов: ` | `pipeline.stats.files` | later |
| `client/client/src/components/PipelineHard.vue` | `Запустить конвейер (ZIP)` | `pipeline.actions.submit` | later |
| `client/client/src/components/PipelineHard.vue` | `Шаги: resize до 1080×1080 (fit: inside, без увеличения) → удаление фона (AI) → WebP (quality 85, minSize, smartSubsample) → удаление метаданных.` | `pipeline.description.steps` | later |
| `client/client/src/components/PipelineHard.vue` | `Обработка…` | `common.status.processing` | later |
| `client/client/src/components/PipelineHard.vue` | `pipeline error` | `pipeline.errors.batchFailedFallback` | later |
| `client/client/src/components/PipelineHard.vue` | `Готово ✔` | `common.status.success` | later |
| `client/client/src/components/PipelineHard.vue` | `Ошибка :(` | `common.status.errorGeneric` | later |

## Recommended Dictionary Structure

Suggested base file:

- `localization/dictionaries/en.json`

Suggested shape:

```json
{
  "appMode": {
    "local": { "label": "Local" },
    "development": { "label": "Development", "short": "Dev" },
    "free": { "label": "Free" },
    "pro": { "label": "Pro" }
  },
  "common": {
    "actions": {
      "save": "Save",
      "remove": "Remove",
      "reset": "Reset",
      "resetAll": "Reset all",
      "clearFiles": "Clear files",
      "selectFile": "Select file",
      "sort": "Sort"
    },
    "badges": {
      "simple": "Simple",
      "soon": "Soon",
      "comingSoon": "Coming soon",
      "comingSoonShort": "Soon"
    },
    "status": {
      "processing": "Processing...",
      "processingLower": "processing...",
      "success": "Done",
      "ready": "ready",
      "errorGeneric": "Error",
      "errorPrefix": "Error: "
    },
    "errors": {
      "unknown": "unknown"
    },
    "placeholders": {
      "optional": "optional",
      "optionalShort": "opt."
    }
  },
  "header": {
    "logo": { "ariaLabel": "Image Tools Home" },
    "nav": {
      "home": "Home",
      "allInOne": "All-in-One",
      "removeBg": "Remove BG",
      "upscale": "Upscale",
      "translate": "Translate"
    },
    "profile": { "ariaLabel": "Profile" }
  },
  "home": {
    "hero": { "subtitle": "Local image optimization for web stores, marketplaces and e-commerce content." },
    "featured": { "kicker": "Advanced workflow" },
    "footer": { "caption": "Made with Vue 3" }
  },
  "tools": {
    "allInOne": { "title": "All-in-One Image Optimizer", "description": "", "badge": "" },
    "compress": { "title": "Compress Images", "description": "" },
    "resize": { "title": "Resize Images", "description": "" },
    "format": { "title": "Convert Format", "description": "" },
    "crop": { "title": "Crop Images", "description": "" },
    "removeBg": { "title": "Remove BG", "description": "" },
    "upscale": { "title": "Upscale", "description": "" },
    "translate": { "title": "Translate", "description": "" }
  },
  "dropzone": {
    "title": "Drop files here",
    "subtitle": "...or click to choose"
  },
  "dock": {
    "dropZone": { "label": "Drag a card here" }
  },
  "convert": {
    "mode": {
      "allInOne": { "titleStart": "All-in-One", "titleAccent": "Image Optimizer", "subtitle": "" },
      "compress": { "titleStart": "Compress", "titleAccent": "Images", "subtitle": "" },
      "resize": { "titleStart": "Resize", "titleAccent": "Images", "subtitle": "" },
      "format": { "titleStart": "Convert", "titleAccent": "Format", "subtitle": "" },
      "crop": { "titleStart": "Crop", "titleAccent": "Images", "subtitle": "" }
    },
    "stats": {
      "files": "Files",
      "totalSize": "Total size",
      "sourceImages": "Source images"
    },
    "actions": {
      "submit": "Convert",
      "processing": "Converting..."
    },
    "limits": {
      "freeLimitExceeded": "Free limit: {count} source images"
    },
    "options": {}
  },
  "cropModal": {
    "actions": {},
    "shape": {},
    "ratio": {},
    "hint": ""
  },
  "previewGrid": {
    "badges": {}
  },
  "removeBg": {
    "title": {},
    "subtitle": "",
    "stats": {},
    "options": {},
    "compare": {},
    "actions": {},
    "errors": {}
  },
  "upscale": {
    "title": {},
    "subtitle": "",
    "stats": {},
    "options": {},
    "compare": {},
    "actions": {},
    "hints": {},
    "errors": {}
  },
  "jsonTranslate": {
    "title": "",
    "models": {},
    "file": {},
    "languages": {},
    "actions": {},
    "preview": {},
    "status": {}
  },
  "pipeline": {
    "title": "",
    "stats": {},
    "actions": {},
    "description": {},
    "errors": {}
  }
}
```

## Migration Notes

1. `Header.vue` should stop deriving UI labels with `mode.charAt(...).slice(...)`.
Use explicit translated labels for every app mode.

2. `toolsConfig.ts` and `ConvertPage.vue` duplicate product copy.
Move tool titles, descriptions, and mode subtitles into shared dictionary-backed metadata.

3. Status strings are spread across composables.
Introduce one consistent status/error dictionary for reuse:
`common.status.*`, `common.errors.*`

4. Technical labels such as `minSize`, `smartSubsample`, `read-only`, `W`, `H`, and `GPU ускорение` should still be externalized even if product copy is not finalized.

5. Legacy `PipelineHard.vue` and `/main` route text should migrate too, but it can be a later pass if the route stays hidden from the main commercial UI.
