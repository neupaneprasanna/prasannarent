import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkBuckets() {
    console.log('Checking Supabase Buckets...')
    const { data, error } = await supabase.storage.listBuckets()

    if (error) {
        console.error('Error listing buckets:', error.message)
        return
    }

    if (data && data.length > 0) {
        console.log('Available buckets:')
        data.forEach(b => console.log(`- ${b.name} (Public: ${b.public})`))
    } else {
        console.log('No buckets found.')
    }
}

checkBuckets()
