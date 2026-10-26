const metadataFieldPatterns = {
	title: /@title[ \t]*:[ \t]*(.*)/,
	author: /@author[ \t]*:[ \t]*(.*)/,
	tags: /@tags[ \t]*:[ \t]*(.*)/,
	addedOn: /@addedOn[ \t]*:[ \t]*(.*)/,
	description: /@description[ \t]*:[ \t]*(.*)/,
};

export type ParsedMetaEntry = {
	filename: string;
	title: string;
	author: string;
	tags: string[];
	addedOn: string;
	description: string;
};

type MetadataIssue = {
	field: keyof Omit<ParsedMetaEntry, "filename">;
	message: string;
};

const getMatchValue = (match: RegExpExecArray | null) => match?.[1]?.trim() ?? "";

const isValidDateString = (value: string) => {
	if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return true;
	return Number.isFinite(Date.parse(value));
};

const parseTags = (raw: string): { tags?: string[]; issue?: string } => {
	if (!raw.trim()) return { issue: "is empty (expected a JSON-ish array like ['maze','puzzle'])." };

	try {
		const parsed = JSON.parse(raw.replaceAll("'", '"'));
		if (!Array.isArray(parsed)) return { issue: "must be an array (example: ['maze','puzzle'])." };
		if (parsed.some((tag) => typeof tag !== "string")) {
			return { issue: "must be an array of strings (example: ['maze','puzzle'])." };
		}

		return { tags: parsed as string[] };
	} catch (error) {
		if (error instanceof SyntaxError) {
			return { issue: "is not valid JSON (example: ['maze','puzzle'])." };
		}

		return { issue: "could not be parsed." };
	}
};

const validateAndBuildMetadata = (
	gameFile: string,
	raw: Record<string, RegExpExecArray | null>,
): { entry?: ParsedMetaEntry; issues: MetadataIssue[] } => {
	const issues: MetadataIssue[] = [];
	const title = getMatchValue(raw.title ?? null);
	const author = getMatchValue(raw.author ?? null);
	const tagsRaw = getMatchValue(raw.tags ?? null);
	const addedOn = getMatchValue(raw.addedOn ?? null);
	const description = getMatchValue(raw.description ?? null);

	if (!raw.title) issues.push({ field: "title", message: "is missing (expected a line like `@title: My Game`)." });
	else if (!title) issues.push({ field: "title", message: "is empty." });

	if (!raw.author) issues.push({ field: "author", message: "is missing (expected `@author: Name`)." });
	else if (!author) issues.push({ field: "author", message: "is empty." });

	if (!raw.tags) issues.push({ field: "tags", message: "is missing (expected `@tags: ['tag1','tag2', ... ]`)." });
	const parsedTags = raw.tags ? parseTags(tagsRaw) : { issue: undefined as string | undefined, tags: [] as string[] };
	if (raw.tags && parsedTags.issue) issues.push({ field: "tags", message: parsedTags.issue });

	if (!raw.addedOn) issues.push({ field: "addedOn", message: "is missing (expected `@addedOn: YYYY-MM-DD`)." });
	else if (!addedOn) issues.push({ field: "addedOn", message: "is empty." });
	else if (!isValidDateString(addedOn)) issues.push({ field: "addedOn", message: "is not a valid date (recommended `YYYY-MM-DD`)." });

	if (!raw.description) issues.push({ field: "description", message: "is missing (expected `@description: ...`)." });
	else if (!description) issues.push({ field: "description", message: "is empty." });

	if (issues.length) return { issues };

	return {
		issues,
		entry: {
			filename: gameFile.replace(".js", ""),
			title,
			author,
			tags: parsedTags.tags ?? [],
			addedOn,
			description,
		},
	};
};

export const parseMetadataFromSource = (gameFile: string, fileData: string) => {
	const raw = Object.fromEntries(
		Object.entries(metadataFieldPatterns).map(([key, pattern]) => [key, pattern.exec(fileData)]),
	);
	const { entry, issues } = validateAndBuildMetadata(gameFile, raw);

	if (issues.length || !entry) {
		const message = issues.map((issue) => `- ${issue.field}: ${issue.message}`).join("\n");
		throw new Error(`Metadata issues in ./games/${gameFile}:\n${message}\n`);
	}

	return entry;
};
