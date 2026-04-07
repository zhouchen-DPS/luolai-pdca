import OSS from 'ali-oss'

function getClient() {
  return new OSS({
    region: process.env.OSS_REGION!,
    accessKeyId: process.env.OSS_ACCESS_KEY_ID!,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET!,
    bucket: process.env.OSS_BUCKET!,
  })
}

export async function uploadToOSS(file: File, key: string): Promise<string> {
  const client = getClient()
  const buffer = Buffer.from(await file.arrayBuffer())
  const ext = file.name.split('.').pop() ?? 'jpg'
  const objectKey = `${key}.${ext}`
  const result = await client.put(objectKey, buffer, {
    headers: { 'Content-Type': file.type },
  })
  return result.url as string
}
