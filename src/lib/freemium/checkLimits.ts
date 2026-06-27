import { createClient } from '@/lib/supabase/client'

  export type TierLimits = {
    canUpload: boolean
    canRunAiAnalysis: boolean
    canUseClipSelector: boolean      // In-app 2-min clip selector (paid)
    canViewInteractivePitch: boolean // Animated frame-synced pitch (paid)
    canViewOverlays: boolean         // Video circles/lines overlay (paid)
    canExportMp4: boolean            // Download annotated video (paid)
    canViewTacticalEvents: boolean   // Pass/run/structure lines on pitch (paid)
    tier: 'free' | 'pro' | 'team'
    aiAnalysesRemaining: number
    uploadsRemaining: number
  }

  export async function getUserLimits(): Promise<TierLimits | null> {
    const supabase = createClient()

    // Fetch both tables in parallel for efficiency using Promise.all.
    // These are two separate queries, but they run simultaneously.
    const [{ data: sub }, { data: usage }] = await Promise.all([
      supabase
        .from('subscriptions')
        .select('tier')
        .single(),
      supabase
        .from('usage_limits')
        .select('ai_analyses_used_this_week, ai_analyses_limit_per_week, uploads_this_week, uploads_limit_per_week, week_reset_at')
        .single(),
    ])

    if (!sub || !usage) return null

    const tier = sub.tier as 'free' | 'pro' | 'team'
    const isPaid = tier === 'pro' || tier === 'team'

    // Check if the weekly counter needs to be reset.
    // This is a client-side check for UI purposes only.
    // The server enforces the actual reset in Phase 3.
    const weekResetAt = new Date(usage.week_reset_at)
    const daysSinceReset = (Date.now() - weekResetAt.getTime()) / (1000 * 60 * 60 * 24)
    const countersAreStale = daysSinceReset >= 7

    const aiUsed = countersAreStale ? 0 : usage.ai_analyses_used_this_week
    const uploadsUsed = countersAreStale ? 0 : usage.uploads_this_week

    return {
      tier,
      canUpload: isPaid || uploadsUsed < usage.uploads_limit_per_week,
      canRunAiAnalysis: isPaid || aiUsed < usage.ai_analyses_limit_per_week,
      // All interactive features below are paid-only:
      canUseClipSelector: isPaid,
      canViewInteractivePitch: isPaid,
      canViewOverlays: isPaid,
      canExportMp4: isPaid,
      canViewTacticalEvents: isPaid,
      aiAnalysesRemaining: isPaid ? Infinity : Math.max(0, usage.ai_analyses_limit_per_week - aiUsed),
      uploadsRemaining: isPaid ? Infinity : Math.max(0, usage.uploads_limit_per_week - uploadsUsed),
    }
  }

