export type ParsedResume = {
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  linkedin: string | null;
  github: string | null;
  summary: string;
  education: { degree: string; college: string; year: string; score: string }[];
  skills: string[];
  softSkills: string[];
  experience: { role: string; company: string; duration: string; years: number; description: string }[];
  certifications: string[];
  projects: { name: string; description: string; tech: string[] }[];
  languages: string[];
  totalExperience: number;
  confidence: number;
  qualityScore: number;
};

const TECH_SKILLS = [
  "JavaScript","TypeScript","React","Next.js","Node.js","Express","Python","Django","Flask","Java","Spring Boot","Kotlin","Go","Rust","C++","C#",".NET","PHP","Laravel","Ruby","Rails",
  "AWS","Azure","GCP","Docker","Kubernetes","Terraform","CI/CD","Jenkins","Git","GitHub","GitLab",
  "SQL","PostgreSQL","MySQL","MongoDB","Redis","Elasticsearch","GraphQL","REST API","gRPC",
  "HTML","CSS","Tailwind","SASS","Vue","Angular","Nuxt","Svelte","React Native","Flutter",
  "Machine Learning","Deep Learning","NLP","Computer Vision","TensorFlow","PyTorch","Scikit-Learn","Pandas","NumPy",
  "Figma","Adobe XD","Photoshop","Illustrator",
  "Agile","Scrum","JIRA","Confluence",
  "Hadoop","Spark","Kafka","Airflow","Power BI","Tableau","Excel","Snowflake","Databricks",
  "Blockchain","Solidity","Web3","Ethereum",
  "Cybersecurity","Penetration Testing","Network Security",
  "iOS","Android","Swift","Objective-C"
];

const SOFT_SKILLS = ["Communication","Leadership","Teamwork","Problem Solving","Critical Thinking","Time Management","Adaptability","Creativity","Collaboration","Empathy","Decision Making","Conflict Resolution","Mentoring","Public Speaking","Negotiation","Strategic Thinking"];

const DEGREE_KEYWORDS = ["Bachelor","Master","B.Tech","M.Tech","B.E","M.E","BSc","MSc","BCA","MCA","MBA","PhD","Doctor","Associate","Diploma","B.Com","M.Com","B.A","M.A"];
const COLLEGE_KEYWORDS = ["University","College","Institute","School","Academy","Polytechnic"];

const LANGUAGES = ["English","Hindi","Spanish","French","German","Mandarin","Japanese","Korean","Arabic","Portuguese","Russian","Tamil","Telugu","Kannada","Malayalam","Bengali","Marathi","Urdu"];

export function parseResume(rawText: string, fileName?: string): ParsedResume {
  const text = rawText.replace(/\r/g, "").trim();
  const lines = text.split("\n").map(l=>l.trim()).filter(Boolean);
  
  // Email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : null;

  // Phone
  const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  let phone: string | null = null;
  if (phoneMatch) {
    const cleaned = phoneMatch[0].replace(/\s+/g, " ").trim();
    if (cleaned.replace(/\D/g,"").length >= 10) phone = cleaned;
  }

  // LinkedIn / GitHub
  const linkedinMatch = text.match(/linkedin\.com\/in\/[a-zA-Z0-9\-_%]+/i);
  const githubMatch = text.match(/github\.com\/[a-zA-Z0-9\-_]+/i);
  const linkedin = linkedinMatch ? "https://" + linkedinMatch[0] : null;
  const github = githubMatch ? "https://" + githubMatch[0] : null;

  // Address - look for line with City, State or pincode
  let address: string | null = null;
  for (const l of lines) {
    if (/(\d{5,6}|[A-Z]{2}\s*\d{5}|India|USA|UK|California|New York|Bangalore|Hyderabad|Mumbai|Delhi|Chennai|Pune)/i.test(l) && l.length < 120 && l.includes(",")) {
      address = l;
      break;
    }
  }

  // Name - heuristic: first line with 2-3 capitalized words, not containing email/phone, or line before email
  let name = "Unknown Candidate";
  const firstLines = lines.slice(0, 5);
  for (const l of firstLines) {
    const words = l.split(/\s+/);
    const isNameLike = words.length >=2 && words.length <=4 && /^[A-Z][a-z]+/.test(words[0]) && !l.includes("@") && !l.includes("http") && !/\d/.test(l) && l.length < 40;
    if (isNameLike && !/(resume|curriculum|profile|objective|summary)/i.test(l)) {
      name = l.replace(/[^a-zA-Z\s.'-]/g,"").trim();
      break;
    }
  }
  // fallback: if fileName contains name
  if (name === "Unknown Candidate" && fileName) {
    const base = fileName.replace(/\.pdf$/i,"").replace(/[_-]/g," ").replace(/\d+/g,"").trim();
    if (base.length > 3) name = base.split(" ").map(w=> w.charAt(0).toUpperCase()+w.slice(1)).join(" ").slice(0,30);
  }

  // Skills
  const lower = text.toLowerCase();
  const skills: string[] = [];
  for (const s of TECH_SKILLS) {
    const pattern = new RegExp(`\\b${s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\s+/g,"\\s+")}\\b`, "i");
    if (pattern.test(text)) skills.push(s);
  }
  // Also detect skills section list
  const skillsSectionMatch = text.match(/(skills|technologies|tech stack)[:\s]*([\s\S]{0,500}?)(?=\n\s*(experience|education|projects|certifications|languages|summary)\b)/i);
  if (skillsSectionMatch) {
    const chunk = skillsSectionMatch[2];
    const extra = chunk.split(/[,•\n|]+/).map(s=>s.trim()).filter(s=> s.length>1 && s.length<30);
    for (const e of extra) {
      if (e.length>2 && !skills.includes(e) && /^[A-Za-z0-9.+#\/\s]+$/.test(e)) {
        const normalized = e.split(" ").map(w=> w.charAt(0).toUpperCase()+w.slice(1).toLowerCase()).join(" ");
        if (normalized.length<25 && !skills.includes(normalized) && skills.length<40) {
          // only add if plausible tech
          if (/[a-z]/i.test(normalized) && normalized.split(" ").length<=3) skills.push(normalized);
        }
      }
    }
  }

  // Soft skills
  const softSkills: string[] = SOFT_SKILLS.filter(s=> lower.includes(s.toLowerCase()));

  // Education
  const education: ParsedResume["education"] = [];
  const eduLines = lines.filter(l=> DEGREE_KEYWORDS.some(k=> l.toLowerCase().includes(k.toLowerCase())) || COLLEGE_KEYWORDS.some(k=> l.toLowerCase().includes(k.toLowerCase())));
  for (const l of eduLines.slice(0,4)) {
    const degree = DEGREE_KEYWORDS.find(k=> l.toLowerCase().includes(k.toLowerCase())) || l.split(",")[0].slice(0,40);
    const collegeMatch = l.match(new RegExp(`([A-Z][a-z]+\\s*){1,4}(${COLLEGE_KEYWORDS.join("|")})`, "i"));
    const college = collegeMatch ? collegeMatch[0] : (l.includes(",") ? l.split(",").slice(1).join(",").trim().slice(0,50) : l.slice(0,50));
    const yearMatch = l.match(/(19|20)\d{2}\s*[-–]\s*(19|20)\d{2}|(19|20)\d{2}/);
    const year = yearMatch ? yearMatch[0] : "";
    const scoreMatch = l.match(/(\d+(\.\d+)?\s*%|CGPA\s*\d+(\.\d+)?|GPA\s*\d+(\.\d+)?)/i);
    education.push({ degree: degree.trim(), college: college.trim(), year, score: scoreMatch ? scoreMatch[0] : "" });
  }
  if (education.length===0) {
    // try to find education block
    const eduBlock = text.match(/education[\s\S]{0,400}/i);
    if (eduBlock) {
      const blkLines = eduBlock[0].split("\n").slice(1,4);
      for (const l of blkLines) if (l.trim().length>5) education.push({ degree: l.slice(0,40), college: "", year: "", score: "" });
    }
  }

  // Experience
  const experience: ParsedResume["experience"] = [];
  const expRegex = /(intern|engineer|developer|manager|analyst|consultant|designer|lead|architect|scientist|associate|specialist|officer|executive)\b/gi;
  let totalExperience = 0;
  const expBlockMatch = text.match(/(experience|work history|employment)[\s\S]{0,1200}? (?=(education|skills|projects|certifications))/i);
  const searchArea = expBlockMatch ? expBlockMatch[0] : text;
  const expLines = searchArea.split("\n");
  for (let i=0;i<expLines.length;i++) {
    const line = expLines[i];
    if (expRegex.test(line) && line.length < 120) {
      expRegex.lastIndex = 0;
      const role = line.split(/ at | @ | \| | - /)[0].trim().slice(0,60);
      let company = "Unknown";
      const atMatch = line.match(/ at ([A-Z][A-Za-z0-9\s&.,]+)/) || line.match(/@ ([A-Z][A-Za-z0-9\s&.,]+)/);
      if (atMatch) company = atMatch[1].trim().slice(0,50);
      else if (expLines[i+1] && /^[A-Z][A-Za-z\s&]+$/.test(expLines[i+1].trim()) && expLines[i+1].trim().length < 40) {
        company = expLines[i+1].trim();
      }
      // duration and years
      const nextLines = expLines.slice(i, i+3).join(" ");
      const durationMatch = nextLines.match(/((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\s*[-–]\s*(Present|Current|\w+\s+\d{4})|\d{4}\s*[-–]\s*(\d{4}|Present)|(\d+(\.\d+)?)\s*(years|yrs))/i);
      let duration = durationMatch ? durationMatch[0].trim() : "";
      let years = 0;
      const yearsMatch = duration.match(/(\d+(\.\d+)?)\s*(years|yrs)/i);
      if (yearsMatch) years = parseFloat(yearsMatch[1]);
      else if (duration.includes("Present") || duration.includes("–")) {
        // estimate 1-3 years if not explicit
        years = 2;
      }
      if (years>0) totalExperience += years;
      const desc = expLines.slice(i+1, i+4).join(" ").slice(0,200);
      experience.push({ role, company, duration, years, description: desc });
      if (experience.length>=4) break;
    }
  }
  // if no experience found but text mentions years
  if (experience.length===0) {
    const yMatch = text.match(/(\d+)\+?\s*(years|yrs)\s*(of\s*)?experience/i);
    if (yMatch) {
      totalExperience = parseInt(yMatch[1]);
      experience.push({ role: "Professional", company: "—", duration: `${totalExperience} years`, years: totalExperience, description: "Experience inferred from resume" });
    } else {
      // look for fresher
      if (/fresher|entry level|recent graduate/i.test(text)) {
        totalExperience = 0;
      }
    }
  } else if (totalExperience===0 && experience.length>0) {
    totalExperience = experience.reduce((a,b)=>a+b.years,0) || experience.length * 1.5;
  }
  totalExperience = Math.round(totalExperience * 10)/10;

  // Projects
  const projects: ParsedResume["projects"] = [];
  const projectBlock = text.match(/projects?[\s\S]{0,800}? (?=(experience|education|skills|certifications))/i);
  const projSource = projectBlock ? projectBlock[0] : text;
  const projMatches = [...projSource.matchAll(/(project\s*\d*|•|-)\s*([A-Z][A-Za-z0-9\s\-:]{5,50})/g)].slice(0,3);
  for (const m of projMatches) {
    const name = m[2]?.trim().slice(0,50) || "Project";
    if (name.length<5) continue;
    // find next 1-2 lines as description
    const idx = projSource.indexOf(m[0]);
    const snippet = projSource.slice(idx, idx+250).split("\n").slice(1,3).join(" ").slice(0,150);
    const techInDesc = TECH_SKILLS.filter(s=> snippet.toLowerCase().includes(s.toLowerCase())).slice(0,4);
    projects.push({ name, description: snippet || "Built using modern technologies", tech: techInDesc.length? techInDesc : skills.slice(0,3) });
  }
  if (projects.length===0 && skills.length>0) {
    // synthetic project if none found but has skills
    projects.push({ name: "Portfolio Project", description: "Showcased skills in "+skills.slice(0,5).join(", "), tech: skills.slice(0,4) });
  }

  // Certifications
  const certifications: string[] = [];
  const certMatches = text.match(/(certified|certification|certificate)[\s\S]{0,300}/gi);
  if (certMatches) {
    for (const blk of certMatches) {
      const linesIn = blk.split("\n").slice(0,4);
      for (const l of linesIn) {
        const clean = l.replace(/.*certified|certification|certificate/i,"").trim();
        if (clean.length>5 && clean.length<80 && !certifications.includes(clean)) certifications.push(clean.slice(0,80));
      }
    }
  }
  // also pattern like AWS Certified, Google, etc
  const knownCerts = ["AWS","Azure","GCP","PMP","Scrum","Kubernetes","Cisco","Oracle","Google Cloud","Microsoft","Salesforce","Tableau"];
  for (const kc of knownCerts) if (lower.includes(kc.toLowerCase()+" certified") || lower.includes("certified "+kc.toLowerCase())) {
    const c = `${kc} Certified`;
    if (!certifications.includes(c)) certifications.push(c);
  }

  // Languages
  const languages = LANGUAGES.filter(l=> {
    const re = new RegExp(`\\b${l}\\b`, "i");
    return re.test(text) && (text.match(new RegExp(`languages[\\s\\S]{0,200}${l}`, "i")) || lower.includes(l.toLowerCase()));
  });
  // also extract from languages section
  const langSection = text.match(/languages?[:\s]*([A-Za-z,\s]+)(?=\n|$)/i);
  if (langSection) {
    const list = langSection[1].split(",").map(s=>s.trim()).filter(Boolean);
    for (const l of list) if (!languages.includes(l) && l.length<20) languages.push(l);
  }

  // Summary
  let summary = "";
  const summaryMatch = text.match(/(summary|objective|profile)[\s\S]{0,400}/i);
  if (summaryMatch) {
    summary = summaryMatch[0].split("\n").slice(1,4).join(" ").trim().slice(0,300);
  }
  if (!summary) {
    summary = `${name} is a candidate with ${totalExperience>0? totalExperience+" years of experience" : "fresh perspective"} skilled in ${skills.slice(0,4).join(", ") || "various technologies"}. ${education[0]? "Holds "+education[0].degree+" from "+education[0].college : ""}`.slice(0,320);
  }

  // Confidence
  let confidence = 0;
  if (email) confidence+=15;
  if (phone) confidence+=10;
  if (name!=="Unknown Candidate") confidence+=15;
  if (skills.length>=3) confidence+=20; else if (skills.length>0) confidence+=10;
  if (education.length>0) confidence+=15;
  if (experience.length>0) confidence+=15;
  if (linkedin || github) confidence+=10;
  confidence = Math.min(98, Math.max(45, confidence));

  // Quality Score 0-100
  let qualityScore = 0;
  if (email && phone) qualityScore+=15; else if (email||phone) qualityScore+=8;
  if (education.length>0) qualityScore+=15;
  if (experience.length>0) qualityScore+=20; else if (totalExperience>0) qualityScore+=10;
  if (skills.length>=8) qualityScore+=20; else if (skills.length>=5) qualityScore+=15; else if (skills.length>=3) qualityScore+=10;
  if (projects.length>0) qualityScore+=10;
  if (certifications.length>0) qualityScore+=10;
  if (languages.length>0) qualityScore+=5;
  if (summary.length>50) qualityScore+=5;
  qualityScore = Math.min(100, qualityScore);

  return {
    name, email, phone, address, linkedin, github, summary,
    education, skills: skills.slice(0,30), softSkills: softSkills.slice(0,10),
    experience: experience.slice(0,5), certifications: certifications.slice(0,5),
    projects: projects.slice(0,4), languages: languages.slice(0,6),
    totalExperience, confidence, qualityScore
  };
}
