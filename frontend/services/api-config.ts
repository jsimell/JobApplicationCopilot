export function getApiBaseUrl(): string {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
  if (!configuredBaseUrl) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL must be set to load a career profile.')
  }
  return configuredBaseUrl.replace(/\/+$/, '')
}
