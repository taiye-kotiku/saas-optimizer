'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { logIn } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin() {
    try {
      await logIn(email, password)
      router.push('/dashboard')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mb-4"
      />
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mb-4"
      />
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <Button onClick={handleLogin} className="w-full">Login</Button>
    </div>
  )
}