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

interface Analysis {
  duplicates: string[]
  totalMonthly: number
  wasteFromDuplicates: number
  totalWaste: number
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(true)
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

        // Run analysis
        if (data && data.length > 0) {
          const res = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id }),
          })
          const result = await res.json()
          setAnalysis(result)
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  async function handleLogout() {
    await logOut()
    router.push('/login')
  }

  if (loading) return <div className="p-8"><p>Loading...</p></div>
  if (!user) return <div className="p-8"><p>Redirecting to login...</p></div>

  const totalCost = subscriptions.reduce((sum, sub) => sum + (sub.cost_monthly || 0), 0)

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">SaaS Dashboard</h1>
        <Button onClick={handleLogout} variant="outline">Logout</Button>
      </div>

      <p className="text-lg mb-8">Welcome, <span className="font-semibold">{user.email}</span></p>

      {/* Action Button */}
      <Button 
        onClick={() => router.push('/upload')} 
        className="mb-8 bg-blue-600 hover:bg-blue-700"
      >
        + Upload New CSV
      </Button>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {/* Total Monthly Cost */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-600 mb-2">Total Monthly Cost</p>
          <p className="text-3xl font-bold text-blue-600">${totalCost.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-2">{subscriptions.length} subscriptions</p>
        </div>

        {/* Waste Alert */}
        {analysis && analysis.totalWaste > 0 && (
          <div className="bg-red-50 p-6 rounded-lg border border-red-200">
            <p className="text-sm text-gray-600 mb-2">⚠️ Potential Waste</p>
            <p className="text-3xl font-bold text-red-600">${analysis.totalWaste.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-2">per month</p>
          </div>
        )}
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="mb-8">
          {analysis.duplicates.length > 0 && (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-4">
              <p className="font-semibold text-yellow-800">🔍 Duplicates Detected</p>
              <p className="text-sm text-yellow-700 mt-2">
                You have multiple subscriptions for: <span className="font-semibold">{analysis.duplicates.join(', ')}</span>
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Estimated waste: ${analysis.wasteFromDuplicates.toFixed(2)}/month
              </p>
            </div>
          )}
        </div>
      )}

      {/* Subscriptions Table */}
      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Your Subscriptions</h2>
        </div>

        {subscriptions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No subscriptions yet.</p>
            <p className="text-sm mt-2">Upload a CSV file to get started.</p>
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
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{sub.tool_name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600">${sub.cost_monthly?.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600">{sub.renewal_date || 'N/A'}</span>
                    </td>
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