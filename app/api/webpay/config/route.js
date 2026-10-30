import { NextResponse } from 'next/server'
import { webpayConfig } from '../../../../lib/webpay.mjs'
export const dynamic='force-dynamic'
export function GET(){try{const config=webpayConfig();return NextResponse.json({environment:config.environment,ready:true},{headers:{'Cache-Control':'no-store'}})}catch{return NextResponse.json({environment:'unconfigured',ready:false},{status:503})}}
