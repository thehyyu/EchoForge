import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: ['audio/mpeg', 'audio/mp4', 'audio/m4a', 'audio/wav', 'audio/webm', 'audio/ogg'],
          maximumSizeInBytes: 500 * 1024 * 1024,
        }
      },
      onUploadCompleted: async ({ blob }) => {
        await sql`
          INSERT INTO jobs (type, source_url, status)
          VALUES ('voice', ${blob.url}, 'pending')
        `
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}
