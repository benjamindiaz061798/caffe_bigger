'use client'
import { useEffect, useRef, useState } from 'react'

export function useScrollProgress(id) {
  const progress = useRef(0), [stage, setStage] = useState(0), [reduced, setReduced] = useState(false)
  useEffect(() => {
    const element = document.getElementById(id), preference = matchMedia('(prefers-reduced-motion: reduce)')
    let frame
    const update = () => {
      if (!element) return
      const rect = element.getBoundingClientRect()
      const p = preference.matches ? 1 : Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height - innerHeight)))
      progress.current = p
      setReduced(preference.matches)
      setStage(p < .18 ? 0 : p < .85 ? 1 : 2)
    }
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update) }
    update()
    addEventListener('scroll', schedule, { passive: true }); addEventListener('resize', schedule); preference.addEventListener('change', schedule)
    return () => { cancelAnimationFrame(frame); removeEventListener('scroll', schedule); removeEventListener('resize', schedule); preference.removeEventListener('change', schedule) }
  }, [id])
  return { progress, stage, reduced }
}
