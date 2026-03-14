import { describe, expect, it, vi } from 'vitest'

// Mock all AI SDK provider modules so tests run without installing the actual packages
vi.mock('@ai-sdk/openai', () => ({ openai: 'mock-openai-provider' }))
vi.mock('@ai-sdk/google', () => ({ google: 'mock-google-provider' }))
vi.mock('@ai-sdk/huggingface', () => ({ huggingface: 'mock-huggingface-provider' }))
vi.mock('jina-ai-provider', () => ({ jina: 'mock-jina-provider' }))
vi.mock('voyage-ai-provider', () => ({ voyage: 'mock-voyage-provider' }))
vi.mock('@ai-sdk/cohere', () => ({ cohere: 'mock-cohere-provider' }))

describe('loadProvider', () => {
  async function getLoadProvider() {
    const { loadProvider } = await import('../../../src/shared/utils/provider-loader-map.util.js')
    return loadProvider
  }

  describe('known providers', () => {
    it('should load the openai provider', async () => {
      const loadProvider = await getLoadProvider()
      const provider = await loadProvider('openai')
      expect(provider).toBe('mock-openai-provider')
    })

    it('should load the google provider', async () => {
      const loadProvider = await getLoadProvider()
      const provider = await loadProvider('google')
      expect(provider).toBe('mock-google-provider')
    })

    it('should load the huggingface provider', async () => {
      const loadProvider = await getLoadProvider()
      const provider = await loadProvider('huggingface')
      expect(provider).toBe('mock-huggingface-provider')
    })

    it('should load the jina provider', async () => {
      const loadProvider = await getLoadProvider()
      const provider = await loadProvider('jina')
      expect(provider).toBe('mock-jina-provider')
    })

    it('should load the voyage provider', async () => {
      const loadProvider = await getLoadProvider()
      const provider = await loadProvider('voyage')
      expect(provider).toBe('mock-voyage-provider')
    })

    it('should load the cohere provider', async () => {
      const loadProvider = await getLoadProvider()
      const provider = await loadProvider('cohere')
      expect(provider).toBe('mock-cohere-provider')
    })
  })

  describe('unknown providers', () => {
    it('should throw for an unknown provider name', async () => {
      const loadProvider = await getLoadProvider()
      await expect(loadProvider('unknown-provider')).rejects.toThrow(
        'Unknown provider: unknown-provider'
      )
    })

    it('should throw for an empty string', async () => {
      const loadProvider = await getLoadProvider()
      await expect(loadProvider('')).rejects.toThrow('Unknown provider: ')
    })

    it('should throw for a prototype pollution attempt (__proto__)', async () => {
      const loadProvider = await getLoadProvider()
      await expect(loadProvider('__proto__')).rejects.toThrow('Unknown provider: __proto__')
    })

    it('should throw for a prototype pollution attempt (constructor)', async () => {
      const loadProvider = await getLoadProvider()
      await expect(loadProvider('constructor')).rejects.toThrow('Unknown provider: constructor')
    })

    it('should throw for a prototype pollution attempt (toString)', async () => {
      const loadProvider = await getLoadProvider()
      await expect(loadProvider('toString')).rejects.toThrow('Unknown provider: toString')
    })
  })

  describe('return type', () => {
    it('should return a Promise', async () => {
      const loadProvider = await getLoadProvider()
      const result = loadProvider('openai')
      expect(result).toBeInstanceOf(Promise)
      await result
    })
  })
})
