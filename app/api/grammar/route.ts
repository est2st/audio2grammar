import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { text } = await request.json()

  const languageToolEndpoint = 'https://api.languagetool.org/v2/check'
  
  const params = new URLSearchParams({
    'text': text,
    'language': 'en-US',
    'enabledOnly': 'false',
  })

  try {
    const response = await fetch(`${languageToolEndpoint}?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    if (!response.ok) {
      throw new Error('Grammar analysis failed')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'An error occurred during grammar analysis' }, { status: 500 })
  }
}