'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return

    setLoading(true)
    setError('')

    try {
      const text = await file.text()
      const lines = text.split('\n')
      
      // Parse CSV (simple version)
      const subscriptions = lines.slice(1).map((line) => {
        const [tool_name, cost_monthly, renewal_date] = line.split(',')
        return {
          tool_name: tool_name?.trim(),
          cost_monthly: parseFloat(cost_monthly),
          renewal_date: renewal_date?.trim(),
          status: 'active',
        }
      }).filter(s => s.tool_name)

      // Get current user
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Not logged in')

      // Save to database
      const { error: dbError } = await supabase
        .from('subscriptions')
        .insert(subscriptions.map(s => ({ ...s, user_id: session.user.id })))

      if (dbError) throw dbError

      router.push('/dashboard')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded">
      <h1 className="text-2xl font-bold mb-4">Upload Subscriptions</h1>
      <form onSubmit={handleUpload}>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="mb-4 block w-full"
          required
        />
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Uploading...' : 'Upload CSV'}
        </Button>
      </form>
    </div>
  )
}