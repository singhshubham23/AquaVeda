import { z } from "zod";

export const createIssueSchema = z.object({
  body: z.object({
    title: z.string().min(3, "title must be at least 3 characters").max(200),
    description: z.string().min(5, "description must be at least 5 characters").max(5000),
    location: z.object({
      type: z.literal("Point"),
      coordinates: z.array(z.number()).length(2, "coordinates must contain [lng, lat]")
    }),
    severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
    region: z.string().min(1).optional(),
    images: z.array(z.string()).optional(),
    status: z.enum(["OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "VERIFIED"]).optional()
  })
});

export const listIssueQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional()
  })
});

export const filterIssueQuerySchema = z.object({
  query: z.object({
    severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
    status: z.enum(["OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "VERIFIED"]).optional(),
    region: z.string().min(1).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional()
  })
});

export const nearbyIssueQuerySchema = z.object({
  query: z.object({
    lng: z.coerce.number(),
    lat: z.coerce.number(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional()
  })
});

export const radiusIssueQuerySchema = z.object({
  query: z.object({
    lng: z.coerce.number(),
    lat: z.coerce.number(),
    radiusKm: z.coerce.number().min(0.1).max(50),
    status: z.enum(["OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "VERIFIED"]).optional(),
    severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional()
  })
});

export const issueIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Issue ID format")
  })
});

export const updateIssueStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Issue ID format")
  }),
  body: z.object({
    status: z.enum(["OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "VERIFIED"]),
    note: z.string().trim().max(280).optional()
  })
});
