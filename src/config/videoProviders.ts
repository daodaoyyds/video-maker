/**
 * 视频生成平台配置
 * 支持多个平台：Cloudsway、即梦等
 */

export interface VideoProvider {
  name: string
  label: string
  durationOptions: { label: string; value: number }[]
  defaultDuration: number
  aspectRatioOptions: { label: string; value: string }[]
  defaultAspectRatio: string
  aspectRatioToSize: (ratio: string) => string
  clampDuration: (duration: number) => number
}

// Cloudsway 配置
export const cloudswayProvider: VideoProvider = {
  name: 'cloudsway',
  label: 'Cloudsway',
  durationOptions: [
    { label: '4秒', value: 4 },
    { label: '8秒', value: 8 },
    { label: '12秒', value: 12 },
  ],
  defaultDuration: 8,
  aspectRatioOptions: [
    { label: '9:16 竖屏', value: '9:16' },
    { label: '16:9 横屏', value: '16:9' },
    { label: '1:1 方形', value: '1:1' },
  ],
  defaultAspectRatio: '9:16',
  aspectRatioToSize: (ratio: string) => {
    switch (ratio) {
      case '9:16': return '720x1280'
      case '1:1': return '1024x1024'
      case '16:9': default: return '1280x720'
    }
  },
  clampDuration: (duration: number) => Math.min(Math.max(duration, 4), 12),
}

// 即梦配置（示例）
export const jimengProvider: VideoProvider = {
  name: 'jimeng',
  label: '即梦',
  durationOptions: [
    { label: '15秒', value: 15 },
    { label: '25秒', value: 25 },
  ],
  defaultDuration: 15,
  aspectRatioOptions: [
    { label: '9:16 竖屏', value: '9:16' },
    { label: '16:9 横屏', value: '16:9' },
  ],
  defaultAspectRatio: '9:16',
  aspectRatioToSize: (ratio: string) => {
    switch (ratio) {
      case '9:16': return '720x1280'
      case '16:9': default: return '1280x720'
    }
  },
  clampDuration: (duration: number) => {
    // 即梦只支持15或25秒
    return duration <= 15 ? 15 : 25
  },
}

// 当前使用的平台
export const currentProvider: VideoProvider = cloudswayProvider

// 导出便捷方法
export const durationOptions = currentProvider.durationOptions
export const defaultDuration = currentProvider.defaultDuration
export const aspectRatioOptions = currentProvider.aspectRatioOptions
export const defaultAspectRatio = currentProvider.defaultAspectRatio
export const aspectRatioToSize = currentProvider.aspectRatioToSize
export const clampDuration = currentProvider.clampDuration
