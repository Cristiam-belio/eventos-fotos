import { createClient } from '@supabase/supabase-js';

import bcrypt from 'bcryptjs';
const ADMIN_USER_ID = process.env.ADMIN_USER_ID;



const supabaseAdmin = createClient(

  'https://qzsukbfxqdyhpbzlzlwd.supabase.co',

  process.env.SUPABASE_SERVICE_ROLE_KEY

);

export default async function handler(req, res) {

  if (req.method !== 'POST') {

    return res.status(405).json({ error: 'Method not allowed' });

  }

  try {

  // Verificar que exista un administrador configurado

  if (!ADMIN_USER_ID) {

    return res.status(500).json({

      error: 'Administrador no configurado'

    });

  }

  // Obtener el token de autenticación

  const authHeader = req.headers.authorization || '';

  const token = authHeader.startsWith('Bearer ')

    ? authHeader.slice(7)

    : null;

  if (!token) {

    return res.status(401).json({

      error: 'Sesión de administrador requerida'

    });

  }

  // Validar el token con Supabase

  const { data: { user }, error: authError } =

    await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {

    return res.status(401).json({

      error: 'Sesión inválida o vencida'

    });

  }

  // Comprobar que sea el administrador autorizado

  if (user.id !== ADMIN_USER_ID) {

    return res.status(403).json({

      error: 'No tienes permisos de administrador'

    });

  }

  // Continuar con el cambio de contraseña

  const { eventId, password } = req.body || {};

if (!eventId || !password) {

  return res.status(400).json({ error: 'Faltan datos' });

}

    const passwordHash = await bcrypt.hash(password, 12);

const { data: updatedRows, error: updateError } = await supabaseAdmin

  .from('events')

  .update({ client_password_hash: passwordHash })



.eq('id', eventId)

.select('id');
  
    
   if (updateError) {

  throw updateError;

}

if (!updatedRows || updatedRows.length === 0) {

  throw new Error('No se actualizó ningún evento');

}


    
    return res.status(200).json({ success: true });
    
    

  } catch (error) {

    console.error('Cliente password error:', error);

    return res.status(500).json({ error: 'No se pudo guardar la contraseña' });

  }

}
