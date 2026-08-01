/**
 * Question/field type system and the `defineEnum` factory used to build the
 * option sets that back profile fields and quiz questions.
 *
 * This module must stay dependency-free (no React, zod, or drizzle) because it
 * is imported by the profile field definitions that the DB schema consumes.
 */

type EnumEntry = readonly [slug: string, label: string]

type SlugsOf<TEntries extends readonly EnumEntry[]> = {
	[I in keyof TEntries]: TEntries[I][0]
}

export type EnumDef<TSlug extends string = string> = {
	readonly dbName: string
	readonly slugs: readonly [TSlug, ...TSlug[]]
	readonly labels: Readonly<Record<TSlug, string>>
}

export type SlugOf<TDef extends { slugs: readonly string[] }> =
	TDef['slugs'][number]

export function defineEnum<
	const TEntries extends readonly [EnumEntry, ...EnumEntry[]],
>(
	dbName: string,
	entries: TEntries,
): {
	readonly dbName: string
	readonly slugs: SlugsOf<TEntries>
	readonly labels: Readonly<Record<TEntries[number][0], string>>
} {
	return {
		dbName,
		// map/fromEntries erase tuple/key types; the return annotation restores
		// exactly what the entries literal guarantees.
		// oxlint-disable-next-line typescript/consistent-type-assertions
		slugs: entries.map(([slug]) => slug) as SlugsOf<TEntries>,
		// oxlint-disable-next-line typescript/consistent-type-assertions
		labels: Object.fromEntries(entries) as Record<TEntries[number][0], string>,
	}
}

export function parseSlug<TSlug extends string>(
	def: { slugs: readonly TSlug[] },
	value: string,
): TSlug | null {
	return def.slugs.find((slug) => slug === value) ?? null
}

/** Per-option UI affordances. Domain data (slugs, labels) lives on the EnumDef. */
export type OptionMeta = {
	level?: 1 | 2 | 3
	description?: string
}

type BaseQuestion<TKey extends string, TSlug extends string> = {
	id: TKey
	title: string
	label: string
	options: EnumDef<TSlug>
	optionMeta?: Partial<Record<TSlug, OptionMeta>>
}

export type SingleQuestion<
	TKey extends string,
	TSlug extends string,
> = BaseQuestion<TKey, TSlug> & { kind: 'single' }

export type MultiQuestion<
	TKey extends string,
	TSlug extends string,
> = BaseQuestion<TKey, TSlug> & {
	kind: 'multi'
	minSelections: number
	maxSelections: number
}

export type QuestionSlug<TAnswer> = [NonNullable<TAnswer>] extends [
	readonly string[],
]
	? NonNullable<TAnswer>[number]
	: [NonNullable<TAnswer>] extends [string]
		? NonNullable<TAnswer>
		: never

/**
 * The question shape a draft field of type TAnswer demands: the question's
 * option slugs must exactly match the field's union. This is what ties every
 * question back to its DB column.
 */
export type Question<TKey extends string, TAnswer> =
	| SingleQuestion<TKey, QuestionSlug<TAnswer>>
	| MultiQuestion<TKey, QuestionSlug<TAnswer>>

type StringKeys<T> = keyof T & string

export type QuestionRecord<TPreferences> = {
	[K in StringKeys<TPreferences>]: Question<K, TPreferences[K]>
}

/**
 * The subset of a draft covered by a question list, with every question key
 * present. Value types keep the draft's `| undefined` so Partial<> of this
 * stays compatible with zod-inferred drafts under exactOptionalPropertyTypes.
 */
export type PreferencesFor<
	TDraft,
	TIds extends readonly (keyof TDraft & string)[],
> = {
	[K in TIds[number]]: TDraft[K]
}

export function single<TKey extends string, TSlug extends string>(
	id: TKey,
	config: {
		title: string
		label: string
		options: EnumDef<TSlug>
		optionMeta?: Partial<Record<TSlug, OptionMeta>>
	},
): SingleQuestion<TKey, TSlug> {
	return { kind: 'single', id, ...config }
}

export function multi<TKey extends string, TSlug extends string>(
	id: TKey,
	config: {
		title: string
		label: string
		options: EnumDef<TSlug>
		minSelections: number
		maxSelections: number
		optionMeta?: Partial<Record<TSlug, OptionMeta>>
	},
): MultiQuestion<TKey, TSlug> {
	return { kind: 'multi', id, ...config }
}

export function questionIds<
	const TList extends readonly { readonly id: string }[],
>(list: TList): { [I in keyof TList]: TList[I]['id'] } {
	// map() loses tuple structure; the annotation restores what the list
	// literal guarantees.
	// oxlint-disable-next-line typescript/consistent-type-assertions
	return list.map((question) => question.id) as {
		[I in keyof TList]: TList[I]['id']
	}
}

export function questionRecord<
	const TList extends readonly { readonly id: string }[],
>(
	list: TList,
): { [K in TList[number]['id']]: Extract<TList[number], { id: K }> } {
	// fromEntries loses key/value correlation; the annotation restores it.
	// oxlint-disable-next-line typescript/consistent-type-assertions
	return Object.fromEntries(
		list.map((question) => [question.id, question]),
	) as {
		[K in TList[number]['id']]: Extract<TList[number], { id: K }>
	}
}
