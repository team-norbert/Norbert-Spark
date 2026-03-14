type ProviderLoader = () => Promise<any>

const providerLoaders: Record<string, ProviderLoader> = {
  openai: async () => (await import('@ai-sdk/openai')).openai,
  google: async () => (await import('@ai-sdk/google')).google,
  huggingface: async () => (await import('@ai-sdk/huggingface')).huggingface,
  jina: async () => (await import('jina-ai-provider')).jina,
  voyage: async () => (await import('voyage-ai-provider')).voyage,
  cohere: async () => (await import('@ai-sdk/cohere')).cohere,
}

export async function loadProvider(provider: string): Promise<any> {
  if (!Object.hasOwn(providerLoaders, provider)) {
    throw new Error(`Unknown provider: ${provider}`)
  }

  // eslint-disable-next-line security/detect-object-injection
  const loader = providerLoaders[provider]!

  return loader()
}
