# Paddle Billing Integration Setup

## Overview
AeroMatch uses Paddle as Merchant of Record for handling subscriptions.

## Prerequisites
1. Paddle account (https://paddle.com)
2. Supabase project with service role key
3. Vercel deployment

## Environment Variables

Add these to your `.env.local` (local) and Vercel project settings (production):

```bash
# Paddle Configuration
PADDLE_API_KEY=your_paddle_api_key
PADDLE_WEBHOOK_SECRET=your_webhook_secret
PADDLE_ENV=sandbox  # or 'production' for live

# Optional: Client-side token (if using Paddle.js inline checkout)
NEXT_PUBLIC_PADDLE_ENV=sandbox

# App URL (for redirect URLs)
NEXT_PUBLIC_APP_URL=https://app.aeromatch.eu

# Supabase Service Role (for webhook processing)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Paddle Dashboard Setup

### 1. Create Products
In Paddle Dashboard, create the following products:

#### Technician Plans
- **Premium Monthly** (€3.99/mo)
- **Premium Yearly** (€38.30/yr)

#### Company Plans
- **Starter** (€49.99/mo)
- **Professional** (€139.99/mo)
- **Enterprise** (€199.99/mo)

### 2. Get Price IDs
After creating products, copy the Price IDs and update `src/lib/billing/plans.ts`:

```typescript
paddlePriceId: {
  sandbox: 'pri_01XXXXXX',  // From sandbox
  production: 'pri_01YYYYYY', // From production
}
```

### 3. Configure Webhooks
In Paddle Dashboard → Developers → Webhooks:

1. Add webhook URL: `https://app.aeromatch.eu/api/billing/webhook`
2. Select events:
   - `subscription.created`
   - `subscription.updated`
   - `subscription.activated`
   - `subscription.canceled`
   - `subscription.paused`
   - `subscription.resumed`
   - `subscription.past_due`
   - `transaction.completed`
3. Copy the webhook secret and add to env vars

## Database Setup

Run the migration in Supabase SQL Editor:
```sql
-- Copy contents from supabase/migrations/006_billing_paddle.sql
```

## Testing (Sandbox)

### Test Cards
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

### Testing Flow
1. Login as technician/company
2. Go to Dashboard → Subscription section
3. Click "Upgrade" / "Mejorar plan"
4. Select a plan
5. Complete checkout with test card
6. Return to success page
7. Verify subscription is active

### Webhook Testing
For local testing, use Paddle's webhook testing tool or ngrok:
```bash
ngrok http 3000
# Update webhook URL in Paddle to ngrok URL
```

## Production Checklist

- [ ] Switch `PADDLE_ENV` to `production`
- [ ] Update all Price IDs in `plans.ts`
- [ ] Verify webhook URL points to production domain
- [ ] Verify webhook secret is correct
- [ ] Test full subscription flow
- [ ] Monitor webhook logs in Paddle Dashboard

## Troubleshooting

### Webhook not receiving events
1. Check Paddle Dashboard → Developers → Webhooks → Logs
2. Verify URL is publicly accessible
3. Check signature verification in logs

### Subscription not activating
1. Check `billing_events` table for received events
2. Verify `user_id` is passed in `custom_data`
3. Check server logs for errors

### Checkout fails
1. Verify Price ID is valid
2. Check Paddle API key is correct
3. Verify user is authenticated

