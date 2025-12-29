'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getCurrentUser, logOut } from '@/lib/auth'
import { Button } from '@/components/ui/button'

interface Subscription {
  id: string
  tool_name: string
  cost_monthly: number
  renewal_date: string
  status: string
}

interface User {
  id: string
  email: string
}

interface Duplicate {
  tools: string[]
  reason: string
  estimatedWaste: number
}

interface Unused {
  tool: string
  reason: string
  estimatedWaste: number
}

interface Analysis {
  duplicates: Duplicate[]
  unused: Unused[]
  totalWaste: number
  recommendations: string[]
  subscriptionCount: number
  totalMonthly: number
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          router.push('/login')
          return
        }

        setUser(currentUser as User)

        // Fetch subscriptions
        const { data } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', currentUser.id)

        setSubscriptions(data || [])

        // Run analysis if subscriptions exist
        if (data && data.length > 0) {
          await runAnalysis(currentUser.id)
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  async function runAnalysis(userId: string) {
    setAnalyzing(true)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const result = await res.json()
      setAnalysis(result)
    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleLogout() {
    await logOut()
    router.push('/login')
  }

  if (loading) return <div className="p-8"><p>Loading...</p></div>
  if (!user) return <div className="p-8"><p>Redirecting...</p></div>

  const totalCost = subscriptions.reduce((sum, sub) => sum + (sub.cost_monthly || 0), 0)
  const savingsPercentage = analysis ? ((analysis.totalWaste / totalCost) * 100).toFixed(1) : 0

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">SaaS Optimizer</h1>
        <Button onClick={handleLogout} variant="outline">Logout</Button>
      </div>

      <p className="text-lg mb-8">Welcome, <span className="font-semibold">{user.email}</span></p>

      {/* Upload Button */}
      <Button 
        onClick={() => router.push('/upload')} 
        className="mb-8 bg-blue-600 hover:bg-blue-700"
      >
        + Upload CSV
      </Button>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Total Cost */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-600 mb-2">Total Monthly Cost</p>
          <p className="text-3xl font-bold text-blue-600">${totalCost.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-2">{subscriptions.length} subscriptions</p>
        </div>

        {/* Waste Amount */}
        {analysis && analysis.totalWaste > 0 && (
          <div className="bg-red-50 p-6 rounded-lg border border-red-200">
            <p className="text-sm text-gray-600 mb-2">💸 Potential Waste</p>
            <p className="text-3xl font-bold text-red-600">${analysis.totalWaste.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-2">{savingsPercentage}% of spending</p>
          </div>
        )}

        {/* Re-analyze Button */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 flex flex-col justify-center">
          <Button 
            onClick={() => user && runAnalysis(user.id)}
            disabled={analyzing}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {analyzing ? 'Analyzing...' : '🤖 Re-analyze'}
          </Button>
        </div>
      </div>

      {/* Duplicates Section */}
      {analysis && analysis.duplicates.length > 0 && (
        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200 mb-8">
          <h2 className="text-xl font-bold text-yellow-900 mb-4">🔍 Duplicate Subscriptions</h2>
          <div className="space-y-4">
            {analysis.duplicates.map((dup, idx) => (
              <div key={idx} className="bg-white p-4 rounded border border-yellow-100">
                <p className="font-semibold text-gray-900">{dup.tools.join(' + ')}</p>
                <p className="text-sm text-gray-600 mt-1">{dup.reason}</p>
                <p className="text-sm font-semibold text-yellow-700 mt-2">
                  Estimated waste: ${dup.estimatedWaste.toFixed(2)}/month
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unused Tools Section */}
      {analysis && analysis.unused.length > 0 && (
        <div className="bg-orange-50 p-6 rounded-lg border border-orange-200 mb-8">
          <h2 className="text-xl font-bold text-orange-900 mb-4">⚠️ Likely Unused Tools</h2>
          <div className="space-y-4">
            {analysis.unused.map((unused, idx) => (
              <div key={idx} className="bg-white p-4 rounded border border-orange-100">
                <p className="font-semibold text-gray-900">{unused.tool}</p>
                <p className="text-sm text-gray-600 mt-1">{unused.reason}</p>
                <p className="text-sm font-semibold text-orange-700 mt-2">
                  Estimated waste: ${unused.estimatedWaste.toFixed(2)}/month
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {analysis && analysis.recommendations.length > 0 && (
        <div className="bg-green-50 p-6 rounded-lg border border-green-200 mb-8">
          <h2 className="text-xl font-bold text-green-900 mb-4">💡 Recommendations</h2>
          <ul className="space-y-2">
            {analysis.recommendations.map((rec, idx) => (
              <li key={idx} className="text-sm text-green-800 flex items-start">
                <span className="mr-3">✓</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Subscriptions Table */}
      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">All Subscriptions</h2>
        </div>

        {subscriptions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No subscriptions uploaded yet.</p>
            <p className="text-sm mt-2">Upload a CSV to analyze your SaaS spending.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Tool Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Monthly Cost</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Renewal Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{sub.tool_name}</td>
                    <td className="px-6 py-4 text-gray-600">${sub.cost_monthly?.toFixed(2)}</td>
                    <td className="px-6 py-4 text-gray-600">{sub.renewal_date || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        sub.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}