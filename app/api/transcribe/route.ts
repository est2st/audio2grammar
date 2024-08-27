import { NextResponse } from 'next/server'
import { createClient } from "@deepgram/sdk";

export async function POST(request: Request) {
  const deepgram = createClient(process.env.NEXT_PUBLIC_DEEPG)

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { result } = await deepgram.listen.prerecorded.transcribeFile(
      buffer,
    {
      model: 'nova-2',
      paragraphs: true,
      punctuate: true,
      dictation: false,
      language: 'en-US',
    })
    
    // @ts-ignore
    return NextResponse.json({ transcript: result.results.channels[0].alternatives[0].transcript })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'An error occurred during transcription' }, { status: 500 })
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
