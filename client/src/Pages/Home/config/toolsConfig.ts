import type { AppMode } from '@/shared/types/appConfig'

export type OptimizerMode = 'all-in-one' | 'compress' | 'resize' | 'format' | 'crop'

export type ToolAvailability = 'available' | 'coming-soon'

export type HomeTool = {
    id: string
    titleKey: string
    descKey: string
    path: string
    icon: string
    badgeKey: string
    availability: ToolAvailability
    optimizerMode?: OptimizerMode
}

export const featuredOptimizerTool: HomeTool = {
    id: 'all-in-one',
    titleKey: 'tools.allInOne.title',
    descKey: 'tools.allInOne.description',
    path: '/convert',
    icon: '⚡',
    badgeKey: 'tools.allInOne.badge',
    availability: 'available',
    optimizerMode: 'all-in-one',
}

const simpleOptimizerTools: HomeTool[] = [
    {
        id: 'compress',
        titleKey: 'tools.compress.title',
        descKey: 'tools.compress.description',
        path: '/compress',
        icon: '🗜️',
        badgeKey: 'common.badges.simple',
        availability: 'available',
        optimizerMode: 'compress',
    },
    {
        id: 'resize',
        titleKey: 'tools.resize.title',
        descKey: 'tools.resize.description',
        path: '/resize',
        icon: '📐',
        badgeKey: 'common.badges.simple',
        availability: 'available',
        optimizerMode: 'resize',
    },
    {
        id: 'convert-format',
        titleKey: 'tools.format.title',
        descKey: 'tools.format.description',
        path: '/convert-format',
        icon: '🔁',
        badgeKey: 'common.badges.simple',
        availability: 'available',
        optimizerMode: 'format',
    },
    {
        id: 'crop',
        titleKey: 'tools.crop.title',
        descKey: 'tools.crop.description',
        path: '/crop',
        icon: '✂️',
        badgeKey: 'common.badges.simple',
        availability: 'available',
        optimizerMode: 'crop',
    },
]

const commercialTools: Omit<HomeTool, 'availability'>[] = [
    {
        id: 'remove-bg',
        titleKey: 'tools.removeBg.title',
        descKey: 'tools.removeBg.description',
        path: '/remove-bg',
        icon: '🪄',
        badgeKey: 'common.badges.comingSoon',
    },
    {
        id: 'upscale',
        titleKey: 'tools.upscale.title',
        descKey: 'tools.upscale.description',
        path: '/upscale',
        icon: '✨',
        badgeKey: 'common.badges.comingSoon',
    },
    {
        id: 'translate',
        titleKey: 'tools.translate.title',
        descKey: 'tools.translate.description',
        path: '/translate',
        icon: '🌐',
        badgeKey: 'common.badges.comingSoon',
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
