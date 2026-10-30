import { EnvHttpProxyAgent } from 'undici'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

let dispatcherPromise
// Development on Windows may use the OS proxy even when HTTPS_PROXY is absent.
// Discovery is read-only; proxy configuration is kept in memory, never persisted.
export function paymentDispatcher() {
  if (!dispatcherPromise) dispatcherPromise = (async () => {
    let proxy = process.env.https_proxy || process.env.HTTPS_PROXY || process.env.http_proxy || process.env.HTTP_PROXY
    if (!proxy && process.platform === 'win32' && process.env.NODE_ENV !== 'production' && process.env.WEBPAY_USE_SYSTEM_PROXY !== 'false') {
      try {
        const { stdout } = await promisify(execFile)('powershell.exe',['-NoProfile','-NonInteractive','-Command',"$u=[Uri]'https://webpay3gint.transbank.cl'; $p=[System.Net.WebRequest]::GetSystemWebProxy().GetProxy($u); if($p.AbsoluteUri -ne $u.AbsoluteUri){[Console]::Write($p.AbsoluteUri)}"],{windowsHide:true,timeout:6000})
        proxy = stdout.trim() || undefined
      } catch { /* Direct access remains available when no system proxy can be read. */ }
    }
    return proxy ? new EnvHttpProxyAgent({httpsProxy:proxy,httpProxy:proxy}) : undefined
  })()
  return dispatcherPromise
}
