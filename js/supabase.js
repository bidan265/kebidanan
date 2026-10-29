// js/supabase.js

// Menggunakan Supabase CDN untuk Vanilla JS
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://zlcpkffuwsbrfshulqpb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsY3BrZmZ1d3NicmZzaHVscXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxOTAyMjIsImV4cCI6MjEwODc2NjIyMn0.QpZXcYUweCrCmFJksjmQNHdTuLZmL-TacVRw1adlXt4';

export const supabase = createClient(supabaseUrl, supabaseKey);