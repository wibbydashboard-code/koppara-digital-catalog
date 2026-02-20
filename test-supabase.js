
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sdxngqnqlwbqdpqcltim.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkeG5ncW5xbHdicWRwcWNsdGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0Njk2MjgsImV4cCI6MjA4NjA0NTYyOH0.FJWpkWTBP6cxkrnUuZRyvkbyakIQNBsrMo24a1lrax0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
    console.log('Testing connection to:', supabaseUrl)
    const { data, error } = await supabase.from('productos').select('count', { count: 'exact' })
    if (error) {
        console.error('Connection Failed:', error)
    } else {
        console.log('Connection Successful! Product count:', data)
    }
}

test()
