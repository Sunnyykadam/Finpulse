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

    const { loan_id } = await req.json()

    // Fetch loan
    const { data: loan, error: loanError } = await adminClient
      .from('loans')
      .select('*')
      .eq('id', loan_id)
      .single()

    if (loanError || !loan) throw new Error('Loan not found')
    if (loan.recipient_id !== user.id) throw new Error('Unauthorized')

    await adminClient
      .from('loans')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', loan_id)

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
