/**
 * Astro integration that generates ./games/metadata.json.

 */
import type { AstroIntegration } from "astro";
import { availableParallelism } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { generateImageJson } from "./thumbnail";
import { parseMetadataFromSource, type ParsedMetaEntry } from "./game-metadata";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "../..");
const GAMES_DIR = join(ROOT_DIR, "games");
const GAMES_IMG_DIR = join(GAMES_DIR, "img");
const PUBLIC_DIR = join(ROOT_DIR, "public");
const ASTRO_DIR = join(ROOT_DIR, ".astro");
const METADATA_PATH = join(GAMES_DIR, "metadata.json");
const CACHE_PATH = join(ASTRO_DIR, "generate-metadata-cache.json");
const CACHE_VERSION = 1;
const CONCURRENCY = Math.max(1, Math.min(availableParallelism(), 8));

type BunRuntime = {
	file: (path: string) => {
		text: () => Promise<string>;
	};
	write: (path: string, data: string) => Promise<unknown>;
};

const bun = (globalThis as typeof globalThis & { Bun?: BunRuntime }).Bun;

type CacheEntry = {
	metadataFingerprint: string;
	thumbnailFingerprint: string;
	metadata: ParsedMetaEntry;
};

type CacheFile = {
	version: number;
	entries: Record<string, CacheEntry>;
};

type ProcessedGame = {
	metadata: ParsedMetaEntry;
	cacheEntry: CacheEntry;
	metadataCacheHit: boolean;
	thumbnailUpdated: boolean;
};

const readTextFile = async (filePath: string) => {
	if (bun) return bun.file(filePath).text();
	return readFile(filePath, "utf8");
};

const writeTextIfChanged = async (filePath: string, contents: string) => {
	const existing = await safeReadText(filePath);
	if (existing === contents) return false;

	await mkdir(dirname(filePath), { recursive: true });
	if (bun) await bun.write(filePath, contents);
	else await writeFile(filePath, contents, "utf8");
	return true;
};

const safeReadText = async (p: string) => readTextFile(p).catch(() => null);
const safeStat = async (p: string) => stat(p).catch(() => null);

const emptyCache = (): CacheFile => ({ version: CACHE_VERSION, entries: {} });

const loadCache = async (): Promise<CacheFile> => {
	const raw = await safeReadText(CACHE_PATH);
	if (!raw) return emptyCache();
	try {
		const c = JSON.parse(raw) as CacheFile;
		return c.version === CACHE_VERSION && c.entries && typeof c.entries === "object" ? c : emptyCache();
	} catch {
		return emptyCache();
	}
};

const mapWithConcurrency = async <T, R>(
	items: T[], n: number, fn: (item: T, i: number) => Promise<R>,
) => {
	const out = new Array<R | Error>(items.length);
	let idx = 0;
	await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
		while (idx < items.length) {
			const i = idx++;
			try {
				out[i] = await fn(items[i] as T, i);
			} catch (error) {
				out[i] = error instanceof Error ? error : new Error(String(error));
			}
		}
	}));
	return out;
};

const fingerprint = (s: { size: number; mtimeMs: number }) => `${s.size}:${Math.trunc(s.mtimeMs)}`;

const processGame = async (gameFile: string, cached?: CacheEntry): Promise<ProcessedGame> => {
	const name = gameFile.replace(/\.js$/, "");
	const gamePath = join(GAMES_DIR, gameFile);
	const imgPath = join(GAMES_IMG_DIR, `${name}.png`);
	const outPath = join(PUBLIC_DIR, `${name}.json`);

	const [gameStats, imgStats, outStats] = await Promise.all([
		safeStat(gamePath), safeStat(imgPath), safeStat(outPath),
	]);
	if (!gameStats) throw new Error(`Unable to read fingerprint for ./games/${gameFile}`);

	const metaFp = fingerprint(gameStats);
	const thumbFp = `${metaFp}|${imgStats ? fingerprint(imgStats) : "no-image"}`;
	const needsThumb = cached
		? cached.thumbnailFingerprint !== thumbFp
		: !outStats || outStats.mtimeMs < Math.max(gameStats.mtimeMs, imgStats?.mtimeMs ?? 0);

	let src: string | undefined;
	let metadata: ParsedMetaEntry;
	let metadataCacheHit = false;

	if (cached?.metadataFingerprint === metaFp) {
		metadata = cached.metadata;
		metadataCacheHit = true;
	} else {
		src = await readTextFile(gamePath);
		metadata = parseMetadataFromSource(gameFile, src);
	}

	const thumbnailUpdated = !outStats || needsThumb
		? await generateImageJson({ name, gameContentString: src, imagePath: imgPath, outputPath: outPath })
		: false;

	return {
		metadata,
		cacheEntry: { metadataFingerprint: metaFp, thumbnailFingerprint: thumbFp, metadata },
		metadataCacheHit,
		thumbnailUpdated,
	};
};

const generateMetadataArtifacts = async () => {
	const files = (await readdir(GAMES_DIR)).filter((f) => f.endsWith(".js"));
	const prev = await loadCache();
	const results = await mapWithConcurrency(files, CONCURRENCY, (f) => processGame(f, prev.entries[f]));

	const errors = results.filter((r) => r instanceof Error) as Error[];
	const successful = results.filter((r) => !(r instanceof Error)) as ProcessedGame[];

	if (errors.length) {
		const errorMsg = errors.map((e) => `- ${e.message}`).join("\n");
		throw new Error(`Failed to process ${errors.length} game(s):\n${errorMsg}`);
	}

	const metaOut = await writeTextIfChanged(METADATA_PATH, JSON.stringify(successful.map((r) => r.metadata)));
	const cacheOut = await writeTextIfChanged(CACHE_PATH, JSON.stringify({
		version: CACHE_VERSION,
		entries: Object.fromEntries(successful.map((r) => [`${r.metadata.filename}.js`, r.cacheEntry])),
	} satisfies CacheFile));

	const hits = successful.filter((r) => r.metadataCacheHit).length;
	const thumbs = successful.filter((r) => r.thumbnailUpdated).length;
	console.log(
		`[generate-metadata] ${files.length} games, ${hits} cache hits, ${thumbs} thumbnails regenerated, ` +
		`metadata ${metaOut ? "updated" : "unchanged"}, cache ${cacheOut ? "updated" : "unchanged"}`,
	);
};

export default (): AstroIntegration => ({
	name: "generate-metadata",
	hooks: {
		"astro:config:done": async () => {
			await mkdir(ASTRO_DIR, { recursive: true });
			await generateMetadataArtifacts();
		},
	},
});
