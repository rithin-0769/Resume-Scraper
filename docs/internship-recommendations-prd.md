# Internship Recommendation PRD

## Goal

Help a candidate upload or paste a resume, parse it into structured data, and immediately see the best internship categories to pursue next.

## Problem

The current product extracts resume data, but it stops at organization and search. Students and early-career candidates still need help answering:

- Which internships am I actually a good fit for?
- What skills should I emphasize when applying?
- What search terms should I use next?

## Target Users

- Students applying for internships
- Freshers and early-career candidates
- Recruiters or mentors helping candidates target relevant roles

## User Story

As a candidate, after uploading my resume, I want the product to recommend internship paths that fit my skills and projects so I can apply faster and more confidently.

## Scope For V1

- Fix PDF upload reliability so uploaded resumes behave like pasted text
- Generate internship recommendations from parsed resume signals
- Show top recommendation cards in the candidate detail view
- Explain why each recommendation was chosen
- Suggest skills to highlight and search terms to use

## Non-Goals For V1

- Live job scraping
- External internship application links
- Personalized salary/location matching
- Fine-tuned ML ranking model

## Recommendation Inputs

- Technical skills
- Projects and tech stack
- Experience titles and descriptions
- Degree keywords
- Resume confidence and quality score

## Recommendation Output

Each recommendation should include:

- Internship title
- Match score
- Fit level
- Short explanation
- Skills to highlight
- Suggested search queries

## Success Metrics

- More successful PDF uploads
- Higher percentage of candidates opening the detail modal
- More interaction with recommendation cards
- Faster candidate decision-making on role targeting

## Future Versions

- Add live internship listings via partner APIs
- Add preferred location and remote filters
- Add company-size and domain preferences
- Add application tracker and saved roles
- Add resume gap analysis per recommended role
