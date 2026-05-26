// /api/vendors.js - Lista de vendedores (sin PINs)
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { data, error } = await supabase
    .from('vendors')
    .select('id, name, initials')
    .neq('id', 'admin') // No exponer el admin
    .order('name');

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ vendors: data });
}
