'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Subscribes to Postgres changes on one or more tables and calls
 * onRefresh() whenever INSERT / UPDATE / DELETE fires for this org.
 *
 * Usage:
 *   useRealtime(['customers', 'sales'], fetchData)
 */
export function useRealtime(tables: string[], onRefresh: () => void) {
  const supabase = createClient()
  const refreshRef = useRef(onRefresh)
  refreshRef.current = onRefresh

  useEffect(() => {
    if (!tables.length) return

    const channelName = `realtime-${tables.join('-')}-${Math.random().toString(36).slice(2)}`

    let channel = supabase.channel(channelName)
    tables.forEach((table) => {
      channel = channel.on(
        'postgres_changes' as Parameters<typeof channel.on>[0],
        { event: '*', schema: 'public', table },
        () => refreshRef.current()
      )
    })

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
