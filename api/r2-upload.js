import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2 = new S3Client({

  region: "auto",

  endpoint: process.env.R2_ENDPOINT,

  credentials: {

    accessKeyId: process.env.R2_ACCESS_KEY_ID,

    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,

  },

});

export default async function handler(req, res) {

  if (req.method !== "POST") {

    return res.status(405).json({ error: "Method not allowed" });

  }

  try {

const { key: requestedKey } = req.body;

if (requestedKey) {

  const command = new GetObjectCommand({

    Bucket: process.env.R2_BUCKET_NAME,

Key: requestedKey,

  });

  const viewUrl = await getSignedUrl(r2, command, {

    expiresIn: 3600,

  });

  return res.status(200).json({

    viewUrl,

  });

}




    
    const { fileName, contentType } = req.body;

    if (!fileName || !contentType) {

      return res.status(400).json({ error: "Faltan datos del archivo" });

    }

    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");

    const key = `uploads/${Date.now()}-${safeName}`;

    const command = new PutObjectCommand({

      Bucket: process.env.R2_BUCKET_NAME,

      Key: key,

      ContentType: contentType,

    });

    const uploadUrl = await getSignedUrl(r2, command, {

      expiresIn: 300,

    });

    return res.status(200).json({

      uploadUrl,

      key,

    });

  } catch (error) {

    console.error("R2 upload error:", error);

    return res.status(500).json({

      error: "No se pudo generar la URL de carga",

    });

  }

}
