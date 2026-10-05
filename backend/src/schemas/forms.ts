import { z } from "zod";
import { designSchema } from "./design.js";
import { DYNAMIC_TYPES } from "./payloads.js";

export const createCodeBody = z.object({
  type: z.enum(DYNAMIC_TYPES),
  payload: z.unknown(),
  design: designSchema.optional(),
  title: z.string().trim().max(80).optional(),
});

export const patchCodeBody = z.object({
  title: z.string().trim().max(80).optional(),
  payload: z.unknown().optional(),
  design: designSchema.optional(),
});

export const contactBody = z.object({
  name: z.string().trim().max(100).optional().or(z.literal("")),
  email: z.string().trim().email().max(200),
  subject: z.enum(["Question", "Bug", "Idea", "Other"]),
  message: z.string().trim().min(10).max(5000),
  website: z.string().optional(),
});

export const abuseBody = z.object({
  email: z.string().trim().email().max(200),
  url: z.string().trim().url().max(2000),
  reason: z.string().trim().min(10).max(3500),
  website: z.string().optional(),
});

export const feedbackBody = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});
