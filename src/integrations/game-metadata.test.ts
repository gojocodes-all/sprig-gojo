import { describe, expect, test } from "vitest";
import { parseMetadataFromSource } from "./game-metadata";

describe("parseMetadataFromSource", () => {
	test("parses the canonical metadata header", () => {
		const metadata = parseMetadataFromSource("maze.js", `/*
@title: Maze
@author: Sprig Maker
@tags: ['maze', 'puzzle']
@addedOn: 2026-10-26
@description: Find the exit.
*/`);

		expect(metadata).toEqual({
			filename: "maze",
			title: "Maze",
			author: "Sprig Maker",
			tags: ["maze", "puzzle"],
			addedOn: "2026-10-26",
			description: "Find the exit.",
		});
	});

	test("accepts optional horizontal whitespace around separators", () => {
		const metadata = parseMetadataFromSource("bucket.js", `/*
@title:Push the Bucket
@author\t:\tKowKow
@tags:['Puzzle']
@addedOn:2026-7-09
@description:Save water from a leaking pipe.
*/`);

		expect(metadata).toMatchObject({
			filename: "bucket",
			title: "Push the Bucket",
			author: "KowKow",
			tags: ["Puzzle"],
			addedOn: "2026-7-09",
			description: "Save water from a leaking pipe.",
		});
	});

	test("reports present but empty fields accurately", () => {
		expect(() => parseMetadataFromSource("empty.js", `/*
@title:
@author: Maker
@tags: []
@addedOn: 2026-10-26
@description: Empty title example.
*/`)).toThrow("- title: is empty.");
	});

	test("rejects non-array tags", () => {
		expect(() => parseMetadataFromSource("tags.js", `/*
@title: Tags
@author: Maker
@tags: 'puzzle'
@addedOn: 2026-10-26
@description: Invalid tags example.
*/`)).toThrow("- tags: must be an array");
	});
});
