'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, logOut } from '@/lib/auth'
import { Button } from '@/components/ui/button'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      router.push('/login')
    } else {
      setUser(currentUser)
    }
  }

  async function handleLogout() {
    await logOut()
    router.push('/login')
  }

  if (!user) return <p>Loading...</p>

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-4">Welcome, {user.email}</p>
      <Button onClick={handleLogout} className="mt-4">Logout</Button>
    </div>
  )
}