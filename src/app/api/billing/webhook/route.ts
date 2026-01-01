import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getPlanByPaddlePriceId } from '@/lib/billing/plans'
import crypto from 'crypto'

// Create Supabase admin client for webhook processing
// This bypasses RLS as webhooks need to update subscription status
function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for webhook processing')
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Verify Paddle webhook signature
function verifyPaddleSignature(
  rawBody: string, 
  signature: string | null,
  secret: string
): boolean {
  if (!signature || !secret) {
    console.warn('Missing signature or secret for webhook verification')
    return false
  }

  try {
    // Paddle uses ts;h1=signature format
    const parts = signature.split(';')
    const tsHeader = parts.find(p => p.startsWith('ts='))
    const h1Header = parts.find(p => p.startsWith('h1='))
    
    if (!tsHeader || !h1Header) {
      return false
    }
    
    const timestamp = tsHeader.replace('ts=', '')
    const providedSignature = h1Header.replace('h1=', '')
    
    // Build signed payload
    const signedPayload = `${timestamp}:${rawBody}`
    
    // Compute expected signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex')
    
    return crypto.timingSafeEqual(
      Buffer.from(providedSignature),
      Buffer.from(expectedSignature)
    )
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('paddle-signature')
    const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET

    // Verify signature in production
    if (process.env.PADDLE_ENV === 'production' && webhookSecret) {
      const isValid = verifyPaddleSignature(rawBody, signature, webhookSecret)
      if (!isValid) {
        console.error('Invalid webhook signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const event = JSON.parse(rawBody)
    const eventType = event.event_type
    const eventId = event.event_id
    const data = event.data

    console.log(`Processing Paddle webhook: ${eventType} (${eventId})`)

    const supabase = getAdminClient()

    // Check for duplicate event (idempotency)
    const { data: existingEvent } = await supabase
      .from('billing_events')
      .select('id')
      .eq('paddle_event_id', eventId)
      .single()

    if (existingEvent) {
      console.log(`Duplicate event ${eventId}, skipping`)
      return NextResponse.json({ received: true, duplicate: true })
    }

    // Store raw event
    await supabase.from('billing_events').insert({
      event_type: eventType,
      paddle_event_id: eventId,
      paddle_subscription_id: data?.subscription_id || data?.id,
      raw: event,
      processed: false,
    })

    // Process based on event type
    switch (eventType) {
      case 'subscription.created':
      case 'subscription.activated':
        await handleSubscriptionCreated(supabase, data)
        break

      case 'subscription.updated':
        await handleSubscriptionUpdated(supabase, data)
        break

      case 'subscription.canceled':
        await handleSubscriptionCanceled(supabase, data)
        break

      case 'subscription.paused':
        await handleSubscriptionPaused(supabase, data)
        break

      case 'subscription.resumed':
        await handleSubscriptionResumed(supabase, data)
        break

      case 'subscription.past_due':
        await handleSubscriptionPastDue(supabase, data)
        break

      case 'transaction.completed':
        await handleTransactionCompleted(supabase, data)
        break

      default:
        console.log(`Unhandled event type: ${eventType}`)
    }

    // Mark event as processed
    await supabase
      .from('billing_events')
      .update({ processed: true })
      .eq('paddle_event_id', eventId)

    return NextResponse.json({ received: true })

  } catch (error: any) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ 
      error: 'Webhook processing failed' 
    }, { status: 500 })
  }
}

// Handler functions for different event types

async function handleSubscriptionCreated(supabase: any, data: any) {
  const customData = data.custom_data || {}
  const userId = customData.user_id
  const planKey = customData.plan_key
  const role = customData.role

  if (!userId) {
    console.error('No user_id in subscription custom_data')
    return
  }

  const priceId = data.items?.[0]?.price?.id
  const plan = priceId ? getPlanByPaddlePriceId(priceId) : null

  // Upsert subscription
  const { error } = await supabase.from('subscriptions').upsert({
    user_id: userId,
    role: role || plan?.role || 'technician',
    plan_id: planKey || plan?.key || 'UNKNOWN',
    paddle_subscription_id: data.id,
    paddle_price_id: priceId,
    status: mapPaddleStatus(data.status),
    current_period_start: data.current_billing_period?.starts_at,
    current_period_end: data.current_billing_period?.ends_at,
    cancel_at_period_end: data.scheduled_change?.action === 'cancel',
  }, {
    onConflict: 'paddle_subscription_id',
  })

  if (error) {
    console.error('Error upserting subscription:', error)
  }

  // Update billing customer with Paddle customer ID
  if (data.customer_id) {
    await supabase
      .from('billing_customers')
      .update({ paddle_customer_id: data.customer_id })
      .eq('user_id', userId)
  }
}

async function handleSubscriptionUpdated(supabase: any, data: any) {
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: mapPaddleStatus(data.status),
      current_period_start: data.current_billing_period?.starts_at,
      current_period_end: data.current_billing_period?.ends_at,
      cancel_at_period_end: data.scheduled_change?.action === 'cancel',
      paddle_price_id: data.items?.[0]?.price?.id,
    })
    .eq('paddle_subscription_id', data.id)

  if (error) {
    console.error('Error updating subscription:', error)
  }
}

async function handleSubscriptionCanceled(supabase: any, data: any) {
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', data.id)

  if (error) {
    console.error('Error canceling subscription:', error)
  }
}

async function handleSubscriptionPaused(supabase: any, data: any) {
  const { error } = await supabase
    .from('subscriptions')
    .update({ status: 'paused' })
    .eq('paddle_subscription_id', data.id)

  if (error) {
    console.error('Error pausing subscription:', error)
  }
}

async function handleSubscriptionResumed(supabase: any, data: any) {
  const { error } = await supabase
    .from('subscriptions')
    .update({ status: 'active' })
    .eq('paddle_subscription_id', data.id)

  if (error) {
    console.error('Error resuming subscription:', error)
  }
}

async function handleSubscriptionPastDue(supabase: any, data: any) {
  const { error } = await supabase
    .from('subscriptions')
    .update({ status: 'past_due' })
    .eq('paddle_subscription_id', data.id)

  if (error) {
    console.error('Error marking subscription past_due:', error)
  }
}

async function handleTransactionCompleted(supabase: any, data: any) {
  // Transaction completed - subscription should already be active via subscription events
  // This is mainly for logging/confirmation
  const subscriptionId = data.subscription_id
  if (subscriptionId) {
    console.log(`Transaction completed for subscription ${subscriptionId}`)
  }
}

// Map Paddle status to our internal status
function mapPaddleStatus(paddleStatus: string): string {
  const statusMap: Record<string, string> = {
    'active': 'active',
    'trialing': 'trialing',
    'past_due': 'past_due',
    'paused': 'paused',
    'canceled': 'canceled',
    'expired': 'expired',
  }
  return statusMap[paddleStatus] || 'pending'
}

