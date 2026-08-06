import { pgTable, serial, text, timestamp, integer, jsonb, real } from "drizzle-orm/pg-core";

export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  linkedin: text("linkedin"),
  github: text("github"),
  summary: text("summary"),
  rawText: text("raw_text").notNull(),
  fileName: text("file_name"),
  education: jsonb("education").$type<{ degree: string; college: string; year: string; score: string }[]>().default([]),
  skills: jsonb("skills").$type<string[]>().default([]),
  softSkills: jsonb("soft_skills").$type<string[]>().default([]),
  experience: jsonb("experience").$type<{ role: string; company: string; duration: string; years: number; description: string }[]>().default([]),
  certifications: jsonb("certifications").$type<string[]>().default([]),
  projects: jsonb("projects").$type<{ name: string; description: string; tech: string[] }[]>().default([]),
  languages: jsonb("languages").$type<string[]>().default([]),
  totalExperience: real("total_experience").default(0),
  confidence: integer("confidence").default(0),
  qualityScore: integer("quality_score").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Candidate = typeof candidates.$inferSelect;
export type NewCandidate = typeof candidates.$inferInsert;
