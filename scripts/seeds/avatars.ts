import { createHash } from 'node:crypto'
import {
	CreateBucketCommand,
	GetObjectCommand,
	ListObjectsV2Command,
	PutObjectCommand,
	S3Client,
} from '@aws-sdk/client-s3'
import { z } from 'zod'
import { serverEnv as env } from '../../src/env.server'

// =============================================================================
// Pool layout
// =============================================================================

/**
 * Avatars live in a persistent pool inside the bucket and are never deleted
 * by the seed. New fetches go under POOL_PREFIX; objects uploaded by older
 * seeds under LEGACY_PREFIX are reused as-is. The manifest records every
 * source URL already attempted so each URL is fetched at most once, ever.
 */
const POOL_PREFIX = 'pool/avatars/'
const LEGACY_PREFIX = 'seed/avatars/'
const MANIFEST_KEY = 'pool/avatar-manifest.json'

const FETCH_CONCURRENCY = 3
const FETCH_DELAY_MS = 150
const MANIFEST_SAVE_EVERY = 25

// =============================================================================
// Photo sources
// =============================================================================

const UNSPLASH_HEADSHOTS = [
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

function buildCandidateUrls(): string[] {
	const urls: string[] = []
	for (let i = 0; i <= 99; i++) {
		urls.push(`https://randomuser.me/api/portraits/men/${i}.jpg`)
	}
	for (let i = 0; i <= 99; i++) {
		urls.push(`https://randomuser.me/api/portraits/women/${i}.jpg`)
	}
	for (let i = 1; i <= 70; i++) {
		urls.push(`https://i.pravatar.cc/400?img=${i}`)
	}
	for (let i = 1; i <= 89; i++) {
		urls.push(`https://xsgames.co/randomusers/assets/avatars/male/${i}.jpg`)
	}
	for (let i = 1; i <= 89; i++) {
		urls.push(`https://xsgames.co/randomusers/assets/avatars/female/${i}.jpg`)
	}
	urls.push(...UNSPLASH_HEADSHOTS)
	for (let i = 1; i <= 70; i++) {
		urls.push(`https://loremflickr.com/400/400/portrait?lock=${i}`)
	}
	return urls
}

// =============================================================================
// S3 setup
// =============================================================================

let s3Client: S3Client | null = null
let bucketEnsured: Promise<void> | null = null

// =============================================================================
// S3 helpers
// =============================================================================

async function ensureBucket(client: S3Client): Promise<void> {
	try {
		await client.send(new CreateBucketCommand({ Bucket: env.AVATAR_BUCKET }))
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
	return Boolean(
		env.AVATAR_BUCKET &&
		env.AWS_REGION &&
		env.AWS_ENDPOINT_URL &&
		env.AWS_ACCESS_KEY_ID &&
		env.AWS_SECRET_ACCESS_KEY,
	)
}

function getStorageClient(): S3Client {
	if (!s3Client) {
		s3Client = new S3Client({
			region: env.AWS_REGION,
			endpoint: env.AWS_ENDPOINT_URL,
			credentials: {
				accessKeyId: env.AWS_ACCESS_KEY_ID,
				secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
			},
			forcePathStyle: true,
		})
	}
	return s3Client
}

// =============================================================================
// Helpers
// =============================================================================

async function fetchWithRetry(
	url: string,
	maxAttempts = 4,
): Promise<Buffer | null> {
	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			const response = await fetch(url, {
				headers: {
					connection: 'close',
					'user-agent':
						'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
				},
				signal: AbortSignal.timeout(30_000),
			})
			if (response.status === 404) return null
			if (!response.ok) {
				if (attempt < maxAttempts) {
					await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
					continue
				}
				console.warn(`Failed to fetch avatar: ${url} (${response.status})`)
				return null
			}
			const arrayBuffer = await response.arrayBuffer()
			const buffer = Buffer.from(arrayBuffer)
			if (!isJpeg(buffer)) {
				console.warn(`Skipping non-JPEG avatar response: ${url}`)
				return null
			}
			return buffer
		} catch (error) {
			if (attempt < maxAttempts) {
				await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
				continue
			}
			console.warn(`Error fetching avatar: ${url}`, error)
			return null
		}
	}
	return null
}

function isJpeg(buffer: Buffer): boolean {
	return (
		buffer.length > 2 &&
		buffer[0] === 0xff &&
		buffer[1] === 0xd8 &&
		buffer[2] === 0xff
	)
}

// =============================================================================
// Pool storage
// =============================================================================

type AvatarPoolManifest = {
	attemptedUrls: string[]
	updatedAt: string
}

const avatarPoolManifestSchema = z.object({
	attemptedUrls: z.array(z.string()),
	updatedAt: z.string(),
})

async function listPoolKeys(client: S3Client): Promise<string[]> {
	const keys: string[] = []

	for (const prefix of [POOL_PREFIX, LEGACY_PREFIX]) {
		let continuationToken: string | undefined
		do {
			const listed = await client.send(
				new ListObjectsV2Command({
					Bucket: env.AVATAR_BUCKET,
					Prefix: prefix,
					ContinuationToken: continuationToken,
				}),
			)
			for (const object of listed.Contents ?? []) {
				if (object.Key && object.Key !== MANIFEST_KEY) {
					keys.push(object.Key)
				}
			}
			continuationToken = listed.IsTruncated
				? listed.NextContinuationToken
				: undefined
		} while (continuationToken)
	}

	return keys
}

async function loadManifest(client: S3Client): Promise<AvatarPoolManifest> {
	try {
		const response = await client.send(
			new GetObjectCommand({ Bucket: env.AVATAR_BUCKET, Key: MANIFEST_KEY }),
		)
		const body = await response.Body?.transformToString()
		if (!body) throw new Error('Avatar manifest body is empty')
		const parsed = avatarPoolManifestSchema.safeParse(JSON.parse(body))
		if (!parsed.success) {
			throw new Error('Avatar manifest has an unexpected shape')
		}
		return parsed.data
	} catch (error) {
		if (error instanceof Error && error.name === 'NoSuchKey') {
			return { attemptedUrls: [], updatedAt: new Date().toISOString() }
		}
		throw error
	}
}

async function saveManifest(
	client: S3Client,
	manifest: AvatarPoolManifest,
): Promise<void> {
	manifest.updatedAt = new Date().toISOString()
	await client.send(
		new PutObjectCommand({
			Bucket: env.AVATAR_BUCKET,
			Key: MANIFEST_KEY,
			Body: JSON.stringify(manifest),
			ContentType: 'application/json',
		}),
	)
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Returns the keys of the persistent avatar pool, topping it up from the
 * candidate sources until it reaches `targetSize` (or the sources run out).
 * Pool objects are never deleted, and every source URL is fetched at most
 * once across all runs, so reseeds do zero network fetching once the pool
 * is populated.
 */
export async function ensureAvatarPool(targetSize: number): Promise<string[]> {
	if (!canUseS3Storage()) return []

	const client = getStorageClient()
	bucketEnsured ??= ensureBucket(client)
	await bucketEnsured

	const poolKeys = new Set(await listPoolKeys(client))
	console.log(`Avatar pool holds ${poolKeys.size} photos`)

	if (poolKeys.size >= targetSize) {
		return [...poolKeys]
	}

	const manifest = await loadManifest(client)
	const attempted = new Set(manifest.attemptedUrls)
	const remaining = buildCandidateUrls().filter((url) => !attempted.has(url))

	if (remaining.length === 0) {
		console.log(
			`Avatar pool exhausted all sources (${poolKeys.size} photos available)`,
		)
		return [...poolKeys]
	}

	console.log(
		`Fetching up to ${targetSize - poolKeys.size} new photos ` +
			`(${remaining.length} sources left to try)...`,
	)

	let saveChain: Promise<void> = Promise.resolve()
	const queueManifestSave = (): Promise<void> => {
		const snapshot: AvatarPoolManifest = {
			...manifest,
			attemptedUrls: [...manifest.attemptedUrls],
		}
		saveChain = saveChain.then(() => saveManifest(client, snapshot))
		return saveChain
	}

	let cursor = 0
	const workers = Array.from({ length: FETCH_CONCURRENCY }, async () => {
		while (cursor < remaining.length && poolKeys.size < targetSize) {
			const sourceUrl = remaining[cursor++]!
			const buffer = await fetchWithRetry(sourceUrl)

			if (buffer) {
				const hash = createHash('md5').update(buffer).digest('hex')
				const key = `${POOL_PREFIX}${hash}.jpg`
				if (!poolKeys.has(key)) {
					await client.send(
						new PutObjectCommand({
							Bucket: env.AVATAR_BUCKET,
							Key: key,
							Body: buffer,
							ContentType: 'image/jpeg',
						}),
					)
					poolKeys.add(key)
					if (poolKeys.size % 50 === 0) {
						console.log(`  ${poolKeys.size} photos in pool`)
					}
				}
			}

			manifest.attemptedUrls.push(sourceUrl)
			if (manifest.attemptedUrls.length % MANIFEST_SAVE_EVERY === 0) {
				await queueManifestSave()
			}
			await new Promise((resolve) => setTimeout(resolve, FETCH_DELAY_MS))
		}
	})
	await Promise.all(workers)
	await saveChain
	await saveManifest(client, manifest)

	console.log(`Avatar pool ready with ${poolKeys.size} photos`)
	return [...poolKeys]
}

/** Direct source URLs, used only when S3 storage is not configured. */
export function getAvatarFallbackUrls(): string[] {
	return buildCandidateUrls()
}
