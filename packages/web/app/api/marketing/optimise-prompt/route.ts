import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getMarketingState } from '@/lib/marketing/get-state'

function fallbackRefinement(prompt: string, agentName?: string) {
  const trimmed = prompt.trim()
  const segments = trimmed
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)

  const header = agentName ? `${agentName.toUpperCase()} · REFINED OPERATING PROMPT` : 'REFINED OPERATING PROMPT'

  return [
    header,
    '----------------------------------------',
    'Core Intent:',
    segments[0] ?? trimmed,
    '',
    'Execution Principles:',
    ...segments.slice(1).map((line, index) => `${index + 1}. ${line}`),
    '',
    'Always deliver structured output with rationale, measurable impact, and compliance checks.',
  ].join('\n')
}

export async function POST(request: Request) {
  try {
    const { agentId, prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ message: 'Prompt text is required' }, { status: 400 })
    }

    const apiKey =
      process.env.OPENAI_API_KEY ||
      process.env.SCAM_DUNK_OPENAI_API_KEY ||
      process.env.NEXT_PUBLIC_OPENAI_API_KEY

    const agent = (await getMarketingState()).agents.find((item) => item.id === agentId)

    if (!apiKey) {
      return NextResponse.json({
        prompt: fallbackRefinement(prompt, agent?.name),
        source: 'fallback',
        message: 'OpenAI key missing; returned structured refinement offline.',
      })
    }

    const openai = new OpenAI({ apiKey })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            'You are an elite marketing operations strategist. Tighten prompts, keep intent intact, remove redundancy, and ensure structured response requirements. Output polished prompt text only.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            agentName: agent?.name ?? agentId ?? 'marketing agent',
            mission: agent?.mission,
            currentPrompt: prompt,
          }),
        },
      ],
    })

    const refined = completion.choices[0]?.message?.content?.trim()

    if (!refined) {
      return NextResponse.json({
        prompt: fallbackRefinement(prompt, agent?.name),
        source: 'fallback',
        message: 'OpenAI response empty; supplied offline refinement instead.',
      })
    }

    return NextResponse.json({
      prompt: refined,
      source: 'openai',
    })
  } catch (error) {
    console.error('[optimise-prompt] error', error)
    return NextResponse.json({ message: 'Prompt optimisation failed' }, { status: 500 })
  }
}
