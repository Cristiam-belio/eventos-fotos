import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";



const r2 = new S3Client({

  region: "auto",

  endpoint: process.env.R2_ENDPOINT,

  credentials: {

    accessKeyId: process.env.R2_ACCESS_KEY_ID,

    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,

  },

});

const supabaseAdmin = createClient(

  "https://qzsukbfxqdyhpbzlzlwd.supabase.co",

  process.env.SUPABASE_SERVICE_ROLE_KEY

);

export default async function handler(req, res) {

  if (req.method !== "POST") {

    return res.status(405).json({ error: "Method not allowed" });

  }

  try {

        const { key, mediaId } = req.body;

if (!key) {

  return res.status(400).json({ error: "Falta la clave del archivo" });

}


    const command = new DeleteObjectCommand({

      Bucket: process.env.R2_BUCKET_NAME,

      Key: key,

    });

    await r2.send(command);

    if (mediaId) {

  const { error: deleteError } = await supabaseAdmin

    .from("media")

    .delete()

    .eq("id", mediaId);

  if (deleteError) {

    throw deleteError;

  }

}

    

    return res.status(200).json({ success: true });
    



    
  } catch (error) {

    console.error("R2 delete error:", error);

    return res.status(500).json({ error: "No se pudo eliminar el archivo" });

  }

}
