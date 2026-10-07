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

  return res.status(400).json({ error: 'Faltan datos' });

}

    const passwordHash = await bcrypt.hash(password, 12);

const { error: updateError } = await supabaseAdmin

  .from('events')

  .update({ client_password_hash: passwordHash })

  .eq('id', eventId);

   if (updateError) {

  throw updateError;

}

    return res.status(200).json({ success: true });
    
    

  } catch (error) {

    console.error('Cliente password error:', error);

    return res.status(500).json({ error: 'No se pudo guardar la contraseña' });

  }

}
