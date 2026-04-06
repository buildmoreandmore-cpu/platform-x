import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Anthropic API key not configured' })
  }

  const { question, contract_id, contract_data, readings } = req.body

  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Question is required' })
  }

  try {
    const client = new Anthropic({ apiKey })

    // Build context from contract data
    let context = 'No contract data available.'
    if (contract_data) {
      const d = contract_data
      const shortfall = d.guaranteed_savings_annual && d.verified_savings_ytd
        ? d.guaranteed_savings_annual - d.verified_savings_ytd
        : 0
      const dscr = d.guaranteed_savings_annual && d.verified_savings_ytd
        ? d.verified_savings_ytd / d.guaranteed_savings_annual
        : 0

      context = [
        `Client: ${d.client_name || 'Unknown'}`,
        `Building: ${d.building_name || 'Unknown'}`,
        `Contract Value: $${(d.contract_value || 0).toLocaleString()}`,
        `Guaranteed Annual Savings: $${(d.guaranteed_savings_annual || 0).toLocaleString()}`,
        `Verified Savings YTD: $${(d.verified_savings_ytd || 0).toLocaleString()}`,
        `Performance: ${(d.performance_pct || 0).toFixed(1)}%`,
        `Current Year: ${d.current_year || '?'} of ${d.contract_term_years || '?'}`,
        `Shortfall: $${shortfall.toLocaleString()}`,
        `Debt Service Coverage Ratio (DSCR): ${dscr.toFixed(2)}`,
        '',
        'ECM Details:',
        ...(d.ecms || []).map((e: any, i: number) =>
          `  ${i + 1}. ${e.name} (${e.type}): Guaranteed $${(e.guaranteed || 0).toLocaleString()}, Verified $${(e.verified || 0).toLocaleString()}, Performance ${(e.performance || 0).toFixed(1)}%`
        ),
      ].join('\n')
    }

    const systemPrompt = `You are the Vantage AI assistant, helping building owners understand their energy performance contract (ESPC) data.

LIVE CONTRACT DATA:
${context}

RULES:
- Answer in plain English, no jargon
- Use actual numbers from the data above
- If performance is below 90%, acknowledge it honestly and explain what it means
- Keep answers under 150 words
- Never make up data — only reference numbers provided above
- If asked about something not in the data, say you don't have that information
- Be helpful and straightforward`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 300,
      system: systemPrompt,
      messages: [
        { role: 'user', content: question },
      ],
    })

    const answer = message.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('')

    return res.status(200).json({ answer })
  } catch (err: any) {
    console.error('[client-query] Error:', err)
    return res.status(500).json({ error: 'Failed to process query', detail: err.message })
  }
}
