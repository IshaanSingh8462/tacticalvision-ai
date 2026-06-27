'use client'

  import { useEffect, useState } from 'react'
  import { createClient } from '@/lib/supabase/client'

  // Define the shape of a job row from the database.
  // This matches exactly what you created in the jobs table.
  export type JobStatus = {
    id: string
    status: 'queued' | 'downloading' | 'extracting_clip' | 'running_yolo' |
            'running_homography' | 'running_gemini' | 'complete' | 'error'
    progress_pct: number
    current_stage_label: string | null
    error_message: string | null
  }

  // Custom React hook that subscribes to real-time job status updates.
  // Usage: const { job, isComplete } = useJobStatus(jobId)
  export function useJobStatus(jobId: string | null) {
    const [job, setJob] = useState<JobStatus | null>(null)
    const supabase = createClient()

    useEffect(() => {
      // If no jobId, there's nothing to subscribe to yet.
      if (!jobId) return

      // First, fetch the current state of the job immediately.
      // This handles the case where the component mounts after
      // the job has already progressed past its initial state.
      supabase
        .from('jobs')
        .select('id, status, progress_pct, current_stage_label, error_message')
        .eq('id', jobId)
        .single()
        .then(({ data }) => { if (data) setJob(data) })

      // Then subscribe to all future changes to this specific job row.
      // Supabase Realtime uses PostgreSQL's logical replication to
      // broadcast row-level changes over a WebSocket.
      const channel = supabase
        .channel(`job-${jobId}`)           // Unique channel name per job
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',               // Only listen for UPDATEs (not INSERT/DELETE)
            schema: 'public',
            table: 'jobs',
            filter: `id=eq.${jobId}`,      // Only this specific job row
          },
          (payload) => {
            // payload.new contains the full updated row data.
            // We update local state, which re-renders the component
            // and drives the progressive UI reveal.
            setJob(payload.new as JobStatus)
          }
        )
        .subscribe()

      // Cleanup function: when the component unmounts or jobId changes,
      // unsubscribe from the channel to prevent memory leaks.
      return () => {
        supabase.removeChannel(channel)
      }
    }, [jobId])  // Re-run this effect whenever jobId changes

    return {
      job,
      isComplete: job?.status === 'complete',
      isError: job?.status === 'error',
      progressPct: job?.progress_pct ?? 0,
    }
  }
