import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Admin emails from environment
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())

export async function GET() {
  try {
    // Check if user is admin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase() || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const apiKey = process.env.RESEND_API_KEY
    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      resend: {
        configured: !!apiKey,
        apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'NOT SET',
        apiKeyLength: apiKey?.length || 0,
      },
      appUrl: {
        configured: !!appUrl,
        value: appUrl || 'NOT SET (will use default: https://app.aeromatch.eu)',
      },
      emailSettings: {
        fromAddress: 'matchrequest@aeromatch.eu',
        fromName: 'aeroMatch',
      },
    }

    return NextResponse.json(diagnostics)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


