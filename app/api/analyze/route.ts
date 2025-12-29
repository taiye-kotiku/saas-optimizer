import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { analyzeSubscriptionsWithAI } from '@/lib/deepseek'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    // Fetch user's subscriptions
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        duplicates: [],
        unused: [],
        totalWaste: 0,
        recommendations: [],
      })
    }

    // Call DeepSeek AI
    const analysis = await analyzeSubscriptionsWithAI(subscriptions)

    return NextResponse.json({
      ...analysis,
      subscriptionCount: subscriptions.length,
      totalMonthly: subscriptions.reduce((sum, s) => sum + (s.cost_monthly || 0), 0),
    })
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}