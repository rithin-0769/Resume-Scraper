import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { candidates } from "@/db/schema";
import { parseResume } from "@/lib/parser";
import { desc, ilike, or, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() || "";
  const skill = searchParams.get("skill")?.trim() || "";
  const degree = searchParams.get("degree")?.trim() || "";
  const minExp = parseFloat(searchParams.get("minExp") || "0");
  const company = searchParams.get("company")?.trim() || "";

  try {
    let rows = await db.select().from(candidates).orderBy(desc(candidates.createdAt));

    // In-memory filtering for flexibility (skills is JSONB, do simple filter)
    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter(r =>
        r.name.toLowerCase().includes(s) ||
        (r.email && r.email.toLowerCase().includes(s)) ||
        (r.rawText && r.rawText.toLowerCase().includes(s)) ||
        ((r.skills as string[])?.some(k=> k.toLowerCase().includes(s))) ||
        ((r.experience as any[])?.some((e:any)=> (e.role||"").toLowerCase().includes(s) || (e.company||"").toLowerCase().includes(s)))
      );
    }
    if (skill) {
      const sk = skill.toLowerCase();
      rows = rows.filter(r => ((r.skills as string[])||[]).some(k=> k.toLowerCase().includes(sk)));
    }
    if (degree) {
      const d = degree.toLowerCase();
      rows = rows.filter(r => ((r.education as any[])||[]).some((e:any)=> (e.degree||"").toLowerCase().includes(d) || (e.college||"").toLowerCase().includes(d)));
    }
    if (minExp > 0) {
      rows = rows.filter(r => (r.totalExperience || 0) >= minExp);
    }
    if (company) {
      const c = company.toLowerCase();
      rows = rows.filter(r => ((r.experience as any[])||[]).some((e:any)=> (e.company||"").toLowerCase().includes(c)));
    }

    return NextResponse.json(rows);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch candidates" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rawText, fileName } = body;
    if (!rawText || typeof rawText !== "string" || rawText.trim().length < 20) {
      return NextResponse.json({ error: "rawText is required (min 20 chars)" }, { status: 400 });
    }
    if (rawText.length > 50000) {
      return NextResponse.json({ error: "Resume text too large (max 50k chars)" }, { status: 400 });
    }

    const parsed = parseResume(rawText, fileName);

    // duplicate detection by email
    if (parsed.email) {
      const existing = await db.select().from(candidates).where(sql`${candidates.email} = ${parsed.email}`);
      if (existing.length > 0) {
        return NextResponse.json({ error: "Duplicate resume: email already exists", duplicateId: existing[0].id }, { status: 409 });
      }
    }

    const [inserted] = await db.insert(candidates).values({
      name: parsed.name,
      email: parsed.email,
      phone: parsed.phone,
      address: parsed.address,
      linkedin: parsed.linkedin,
      github: parsed.github,
      summary: parsed.summary,
      rawText,
      fileName: fileName || null,
      education: parsed.education,
      skills: parsed.skills,
      softSkills: parsed.softSkills,
      experience: parsed.experience,
      certifications: parsed.certifications,
      projects: parsed.projects,
      languages: parsed.languages,
      totalExperience: parsed.totalExperience,
      confidence: parsed.confidence,
      qualityScore: parsed.qualityScore,
    }).returning();

    return NextResponse.json(inserted, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to parse resume" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await db.delete(candidates);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to clear" }, { status: 500 });
  }
}
