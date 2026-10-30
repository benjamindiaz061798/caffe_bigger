import { randomBytes, createHash, timingSafeEqual } from 'node:crypto'
import { mkdir, readFile, writeFile, rename, rm, stat } from 'node:fs/promises'
import path from 'node:path'
const hash = value => createHash('sha256').update(value).digest('hex')
export const secretHash = hash
export const newSecret = () => randomBytes(32).toString('hex')
export function matchesSecret(value, expected) {
  return typeof value === 'string' && typeof expected === 'string' && expected.length === 64 && timingSafeEqual(Buffer.from(hash(value)),Buffer.from(expected))
}
export function validOrderId(id) { return typeof id === 'string' && /^[a-f0-9-]{36}$/.test(id) }
const directory = () => path.resolve(process.env.ORDER_DATA_DIR || path.join(process.cwd(),'.data','orders'))
export async function readOrder(id) {
  if (!validOrderId(id)) return null
  try { return JSON.parse(await readFile(path.join(directory(),`${id}.json`),'utf8')) } catch(error) { if(error.code === 'ENOENT') return null; throw error }
}
export async function saveOrder(order) {
  if (!validOrderId(order.id)) throw new Error('Identificador inválido.')
  await mkdir(directory(),{recursive:true})
  const target = path.join(directory(),`${order.id}.json`), temporary = `${target}.${randomBytes(6).toString('hex')}.tmp`
  await writeFile(temporary,JSON.stringify(order),{mode:0o600})
  try { await rename(temporary,target) } finally { await rm(temporary,{force:true}) }
}
export async function withOrderLock(id, action) {
  if (!validOrderId(id)) throw new Error('Identificador inválido.')
  await mkdir(directory(),{recursive:true})
  const lock = path.join(directory(),`${id}.lock`)
  for(let attempt=0;attempt<100;attempt++) {
    try { await mkdir(lock); break } catch(error) {
      if(error.code !== 'EEXIST') throw error
      // Locks older than two minutes belong to an interrupted process.
      try { if(Date.now()-(await stat(lock)).mtimeMs>120000) await rm(lock,{recursive:true,force:true}) } catch(error) { if(error.code!=='ENOENT') throw error }
      if(attempt===99) throw new Error('Hay otra operación en curso. Inténtalo en unos segundos.')
      await new Promise(resolve => setTimeout(resolve,100))
    }
  }
  try { return await action() } finally { await rm(lock,{recursive:true,force:true}) }
}
export function receipt(order) {
  return { id:order.id, buyOrder:order.buyOrder, status:order.status, amount:order.amount, lines:order.lines, environment:order.environment, createdAt:order.createdAt, paidAt:order.paidAt, authorizationCode:order.authorizationCode, paymentType:order.paymentType, cardLast4:order.cardLast4 }
}
