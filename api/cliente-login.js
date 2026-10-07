import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseAdmin = createClient(

  'https://qzsukbfxqdyhpbzlzlwd.supabase.co',

  process.env.SUPABASE_SERVICE_ROLE_KEY

);



export default async function handler(req, res) {

  if (req.method !== 'POST') {

    return res.status(405).json({ error: 'Method not allowed' });

  }

  try {

    const { eventId, password } = req.body;
if (!eventId || !password) {

  return res.status(400).json({ error: 'Faltan datos de acceso' });

}

const { data: event, error: eventError } = await supabaseAdmin

  .from('events')

  .select('id, client_password_hash')

  .eq('id', eventId)

  .single();


    if (eventError || !event) {

  return res.status(404).json({ error: 'Evento no encontrado' });

}

if (!event.client_password_hash) {

  return res.status(403).json({ error: 'Este evento aún no tiene contraseña' });

}

const passwordOk = await bcrypt.compare(

  password,

  event.client_password_hash

);

  if (!passwordOk) {

  return res.status(401).json({ error: 'Contraseña incorrecta' });

}

return res.status(200).json({ success: true });


    

    
    

  } catch (error) {

    console.error('Cliente login error:', error);

    return res.status(500).json({ error: 'Error al validar el acceso' });

  }

}
