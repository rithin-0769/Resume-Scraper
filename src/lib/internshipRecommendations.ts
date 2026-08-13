export type CandidateProfile = {
  name: string;
  skills: string[];
  education: { degree: string; college: string; year: string; score: string }[];
  experience: { role: string; company: string; duration: string; years: number; description: string }[];
  projects: { name: string; description: string; tech: string[] }[];
  certifications: string[];
  totalExperience: number;
  qualityScore: number;
  confidence: number;
};

export type InternshipRecommendation = {
  title: string;
  matchScore: number;
  fitLevel: "High" | "Medium";
  reason: string;
  skillsToHighlight: string[];
  suggestedSearches: string[];
};

type InternshipRule = {
  title: string;
  skillKeywords: string[];
  projectKeywords: string[];
  searchTerms: string[];
};

const INTERNSHIP_RULES: InternshipRule[] = [
  {
    title: "Frontend Developer Intern",
    skillKeywords: ["React", "Next.js", "JavaScript", "TypeScript", "HTML", "CSS", "Tailwind"],
    projectKeywords: ["frontend", "dashboard", "ui", "website", "portfolio"],
    searchTerms: ["frontend intern remote", "react internship", "next.js intern"],
  },
  {
    title: "Backend Developer Intern",
    skillKeywords: ["Node.js", "Express", "Java", "Spring Boot", "Python", "Django", "Flask", "SQL", "PostgreSQL"],
    projectKeywords: ["api", "backend", "server", "database", "microservice"],
    searchTerms: ["backend developer intern", "node.js internship", "api intern"],
  },
  {
    title: "Full Stack Intern",
    skillKeywords: ["React", "Next.js", "Node.js", "Express", "MongoDB", "PostgreSQL", "TypeScript"],
    projectKeywords: ["full stack", "web app", "saas", "portal"],
    searchTerms: ["full stack internship", "mern intern", "web developer intern"],
  },
  {
    title: "Data Analyst Intern",
    skillKeywords: ["Python", "SQL", "Excel", "Power BI", "Tableau", "Pandas", "NumPy"],
    projectKeywords: ["analytics", "dashboard", "forecast", "insights", "visualization"],
    searchTerms: ["data analyst intern", "business analyst internship", "power bi internship"],
  },
  {
    title: "Machine Learning Intern",
    skillKeywords: ["Python", "Machine Learning", "Deep Learning", "NLP", "TensorFlow", "PyTorch", "Scikit-Learn"],
    projectKeywords: ["model", "ml", "classification", "prediction", "nlp"],
    searchTerms: ["machine learning internship", "ai intern", "nlp internship"],
  },
  {
    title: "Cloud / DevOps Intern",
    skillKeywords: ["AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "CI/CD", "Jenkins"],
    projectKeywords: ["deployment", "infrastructure", "devops", "cloud", "automation"],
    searchTerms: ["devops internship", "cloud intern", "aws internship"],
  },
  {
    title: "Mobile App Intern",
    skillKeywords: ["React Native", "Flutter", "Android", "iOS", "Swift", "Kotlin"],
    projectKeywords: ["mobile", "android", "ios", "app"],
    searchTerms: ["mobile app internship", "android intern", "flutter internship"],
  },
];

function normalize(values: string[]) {
  return values.map((value) => value.toLowerCase());
}

export function getInternshipRecommendations(candidate: CandidateProfile): InternshipRecommendation[] {
  const normalizedSkills = normalize(candidate.skills);
  const normalizedProjectText = normalize(
    candidate.projects.flatMap((project) => [project.name, project.description, ...project.tech]),
  );
  const normalizedExperience = normalize(
    candidate.experience.flatMap((entry) => [entry.role, entry.company, entry.description]),
  );
  const degreeText = candidate.education.map((entry) => `${entry.degree} ${entry.college}`).join(" ").toLowerCase();

  const recommendations = INTERNSHIP_RULES.map((rule): InternshipRecommendation => {
    const matchedSkills = rule.skillKeywords.filter((keyword) =>
      normalizedSkills.some((skill) => skill.includes(keyword.toLowerCase())),
    );
    const matchedProjectSignals = rule.projectKeywords.filter((keyword) =>
      normalizedProjectText.some((text) => text.includes(keyword.toLowerCase())),
    );
    const matchedExperienceSignals = rule.projectKeywords.filter((keyword) =>
      normalizedExperience.some((text) => text.includes(keyword.toLowerCase())),
    );

    let score = matchedSkills.length * 14 + matchedProjectSignals.length * 8 + matchedExperienceSignals.length * 5;
    if (candidate.totalExperience <= 1.5) score += 8;
    if (/b\.tech|b\.e|bsc|mca|bca|computer|information technology|software|data/i.test(degreeText)) score += 8;
    score += Math.min(10, Math.round(candidate.qualityScore / 12));
    score += Math.min(8, Math.round(candidate.confidence / 20));

    return {
      title: rule.title,
      matchScore: Math.min(98, score),
      fitLevel: score >= 55 ? ("High" as const) : ("Medium" as const),
      reason:
        matchedSkills.length > 0
          ? `Strong overlap with ${matchedSkills.slice(0, 4).join(", ")} and related project signals.`
          : "General fit based on education, resume quality, and early-career profile.",
      skillsToHighlight: matchedSkills.slice(0, 5),
      suggestedSearches: rule.searchTerms,
    };
  })
    .filter((item) => item.matchScore >= 35)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 4);

  if (recommendations.length > 0) {
    return recommendations;
  }

  return [
    {
      title: "General Software Intern",
      matchScore: 52,
      fitLevel: "Medium",
      reason: "Resume shows enough technical signal to target broad software internships while refining specialization.",
      skillsToHighlight: candidate.skills.slice(0, 4),
      suggestedSearches: ["software intern remote", "sde internship", "graduate software intern"],
    },
  ];
}
