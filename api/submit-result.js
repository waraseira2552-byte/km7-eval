// /api/submit-result.js - Guarda el resultado de una prueba
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function verifyToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    const [vendor_id, timestamp] = decoded.split(':');
    if (!vendor_id || !timestamp) return null;
    // Token válido por 24 horas
    if (Date.now() - parseInt(timestamp) > 24 * 60 * 60 * 1000) return null;
    return vendor_id;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  const vendor_id = verifyToken(token);
  if (!vendor_id) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }

  const { test_id, score, total, area_stats } = req.body || {};
  if (!test_id || score === undefined || !total || !area_stats) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  const { data, error } = await supabase
    .from('test_results')
    .insert({
      vendor_id,
      test_id,
      score,
      total,
      area_stats
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ result: data });
}
