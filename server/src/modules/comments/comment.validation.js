import { z } from "zod";

export const createCommentSchema = z.object({
  body: z.object({
    refType: z.preprocess(
      (value) => (typeof value === "string" ? value.toUpperCase() : value),
      z.enum(["ISSUE", "WIKI"]),
    ),
    refId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Reference ID format"),
    content: z.string().min(1, "content is required").max(2000),
    parentComment: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid Parent ID format")
      .nullable()
      .optional(),
  }),
});

export const listCommentQuerySchema = z.object({
  query: z.object({
    refType: z.preprocess(
      (value) => (typeof value === "string" ? value.toUpperCase() : value),
      z.enum(["ISSUE", "WIKI"]),
    ),
    refId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Reference ID format"),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  }),
});

export const commentIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Comment ID format"),
  }),
});

export const updateCommentSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Comment ID format"),
  }),
  body: z.object({
    content: z.string().min(1, "content is required").max(2000),
  }),
});

export const flagCommentSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Comment ID format"),
  }),
});

export const voteCommentSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Comment ID format"),
  }),
  body: z.object({
    type: z.preprocess(
      (value) => (typeof value === "string" ? value.toUpperCase() : value),
      z.enum(["UP", "DOWN"]),
    ),
  }),
});
