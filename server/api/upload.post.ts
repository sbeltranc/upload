import { PutObjectCommand } from "@aws-sdk/client-s3";
import { uploadTable, r2, getPublicUrl, db } from "#imports";

import { eq } from "drizzle-orm";
import { createHash } from "crypto";
import { fileTypeFromBuffer } from "file-type";

const config = useRuntimeConfig();

export default defineEventHandler(async (event) => {
    try {
        const form = await readFormData(event);
        const file = form.get('file') as File | null;

        if (!file) {
            setResponseStatus(event, 400);
            return "No file has been attached to upload";
        }

        const fileBuffer = Buffer.from(await file.arrayBuffer());

        if (fileBuffer.length === 0) {
            setResponseStatus(event, 400);
            return "No file data received";
        }

        if (fileBuffer.length > config.fileSizeLimit) {
            setResponseStatus(event, 413);
            return "File is too large! (max 200MB)";
        }

        const fileType = await fileTypeFromBuffer(fileBuffer);
        const rawExt = file.name?.split('.').pop()?.toLowerCase() || "";
        const detectedExt = fileType?.ext || rawExt;

        const prohibited = Array.isArray(config.prohibitedFileTypes) ? config.prohibitedFileTypes : [];
        if (prohibited.includes(detectedExt)) {
            setResponseStatus(event, 415);
            return `File type .${detectedExt} is not allowed`;
        }

        const hash = createHash("sha1").update(fileBuffer).digest("hex");
        const shortHash = hash.substring(0, 16);
        const key = detectedExt ? `${shortHash}.${detectedExt}` : shortHash;

        const existingUpload = await db.select().from(uploadTable).where(eq(uploadTable.hash, hash)).limit(1);

        if (existingUpload && existingUpload[0]) {
            return getPublicUrl(existingUpload[0].key)
        }
        
        await db.transaction(async (tx) => {
            await r2.send(new PutObjectCommand({
                Bucket: config.r2.bucket,
                Key: key,
                Body: fileBuffer,
                ContentType: fileType?.mime || "application/octet-stream",
                ContentDisposition: 'inline'
            }));
            
            await tx.insert(uploadTable).values({
                key,
                hash,
                ext: detectedExt || "none",
                mime: fileType?.mime || "none",
            });
        });

        return getPublicUrl(key);
    } catch (error: any) {
        console.log(error)
        const statusCode = typeof error.statusCode === 'number' ? error.statusCode : 500;

        setResponseStatus(event, statusCode);
        return error.message || "Upload has failed due to an internal error";
    }
});