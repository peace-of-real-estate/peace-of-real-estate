import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { serverEnv as env } from '@/env.server'

function getStorageConfig() {
	if (env.IS_DEVELOPMENT) {
		const {
			AVATAR_BUCKET: bucket,
			AWS_REGION: region,
			AWS_ENDPOINT_URL: endpoint,
			AWS_ACCESS_KEY_ID: accessKeyId,
			AWS_SECRET_ACCESS_KEY: secretAccessKey,
		} = env

		if (!bucket || !region || !endpoint || !accessKeyId || !secretAccessKey) {
			return undefined
		}

		return { bucket, region, endpoint, accessKeyId, secretAccessKey }
	}

	return {
		bucket: env.AVATAR_BUCKET,
		region: env.AWS_REGION,
		endpoint: env.AWS_ENDPOINT_URL,
		accessKeyId: env.AWS_ACCESS_KEY_ID,
		secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
	}
}

const storageConfig = getStorageConfig()
const storageClient = storageConfig
	? new S3Client({
			region: storageConfig.region,
			endpoint: storageConfig.endpoint,
			credentials: {
				accessKeyId: storageConfig.accessKeyId,
				secretAccessKey: storageConfig.secretAccessKey,
			},
			forcePathStyle: true,
		})
	: undefined

export async function getAvatarUrl(
	image: string | null | undefined,
): Promise<string | undefined> {
	if (!image) return undefined

	const isPublicUrl = /^https?:\/\//.test(image)
	if (isPublicUrl) return image
	if (!storageConfig || !storageClient) return undefined

	const command = new GetObjectCommand({
		Bucket: storageConfig.bucket,
		Key: image,
	})

	return getSignedUrl(storageClient, command, { expiresIn: 60 * 60 })
}
