import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()

    // Get user's subscriptions
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)

    if (!subscriptions) {
      return NextResponse.json({ error: 'No subscriptions found' }, { status: 400 })
    }

    // Simple duplicate detection (find same tool names)
    const toolNames = subscriptions.map(s => s.tool_name.toLowerCase())
    const duplicates = toolNames.filter((name, index) => toolNames.indexOf(name) !== index)

    // Calculate total waste
    const totalMonthly = subscriptions.reduce((sum, s) => sum + (s.cost_monthly || 0), 0)
    const wasteFromDuplicates = duplicates.length * 50 // estimate

    return NextResponse.json({
      duplicates,
      totalMonthly,
      wasteFromDuplicates,
      totalWaste: wasteFromDuplicates,
    })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}