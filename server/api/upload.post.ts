import { PutObjectCommand } from "@aws-sdk/client-s3";
import { uploadTable, r2, getPublicUrl, db, H3Event } from "#imports";

import { eq } from "drizzle-orm";
import { createHash } from "crypto";
import { fileTypeFromBuffer } from "file-type";

const config = useRuntimeConfig();

async function parseMultipartData(
	event: H3Event,
	contentType: string
): Promise<Array<{ name: string; data: Buffer; filename?: string }>> {
	try {
		const rawBody = await readRawBody(event);
		if (!rawBody) {
			throw new Error("No body received");
		}

		const bodyBuffer = typeof rawBody === 'string' 
			? Buffer.from(rawBody, 'utf-8')
			: rawBody;

		const [, boundary] = contentType.split("boundary=");
		if (!boundary) {
			throw createError({
				statusCode: 400,
				message: "Invalid multipart boundary"
			});
		}

		return parseMultipartManually(bodyBuffer, boundary);
	} catch (error) {
		console.log(error)
		throw createError({
			statusCode: 400,
			message: "Failed to parse multipart form data"
		});
	}
}

function parseMultipartManually(
	body: Buffer,
	boundary: string
): Array<{ name: string; data: Buffer; filename?: string }> {
	const parts: Array<{ name: string; data: Buffer; filename?: string }> = [];
	const boundaryBuffer = Buffer.from(`--${boundary}`);
	const endBoundary = Buffer.from(`--${boundary}--`);

	let pos = 0;
	while (pos < body.length) {
		const boundaryIndex = body.indexOf(boundaryBuffer, pos);
		if (boundaryIndex === -1) {
			break;
		}

		if (body.slice(boundaryIndex, boundaryIndex + endBoundary.length).equals(endBoundary)) {
			break;
		}

		pos = boundaryIndex + boundaryBuffer.length;
		if (body[pos] === 0x0d && body[pos + 1] === 0x0a) {
			pos += 2;
		}

		const headersEnd = body.indexOf(Buffer.from("\r\n\r\n"), pos);
		if (headersEnd === -1) {
			break;
		}

		const headersStr = body.subarray(pos, headersEnd).toString("utf-8");
		const nameMatch = headersStr.match(/name="([^"]+)"/);
		const filenameMatch = headersStr.match(/filename="([^"]+)"/);

		if (!nameMatch?.[1]) {
			pos = headersEnd + 4;
			continue;
		}

		const dataStart = headersEnd + 4;
		const nextBoundary = body.indexOf(Buffer.from(`\r\n--${boundary}`), dataStart);
		const dataEnd = nextBoundary === -1 ? body.length : nextBoundary;

		const data = body.slice(dataStart, dataEnd);

		parts.push({
			name: nameMatch[1],
			data,
			filename: filenameMatch ? filenameMatch[1] : undefined
		});

		pos = dataEnd;
	}

	return parts;
}

export default defineEventHandler(async (event) => {
    try {
        let formData;
        try {
            const contentType = getHeader(event, 'content-type') || '';
            formData = await parseMultipartData(event, contentType);
        } catch (parseError: any) {
                console.error("Multipart parse error:", parseError.message);
            setResponseStatus(event, 400);
            return "Invalid multipart form data";
        }

        if (!formData || formData.length === 0) {
            setResponseStatus(event, 400);
            return "No file has been attached to upload";
        }

        const file = formData.find(item => item.name === 'file' || item.filename);

        if (!file || !file.data) {
            setResponseStatus(event, 400);
            return "No form data received";
        }

        if (file.data.length > config.fileSizeLimit) {
            setResponseStatus(event, 413);
            return "File is too large! (max 200MB)";
        }

        const fileType = await fileTypeFromBuffer(file.data);
        const rawExt = file.filename?.split('.').pop()?.toLowerCase() || "";
        const detectedExt = fileType?.ext || rawExt;

        const prohibited = Array.isArray(config.prohibitedFileTypes) ? config.prohibitedFileTypes : [];
        if (prohibited.includes(detectedExt)) {
            setResponseStatus(event, 415);
            return `File type .${detectedExt} is not allowed`;
        }

        const hash = createHash("sha1").update(file.data).digest("hex");
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
                Body: file.data,
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