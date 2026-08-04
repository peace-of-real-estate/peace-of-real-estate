/**
 * Points a Railway environment's service at a GHCR image and triggers a
 * deploy. Used by .github/workflows/deploy.yml for both production (main)
 * and PR environments.
 *
 * Required env: RAILWAY_API_TOKEN, RAILWAY_PROJECT_ID, RAILWAY_SERVICE_NAME,
 * RAILWAY_ENVIRONMENT (e.g. "production" or "pr-123"), IMAGE (full tag).
 *
 * NOTE: the exact GraphQL field names here are best-effort against Railway's
 * public API and may need adjustment on first real run (the deploy spike).
 */

const API = 'https://backboard.railway.app/graphql/v2'

export {}

const {
	RAILWAY_API_TOKEN,
	RAILWAY_PROJECT_ID,
	RAILWAY_SERVICE_NAME,
	RAILWAY_ENVIRONMENT,
	IMAGE,
} = process.env

for (const key of [
	'RAILWAY_API_TOKEN',
	'RAILWAY_PROJECT_ID',
	'RAILWAY_SERVICE_NAME',
	'RAILWAY_ENVIRONMENT',
	'IMAGE',
]) {
	if (!process.env[key]) {
		console.error(`missing required env var: ${key}`)
		process.exit(1)
	}
}

async function gql<T>(query: string, variables: Record<string, unknown>) {
	const res = await fetch(API, {
		method: 'POST',
		headers: {
			// Workspace tokens use Bearer; project-scoped tokens would need
			// the Project-Access-Token header instead, but those can only
			// see the production environment, so a workspace token is used.
			Authorization: `Bearer ${RAILWAY_API_TOKEN}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ query, variables }),
	})
	const json: { data: T; errors?: { message: string }[] } = await res.json()
	if (json.errors?.length) {
		throw new Error(
			`Railway API error: ${json.errors.map((e) => e.message).join(', ')}`,
		)
	}
	return json.data
}

interface Project {
	project: {
		environments: {
			edges: { node: { id: string; name: string } }[]
			pageInfo: { hasNextPage: boolean; endCursor: string | null }
		}
		services: { edges: { node: { id: string; name: string } }[] }
	}
}

async function getProject() {
	const services: { id: string; name: string }[] = []
	const environments: { id: string; name: string }[] = []
	let cursor: string | null = null
	for (;;) {
		const data: Project = await gql<Project>(
			`query ($id: String!, $after: String) {
				project(id: $id) {
					environments(after: $after, first: 100) {
						edges { node { id name } }
						pageInfo { hasNextPage endCursor }
					}
					services { edges { node { id name } } }
				}
			}`,
			{ id: RAILWAY_PROJECT_ID, after: cursor },
		)
		environments.push(...data.project.environments.edges.map((e) => e.node))
		services.push(...data.project.services.edges.map((e) => e.node))
		if (!data.project.environments.pageInfo.hasNextPage) break
		cursor = data.project.environments.pageInfo.endCursor
	}
	return { services, environments }
}

const { services, environments } = await getProject()
console.log(
	`found ${environments.length} environments: ${environments.map((e) => e.name).join(', ')}`,
)

const service = services.find((s) => s.name === RAILWAY_SERVICE_NAME)
if (!service) {
	throw new Error(
		`service "${RAILWAY_SERVICE_NAME}" not found; have: ${services.map((s) => s.name).join(', ')}`,
	)
}

let environment = environments.find((e) => e.name === RAILWAY_ENVIRONMENT)

if (!environment) {
	console.log(`creating environment "${RAILWAY_ENVIRONMENT}"`)
	const created = await gql<{
		environmentCreate: { id: string; name: string }
	}>(
		`mutation ($input: EnvironmentCreateInput!) {
			environmentCreate(input: $input) { id name }
		}`,
		{
			input: { projectId: RAILWAY_PROJECT_ID, name: RAILWAY_ENVIRONMENT },
		},
	)
	environment = created.environmentCreate
}

console.log(
	`deploying ${IMAGE} to ${service.name}/${environment.name} (${environment.id})`,
)

await gql(
	`mutation ($serviceId: String!, $environmentId: String!, $input: ServiceInstanceUpdateInput!) {
		serviceInstanceUpdate(serviceId: $serviceId, environmentId: $environmentId, input: $input)
	}`,
	{
		serviceId: service.id,
		environmentId: environment.id,
		input: { source: { image: IMAGE } },
	},
)

await gql(
	`mutation ($serviceId: String!, $environmentId: String!) {
		serviceInstanceDeploy(serviceId: $serviceId, environmentId: $environmentId)
	}`,
	{ serviceId: service.id, environmentId: environment.id },
)

console.log('deploy triggered')
