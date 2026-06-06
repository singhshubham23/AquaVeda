import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Wiki ID format");

const tagList = z
  .array(z.string().trim().min(1).max(40))
  .max(12, "A post can have at most 12 tags");

export const createWikiSchema = z.object({
  body: z.object({
    type: z.enum(["ARTICLE", "QUESTION"]).optional().default("ARTICLE"),
    title: z.string().trim().min(3, "title must be at least 3 characters").max(160),
    content: z.string().trim().min(10, "content must be at least 10 characters").max(10000),
    tags: tagList.optional().default([]),
    region: z.string().trim().min(1).max(120).optional().default("global"),
  }),
});

export const updateWikiSchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z
    .object({
      type: z.enum(["ARTICLE", "QUESTION"]).optional(),
      title: z.string().trim().min(3, "title must be at least 3 characters").max(160).optional(),
      content: z.string().trim().min(10, "content must be at least 10 characters").max(10000).optional(),
      tags: tagList.optional(),
      region: z.string().trim().min(1).max(120).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: "At least one field is required",
    }),
});

export const wikiIdParamSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

export const voteWikiSchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z.object({
    type: z.preprocess(
      (value) => (typeof value === "string" ? value.toUpperCase() : value),
      z.enum(["UP", "DOWN"]),
    ),
  }),
});
