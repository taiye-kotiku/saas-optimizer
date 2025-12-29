interface Subscription {
  id: string
  tool_name: string
  cost_monthly: number
  renewal_date: string
  status: string
}

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions'

export async function analyzeSubscriptionsWithAI(subscriptions: Subscription[]) {
  const prompt = `
You are a SaaS spending analyst. Analyze this subscription list and find:

1. DUPLICATES: Tools with same/similar names (e.g., Slack + Slack Pro)
2. UNUSED: Tools appearing multiple times (likely copies)
3. COST_OPTIMIZATION: Subscriptions that are overpriced or redundant

Subscription Data:
${subscriptions.map(s => `- ${s.tool_name}: $${s.cost_monthly}/month (renewal: ${s.renewal_date})`).join('\n')}

IMPORTANT: Return ONLY valid JSON, no other text.

Return exactly this JSON format:
{
  "duplicates": [
    {
      "tools": ["Tool1", "Tool2"],
      "reason": "Both are project management tools",
      "estimatedWaste": 50
    }
  ],
  "unused": [
    {
      "tool": "ToolName",
      "reason": "Appears multiple times in list",
      "estimatedWaste": 25
    }
  ],
  "totalWaste": 75,
  "recommendations": [
    "Consider cancelling duplicate subscriptions",
    "Keep the tool with best features/price ratio"
  ]
}
`

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'DeepSeek API error')
    }

    // Extract JSON from response
    const content = data.choices[0].message.content
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    
    if (!jsonMatch) {
      throw new Error('Invalid response format from DeepSeek')
    }

    const analysis = JSON.parse(jsonMatch[0])
    return analysis
  } catch (error) {
    console.error('DeepSeek error:', error)
    throw error
  }
}