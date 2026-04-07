import { put } from '@vercel/blob'

export async function uploadToOSS(file: File, key: string): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const pathname = `${key}.${ext}`
  const { url } = await put(pathname, file, { access: 'public' })
  return url
}
