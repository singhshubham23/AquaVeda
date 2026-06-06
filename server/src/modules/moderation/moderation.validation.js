import { z } from "zod";

export const createReportSchema = z.object({
  body: z.object({
    refType: z.enum(["ISSUE", "COMMENT", "WIKI", "USER"]),
    refId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Reference ID format"),
    reason: z.enum(["SPAM", "INAPPROPRIATE", "HARASSMENT", "OTHER"]),
    details: z.string().max(1000).optional()
  })
});

export const listReportsQuerySchema = z.object({
  query: z.object({
    status: z.enum(["PENDING", "REVIEWED", "RESOLVED", "DISMISSED"]).optional(),
    refType: z.enum(["ISSUE", "COMMENT", "WIKI", "USER"]).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional()
  })
});

export const reportIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Report ID format")
  })
});

export const reviewReportSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Report ID format")
  }),
  body: z.object({
    status: z.enum(["REVIEWED", "RESOLVED", "DISMISSED"]),
    reviewNotes: z.string().max(1000).optional()
  })
});
