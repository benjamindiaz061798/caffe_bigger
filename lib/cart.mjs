import { resolveLine } from './catalog.mjs'

export function addCartItem(cart, input) {
  const line = resolveLine(input)
  const existing = cart.find(item => item.key === line.key)
  if ((existing?.quantity || 0) + line.quantity > 20) throw new Error('Máximo 20 unidades por preparación.')
  const item = { id: line.id, key: line.key, options: line.options, quantity: line.quantity }
  return existing ? cart.map(current => current.key === line.key ? { ...current, quantity: current.quantity + line.quantity } : current) : [...cart, item]
}

export function setCartQuantity(cart, key, quantity) {
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > 20) throw new Error('La cantidad debe estar entre 0 y 20.')
  return quantity === 0 ? cart.filter(item => item.key !== key) : cart.map(item => item.key === key ? { ...item, quantity } : item)
}
