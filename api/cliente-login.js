export default async function handler(req, res) {

  if (req.method !== 'POST') {

    return res.status(405).json({ error: 'Method not allowed' });

  }

  try {

    return res.status(200).json({ ready: true });

  } catch (error) {

    console.error('Cliente login error:', error);

    return res.status(500).json({ error: 'Error al validar el acceso' });

  }

}
