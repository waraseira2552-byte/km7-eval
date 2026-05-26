// /api/results.js - Obtiene resultados
// Vendedores normales: solo los suyos
// Admin: todos
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
    if (Date.now() - parseInt(timestamp) > 24 * 60 * 60 * 1000) return null;
    return vendor_id;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  const vendor_id = verifyToken(token);
  if (!vendor_id) {
    return res.status(401).json({ error: 'Token inválido' });
  }

  const isAdmin = vendor_id === 'admin';

  // Obtener todos los vendedores (sin PINs)
  const { data: vendors, error: vErr } = await supabase
    .from('vendors')
    .select('id, name, initials')
    .neq('id', 'admin');

  if (vErr) return res.status(500).json({ error: vErr.message });

  // Obtener resultados (todos si admin, propios si vendedor)
  let query = supabase
    .from('test_results')
    .select('*')
    .order('completed_at', { ascending: false });

  if (!isAdmin) {
    query = query.eq('vendor_id', vendor_id);
  }

  const { data: results, error: rErr } = await query;
  if (rErr) return res.status(500).json({ error: rErr.message });

  // Para cada vendedor + test, conservar solo el último intento (más reciente)
  const latestByVendorTest = {};
  for (const r of results) {
    const key = `${r.vendor_id}__${r.test_id}`;
    if (!latestByVendorTest[key]) {
      latestByVendorTest[key] = r;
    }
  }
  const latestResults = Object.values(latestByVendorTest);

  return res.status(200).json({
    vendors,
    results: latestResults,
    all_attempts: results, // historial completo para gráficos
    is_admin: isAdmin,
    current_vendor: vendor_id
  });
}
