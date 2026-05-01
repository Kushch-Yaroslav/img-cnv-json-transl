import type { AppMode } from '@/shared/types/appConfig'

export type OptimizerMode = 'all-in-one' | 'compress' | 'resize' | 'format' | 'crop'

export type ToolAvailability = 'available' | 'coming-soon'

export type HomeTool = {
    id: string
    title: string
    desc: string
    path: string
    icon: string
    badge: string
    availability: ToolAvailability
    optimizerMode?: OptimizerMode
}

export const featuredOptimizerTool: HomeTool = {
    id: 'all-in-one',
    title: 'All-in-One Image Optimizer',
    desc: 'Convert, compress, resize, crop and export in one workflow',
    path: '/convert',
    icon: '⚡',
    badge: 'Free up to 5 images / Pro unlimited',
    availability: 'available',
    optimizerMode: 'all-in-one',
}

const simpleOptimizerTools: HomeTool[] = [
    {
        id: 'compress',
        title: 'Compress Images',
        desc: 'Reduce image weight for faster product pages',
        path: '/compress',
        icon: '🗜️',
        badge: 'Simple',
        availability: 'available',
        optimizerMode: 'compress',
    },
    {
        id: 'resize',
        title: 'Resize Images',
        desc: 'Prepare exact sizes for web and marketplaces',
        path: '/resize',
        icon: '📐',
        badge: 'Simple',
        availability: 'available',
        optimizerMode: 'resize',
    },
    {
        id: 'convert-format',
        title: 'Convert Format',
        desc: 'Switch between WebP, JPEG, PNG and AVIF',
        path: '/convert-format',
        icon: '🔁',
        badge: 'Simple',
        availability: 'available',
        optimizerMode: 'format',
    },
    {
        id: 'crop',
        title: 'Crop Images',
        desc: 'Frame product images and thumbnails',
        path: '/crop',
        icon: '✂️',
        badge: 'Simple',
        availability: 'available',
        optimizerMode: 'crop',
    },
]

const commercialTools: Omit<HomeTool, 'availability'>[] = [
    {
        id: 'remove-bg',
        title: 'Remove BG',
        desc: 'AI background removal for product images',
        path: '/remove-bg',
        icon: '🪄',
        badge: 'Coming soon',
    },
    {
        id: 'upscale',
        title: 'Upscale',
        desc: 'Improve resolution and sharpness',
        path: '/upscale',
        icon: '✨',
        badge: 'Coming soon',
    },
    {
        id: 'translate',
        title: 'Translate',
        desc: 'JSON localization workflow',
        path: '/translate',
        icon: '🌐',
        badge: 'Coming soon',
    },
]

function canOpenExperimentalTools(mode: AppMode): boolean {
    return mode === 'local' || mode === 'development'
}

export function getHomeTools(mode: AppMode): HomeTool[] {
    const experimentalAvailability: ToolAvailability = canOpenExperimentalTools(mode)
        ? 'available'
        : 'coming-soon'

    return [
        ...simpleOptimizerTools,
        ...commercialTools.map((tool) => ({
            ...tool,
            availability: experimentalAvailability,
        })),
    ]
}

export function isToolAvailable(tool: HomeTool): boolean {
    return tool.availability === 'available'
}

// TODO: enforce source-image limits later without changing processing payloads:
// free simple tools: 20 source images; free All-in-One: 5 source images;
// pro/local: unlimited; multi-resize outputs do not count as extra source images.
