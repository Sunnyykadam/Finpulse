import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization')
    
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Using adminClient to verify user directly via the token
    const token = authHeader?.replace('Bearer ', '')
    if (!token) throw new Error('Missing token in request')

    const { data: { user }, error: authError } = await adminClient.auth.getUser(token)
    if (authError || !user) throw new Error(`Auth Error: Token invalid - ${authError?.message || 'No user'}`)

    const { loan_id } = await req.json()

    // Fetch loan
    const { data: loan, error: loanError } = await adminClient
      .from('loans')
      .select('*')
      .eq('id', loan_id)
      .single()

    if (loanError || !loan) throw new Error('Loan not found')
    
    // THE UNAUTHORIZED CHECK
    if (loan.recipient_id !== user.id) {
       throw new Error(`Unauthorized! You are ${user.email}, but the recipient is ${loan.recipient_id}. Only the recipient can accept.`)
    }

    if (loan.status !== 'pending') throw new Error('Loan is already active or rejected')

    // Update statuses...
    const borrower_id = loan.loan_type === 'borrow' ? loan.requester_id : loan.recipient_id
    const lender_id = loan.loan_type === 'borrow' ? loan.recipient_id : loan.requester_id

    const { error: updateError } = await adminClient
      .from('loans')
      .update({ status: 'active', borrower_id, lender_id, updated_at: new Date().toISOString() })
      .eq('id', loan_id)

    if (updateError) throw updateError

    // Balances...
    const balanceField = loan.payment_method === 'cash' ? 'cash_balance' : 'bank_balance'
    const { data: bProfile } = await adminClient.from('profiles').select(balanceField).eq('user_id', borrower_id).single()
    const { data: lProfile } = await adminClient.from('profiles').select(balanceField).eq('user_id', lender_id).single()
    
    if (bProfile && lProfile) {
       await adminClient.from('profiles').update({ [balanceField]: (Number(bProfile[balanceField]) || 0) + Number(loan.amount) }).eq('user_id', borrower_id)
       await adminClient.from('profiles').update({ [balanceField]: (Number(lProfile[balanceField]) || 0) - Number(loan.amount) }).eq('user_id', lender_id)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })
  }
})
