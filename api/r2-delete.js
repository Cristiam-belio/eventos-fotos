import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";



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

const authorization = req.headers.authorization || "";

if (!authorization.startsWith("Bearer ")) {
  return res.status(401).json({
    error: "No autorizado"
  });
}

let session;

try {
  session = jwt.verify(
    authorization.slice(7),
    process.env.CLIENT_SESSION_SECRET,
    { algorithms: ["HS256"] }
  );
} catch (error) {
  return res.status(401).json({
    error: "Sesión inválida o expirada"
  });
}

if (
  session.role !== "client" ||
  session.purpose !== "media-management" ||
  !session.eventId
) {
  return res.status(403).json({
    error: "Acceso denegado"
  });
}
    
        const { key, mediaId } = req.body;

if (!mediaId) {
  return res.status(400).json({
    error: "Falta el identificador del archivo"
  });
}

const { data: media, error: mediaError } = await supabaseAdmin
  .from("media")
  .select("id, event_id, file_path, thumbnail_path")
  .eq("id", mediaId)
  .single();

if (mediaError || !media) {
  return res.status(404).json({
    error: "Archivo no encontrado"
  });
}

if (
  media.event_id !== session.eventId ||
  media.file_path !== key
) {
  return res.status(403).json({
    error: "No tienes permiso para eliminar este archivo"
  });
}
    

if (!key) {

  return res.status(400).json({ error: "Falta la clave del archivo" });

}


    // Eliminar el archivo original de R2
await r2.send(
  new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: media.file_path
  })
);

// Eliminar la miniatura, si existe y es diferente del original
if (
  media.thumbnail_path &&
  media.thumbnail_path !== media.file_path
) {
  await r2.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: media.thumbnail_path
    })
  );
}

// Eliminar el registro de Supabase
const { error: deleteError } = await supabaseAdmin
  .from("media")
  .delete()
  .eq("id", media.id)
  .eq("event_id", session.eventId);

if (deleteError) {
  throw deleteError;
}

    

    return res.status(200).json({ success: true });
    



    
  } catch (error) {

    console.error("R2 delete error:", error);

    return res.status(500).json({ error: "No se pudo eliminar el archivo" });

  }

}
