'use client'
import { useEffect, useRef } from 'react'
export const Arrow = () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.5" /></svg>
export const Bag = () => <svg width="20" height="22" viewBox="0 0 24 26" fill="none" aria-hidden="true"><path d="M4 8h16l1 15H3L4 8Z" stroke="currentColor" strokeWidth="1.5" /><path d="M8 9V6a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.5" /></svg>
export function Brand({ light }) { return <span className={`brand ${light ? 'light' : ''}`}><img src="/brand/bigger-symbol.png" alt="" /><span><b>BIGGER<span className="brand-dot">®</span></b><small>COFFEE & SANDWICH</small></span></span> }
export const money = value => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value)
export function Modal({ open, onClose, title, children, className = '', keepMounted = false }) {
  const ref = useRef(null), closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement, oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    ref.current?.focus()
    const handle = e => {
      if (e.key === 'Escape') closeRef.current()
      if (e.key === 'Tab') {
        const nodes = ref.current?.querySelectorAll('button:not(:disabled), a[href], input, [tabindex="0"]')
        if (!nodes?.length) { e.preventDefault(); return }
        const first = nodes[0], last = nodes[nodes.length - 1]
        if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && (document.activeElement === last || document.activeElement === ref.current)) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', handle)
    return () => { document.body.style.overflow = oldOverflow; document.removeEventListener('keydown', handle); previous?.focus() }
  }, [open])
  if (!open && !keepMounted) return null
  return <div className="modal-backdrop" hidden={!open} style={!open?{display:'none'}:undefined} onClick={e => { if (e.target === e.currentTarget) onClose() }}><section ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className={`modal ${className}`}><button className="close-button" aria-label="Cerrar" onClick={onClose}>×</button>{children}</section></div>
}
