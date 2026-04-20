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

    const token = authHeader?.replace('Bearer ', '')
    if (!token) throw new Error('Missing token')

    const { data: { user }, error: authError } = await adminClient.auth.getUser(token)
    if (authError || !user) throw new Error('Unauthorized')

    const { loan_id, amount, payment_method } = await req.json()

    const { data: loan, error: loanError } = await adminClient
      .from('loans')
      .select('*')
      .eq('id', loan_id)
      .single()

    if (loanError || !loan) throw new Error('Loan not found')
    if (loan.borrower_id !== user.id) throw new Error('Only the borrower can repay')

    const repayAmount = parseFloat(amount)
    const newRemaining = Number(loan.remaining_amount) - repayAmount
    const newStatus = newRemaining <= 0 ? 'completed' : loan.status

    // Record Repayment
    await adminClient.from('loan_repayments').insert({
      loan_id: loan.id, amount: repayAmount, payment_method, payer_id: user.id
    })

    // Update Loan
    await adminClient.from('loans').update({
      remaining_amount: newRemaining,
      status: newStatus,
      updated_at: new Date().toISOString()
    }).eq('id', loan_id)

    // Update Balances
    const balanceField = payment_method === 'cash' ? 'cash_balance' : 'bank_balance'
    const { data: bProfile } = await adminClient.from('profiles').select(balanceField).eq('user_id', loan.borrower_id).single()
    const { data: lProfile } = await adminClient.from('profiles').select(balanceField).eq('user_id', loan.lender_id).single()
    
    if (bProfile && lProfile) {
       await adminClient.from('profiles').update({ [balanceField]: (Number(bProfile[balanceField]) || 0) - repayAmount }).eq('user_id', loan.borrower_id)
       await adminClient.from('profiles').update({ [balanceField]: (Number(lProfile[balanceField]) || 0) + repayAmount }).eq('user_id', loan.lender_id)
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
