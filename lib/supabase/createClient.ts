import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const createSupabaseClient = async () => {
	const { getToken } = await auth()
	const token = await getToken({ template: 'supabase' })

	return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
		global: {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
	})
}
