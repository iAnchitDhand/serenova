import {
  RunAnywhere,
  SDKEnvironment,
  ModelManager,
  ModelCategory,
  LLMFramework,
  EventBus,
  type CompactModelDef,
} from '@runanywhere/web'
import { LlamaCPP } from '@runanywhere/web-llamacpp'
import { ONNX } from '@runanywhere/web-onnx'

export const VOICE_MODELS: CompactModelDef[] = [
  {
    id: 'silero-vad-v5',
    name: 'Voice Activity Detection',
    url: 'https://huggingface.co/runanywhere/silero-vad-v5/resolve/main/silero_vad.onnx',
    files: ['silero_vad.onnx'],
    framework: LLMFramework.ONNX,
    modality: ModelCategory.Audio,
    memoryRequirement: 5_000_000,
  },
  {
    id: 'sherpa-onnx-whisper-tiny.en',
    name: 'Speech Recognition (Whisper)',
    url: 'https://huggingface.co/runanywhere/sherpa-onnx-whisper-tiny.en/resolve/main/sherpa-onnx-whisper-tiny.en.tar.gz',
    framework: LLMFramework.ONNX,
    modality: ModelCategory.SpeechRecognition,
    memoryRequirement: 105_000_000,
    artifactType: 'archive' as const,
  },
  {
    id: 'lfm2-350m-q4_k_m',
    name: 'Language Model (LFM2)',
    repo: 'LiquidAI/LFM2-350M-GGUF',
    files: ['LFM2-350M-Q4_K_M.gguf'],
    framework: LLMFramework.LlamaCpp,
    modality: ModelCategory.Language,
    memoryRequirement: 250_000_000,
  },
  {
    id: 'vits-piper-en_US-lessac-medium',
    name: 'Voice Synthesis (Piper)',
    url: 'https://huggingface.co/runanywhere/vits-piper-en_US-lessac-medium/resolve/main/vits-piper-en_US-lessac-medium.tar.gz',
    framework: LLMFramework.ONNX,
    modality: ModelCategory.SpeechSynthesis,
    memoryRequirement: 65_000_000,
    artifactType: 'archive' as const,
  },
]

export const MODEL_IDS = VOICE_MODELS.map(m => m.id)

let _initPromise: Promise<void> | null = null

export async function initSDK(): Promise<void> {
  if (_initPromise) return _initPromise
  _initPromise = (async () => {
    await RunAnywhere.initialize({
      environment: SDKEnvironment.Production,
      debug: false,
    })
    await LlamaCPP.register()
    await ONNX.register()
    RunAnywhere.registerModels(VOICE_MODELS)
  })()
  return _initPromise
}

export interface DownloadProgress {
  modelId: string
  progress: number
  name: string
}

export async function downloadAndLoadAllModels(
  onProgress: (p: DownloadProgress) => void
): Promise<void> {
  for (const model of VOICE_MODELS) {
    const status = ModelManager.getModel(model.id)?.status
    if (status !== 'downloaded' && status !== 'loaded') {
      await new Promise<void>((resolve, reject) => {
        const handler = (evt: { modelId: string; progress?: number }) => {
          if (evt.modelId === model.id) {
            onProgress({ modelId: model.id, progress: evt.progress ?? 0, name: model.name })
          }
        }
        EventBus.shared.on('model.downloadProgress', handler)
        ModelManager.downloadModel(model.id)
          .then(() => {
            EventBus.shared.off('model.downloadProgress', handler)
            resolve()
          })
          .catch((err) => {
            EventBus.shared.off('model.downloadProgress', handler)
            reject(err)
          })
      })
    }
    await ModelManager.loadModel(model.id, { coexist: true })
  }
}

export function areAllModelsLoaded(): boolean {
  return !!(
    ModelManager.getLoadedModel(ModelCategory.Audio) &&
    ModelManager.getLoadedModel(ModelCategory.SpeechRecognition) &&
    ModelManager.getLoadedModel(ModelCategory.Language) &&
    ModelManager.getLoadedModel(ModelCategory.SpeechSynthesis)
  )
}

export { ModelManager, ModelCategory }