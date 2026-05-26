// /api/login.js - Verifica vendor_id + PIN
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { vendor_id, pin } = req.body || {};
  if (!vendor_id || !pin) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  const { data, error } = await supabase
    .from('vendors')
    .select('id, name, initials, pin')
    .eq('id', vendor_id)
    .single();

  if (error || !data) {
    return res.status(401).json({ error: 'Vendedor no encontrado' });
  }

  if (String(data.pin) !== String(pin)) {
    return res.status(401).json({ error: 'PIN incorrecto' });
  }

  // Genera un token simple (en producción usaríamos JWT, pero esto funciona)
  const token = Buffer.from(`${data.id}:${Date.now()}`).toString('base64');

  return res.status(200).json({
    token,
    vendor: { id: data.id, name: data.name, initials: data.initials },
    is_admin: data.id === 'admin'
  });
}
