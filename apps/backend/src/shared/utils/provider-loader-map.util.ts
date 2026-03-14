type ProviderLoader = () => Promise<unknown>

const providerLoaders = {
  openai: async () => (await import('@ai-sdk/openai')).openai,
  google: async () => (await import('@ai-sdk/google')).google,
  huggingface: async () => (await import('@ai-sdk/huggingface')).huggingface,
  voyage: async () => (await import('voyage-ai-provider')).voyage,
  cohere: async () => (await import('@ai-sdk/cohere')).cohere,
} as const satisfies Record<string, ProviderLoader>

export type ProviderName = keyof typeof providerLoaders

export async function loadProvider(provider: string): Promise<unknown> {
  if (!Object.hasOwn(providerLoaders, provider)) {
    throw new Error(`Unknown provider: ${provider}`)
  }

  const loader = providerLoaders[provider as ProviderName]

  return loader()
}
