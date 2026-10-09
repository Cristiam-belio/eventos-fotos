import { createClient } from '@supabase/supabase-js';

import bcrypt from 'bcryptjs';

import jwt from 'jsonwebtoken';

const supabaseAdmin = createClient(

  'https://qzsukbfxqdyhpbzlzlwd.supabase.co',

  process.env.SUPABASE_SERVICE_ROLE_KEY

);

export default async function handler(req, res) {

  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {

    return res.status(405).json({

      error: 'Method not allowed'

    });

  }

  try {

    const { eventId, password } = req.body || {};

    if (

      typeof eventId !== 'string' ||

      typeof password !== 'string' ||

      !eventId ||

      !password

    ) {

      return res.status(400).json({

        error: 'Faltan datos de acceso'

      });

    }

    if (!process.env.CLIENT_SESSION_SECRET) {

      throw new Error('Falta CLIENT_SESSION_SECRET');

    }

    const { data: event, error: eventError } =

      await supabaseAdmin

        .from('events')

        .select('id, client_password_hash')

        .eq('id', eventId)

        .single();

    if (eventError || !event || !event.client_password_hash) {

      return res.status(401).json({

        error: 'Credenciales incorrectas'

      });

    }

    const passwordOk = await bcrypt.compare(

      password,

      event.client_password_hash

    );

    if (!passwordOk) {

      return res.status(401).json({

        error: 'Credenciales incorrectas'

      });

    }

    const token = jwt.sign(

      {

        eventId: event.id,

        role: 'client',

        purpose: 'media-management'

      },

      process.env.CLIENT_SESSION_SECRET,

      {

        expiresIn: '2h',

        algorithm: 'HS256'

      }

    );

    return res.status(200).json({

      success: true,

      token,

      expiresIn: 7200

    });

  } catch (error) {

    console.error('Cliente login error:', error);

    return res.status(500).json({

      error: 'Error al validar el acceso'

    });

  }

}
