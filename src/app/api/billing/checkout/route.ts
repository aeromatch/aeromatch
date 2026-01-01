import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getPlanByKey, getPaddlePriceId } from '@/lib/billing/plans'

// Paddle API base URL
const PADDLE_API_URL = process.env.PADDLE_ENV === 'production'
  ? 'https://api.paddle.com'
  : 'https://sandbox-api.paddle.com'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get request body
    const { planKey } = await request.json()
    if (!planKey) {
      return NextResponse.json({ error: 'Plan key is required' }, { status: 400 })
    }

    // Get user's profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, email')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Validate plan exists and matches user's role
    const plan = getPlanByKey(planKey)
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    if (plan.role !== profile.role) {
      return NextResponse.json({ 
        error: 'Plan not available for your account type' 
      }, { status: 403 })
    }

    // Get Paddle price ID
    const priceId = getPaddlePriceId(planKey)
    if (!priceId || priceId.includes('XXXX')) {
      return NextResponse.json({ 
        error: 'Payment system not configured. Please contact support.' 
      }, { status: 500 })
    }

    // Ensure billing_customers record exists
    const { error: customerError } = await supabase
      .from('billing_customers')
      .upsert({
        user_id: user.id,
        email: user.email || profile.email,
        role: profile.role,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })

    if (customerError) {
      console.error('Error creating billing customer:', customerError)
      // Continue anyway, webhook will handle it
    }

    // Create Paddle checkout session (using hosted checkout, no custom URLs for sandbox)
    const paddleResponse = await fetch(`${PADDLE_API_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PADDLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{
          price_id: priceId,
          quantity: 1,
        }],
        custom_data: {
          user_id: user.id,
          plan_key: planKey,
          role: profile.role,
        },
      }),
    })

    if (!paddleResponse.ok) {
      const errorData = await paddleResponse.json().catch(() => ({}))
      console.error('Paddle API error:', errorData)
      return NextResponse.json({ 
        error: 'Failed to create checkout session' 
      }, { status: 500 })
    }

    const paddleData = await paddleResponse.json()
    console.log('Paddle response:', JSON.stringify(paddleData, null, 2))
    
    const transactionId = paddleData.data?.id
    
    if (!transactionId) {
      return NextResponse.json({ 
        error: 'Failed to create transaction' 
      }, { status: 500 })
    }

    // Use the checkout URL from Paddle response if available
    // Otherwise build the sandbox checkout URL
    let checkoutUrl = paddleData.data?.checkout?.url
    
    if (!checkoutUrl) {
      const paddleCheckoutBase = process.env.PADDLE_ENV === 'production'
        ? 'https://buy.paddle.com'
        : 'https://sandbox-buy.paddle.com'
      checkoutUrl = `${paddleCheckoutBase}?_ptxn=${transactionId}`
    }
    
    console.log('Checkout URL:', checkoutUrl)

    return NextResponse.json({ 
      checkoutUrl,
      transactionId,
    })

  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}

