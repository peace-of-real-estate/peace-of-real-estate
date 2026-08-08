import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

import { serverEnv as env } from '@/env.server'

const storageClient = new S3Client({
	region: env.AWS_REGION,
	endpoint: env.AWS_ENDPOINT_URL,
	credentials: {
		accessKeyId: env.AWS_ACCESS_KEY_ID,
		secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
	},
	forcePathStyle: true,
})

export async function getAvatarUrl(
	image: string | null | undefined,
): Promise<string | undefined> {
	if (!image) return undefined

	const isPublicUrl = /^https?:\/\//.test(image)
	if (isPublicUrl) return image

	const command = new GetObjectCommand({
		Bucket: env.AWS_S3_BUCKET_NAME,
		Key: image,
	})

	return getSignedUrl(storageClient, command, { expiresIn: 60 * 60 })
}
