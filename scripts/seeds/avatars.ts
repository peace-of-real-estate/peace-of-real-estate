import {
	CreateBucketCommand,
	PutObjectCommand,
	S3Client,
} from '@aws-sdk/client-s3'
import { serverEnv as env } from '../../src/env.server'

// =============================================================================
// Headshot pool
// =============================================================================

const HEADSHOT_URLS = [
	'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
	'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face',
	'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
	'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
	'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
	'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
	'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face',
	'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face',
	'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop&crop=face',
	'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop&crop=face',
	'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop&crop=face',
	'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=400&fit=crop&crop=face',
	'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400&h=400&fit=crop&crop=face',
	'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face',
	'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop&crop=face',
	'https://images.unsplash.com/photo-1628157588553-5eeea00af15c?w=400&h=400&fit=crop&crop=face',
	'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=400&fit=crop&crop=face',
	'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop&crop=face',
	'https://images.unsplash.com/photo-1520975661595-6453be3f7070?w=400&h=400&fit=crop&crop=face',
	'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&h=400&fit=crop&crop=face',
] as const

// =============================================================================
// S3 setup
// =============================================================================

let s3Client: S3Client | null = null
let bucketEnsured: Promise<void> | null = null

const {
	AVATAR_BUCKET: bucket,
	AWS_REGION: region,
	AWS_ENDPOINT_URL: endpoint,
	AWS_ACCESS_KEY_ID: accessKeyId,
	AWS_SECRET_ACCESS_KEY: secretAccessKey,
} = env

const storageConfig =
	bucket && region && endpoint && accessKeyId && secretAccessKey
		? { bucket, region, endpoint, accessKeyId, secretAccessKey }
		: undefined

// =============================================================================
// S3 helpers
// =============================================================================

async function ensureBucket(
	client: S3Client,
	bucketName: string,
): Promise<void> {
	try {
		await client.send(new CreateBucketCommand({ Bucket: bucketName }))
	} catch (error) {
		if (
			error instanceof Error &&
			(error.name === 'BucketAlreadyExists' ||
				error.name === 'BucketAlreadyOwnedByYou')
		) {
			return
		}
		throw error
	}
}

function canUseS3Storage(): boolean {
	return storageConfig !== undefined
}

function getStorageClient(): S3Client {
	if (!storageConfig) throw new Error('S3 storage is not configured')
	if (!s3Client) {
		s3Client = new S3Client({
			region: storageConfig.region,
			endpoint: storageConfig.endpoint,
			credentials: {
				accessKeyId: storageConfig.accessKeyId,
				secretAccessKey: storageConfig.secretAccessKey,
			},
			forcePathStyle: true,
		})
	}
	return s3Client
}

// =============================================================================
// Helpers
// =============================================================================

function hashStringToIndex(input: string, max: number): number {
	let hash = 0
	for (let i = 0; i < input.length; i++) {
		hash = (hash << 5) - hash + input.charCodeAt(i)
		hash |= 0
	}
	return Math.abs(hash) % max
}

async function fetchHeadshot(url: string): Promise<Buffer | null> {
	try {
		const response = await fetch(url)
		if (!response.ok) {
			console.warn(`Failed to fetch avatar: ${url} (${response.status})`)
			return null
		}
		const arrayBuffer = await response.arrayBuffer()
		return Buffer.from(arrayBuffer)
	} catch (error) {
		console.warn(`Error fetching avatar: ${url}`, error)
		return null
	}
}

// =============================================================================
// Public API
// =============================================================================

export async function uploadAgentAvatar(
	agentId: string,
	email: string,
): Promise<string | null> {
	if (!canUseS3Storage() || !storageConfig) return null

	const client = getStorageClient()
	bucketEnsured ??= ensureBucket(client, storageConfig.bucket)
	await bucketEnsured

	const headshotUrl =
		HEADSHOT_URLS[hashStringToIndex(email, HEADSHOT_URLS.length)]!
	const imageBuffer = await fetchHeadshot(headshotUrl)
	if (!imageBuffer) return null

	const key = `seed/avatars/${agentId}.jpg`
	await client.send(
		new PutObjectCommand({
			Bucket: storageConfig.bucket,
			Key: key,
			Body: imageBuffer,
			ContentType: 'image/jpeg',
		}),
	)

	return key
}
