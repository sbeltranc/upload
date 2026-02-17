import { S3Client } from "@aws-sdk/client-s3";

const config = useRuntimeConfig();

export const r2 = new S3Client({
    region: "auto",
    credentials: {
        accessKeyId: config.r2.accessKeyId,
        secretAccessKey: config.r2.secretAccessKey,
    },
    endpoint: `https://${config.r2.accountId}.r2.cloudflarestorage.com`,
});

export const getPublicUrl = (key: string) =>
    `https://${config.r2.publicDomain}/${key}`;