'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Business } from '@/types/database'

export function useBusiness() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchBusiness() {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setLoading(false)
          return
        }

        // Get the user's business through business_users join
        const { data: businessUsers, error: joinError } = await supabase
          .from('business_users')
          .select('business_id')
          .eq('user_id', user.id)
          .limit(1)
          .single()

        if (joinError || !businessUsers) {
          setLoading(false)
          return
        }

        // Fetch the business details
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', businessUsers.business_id)
          .single()

        if (businessError) throw businessError

        setBusiness(businessData)
      } catch (error) {
        console.error('Error fetching business:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBusiness()
  }, [supabase])

  return { business, loading, setBusiness }
}
