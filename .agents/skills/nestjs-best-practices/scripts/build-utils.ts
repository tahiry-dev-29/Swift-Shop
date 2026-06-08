import * as fs from 'fs';
import * as path from 'path';

export interface RuleFrontmatter {
  title: string;
  impact: string;
  impactDescription: string;
  tags: string[];
}

export interface Rule {
  filename: string;
  frontmatter: RuleFrontmatter;
  content: string;
  category: string;
  categorySection: number;
}

export interface Metadata {
  version: string;
  organization: string;
  date: string;
  abstract: string;
  references: string[];
}

export interface Category {
  prefix: string;
  name: string;
  impact: string;
  section: number;
}

export const CATEGORIES: Category[] = [
  { prefix: 'arch-', name: 'Architecture', impact: 'CRITICAL', section: 1 },
  {
    prefix: 'di-',
    name: 'Dependency Injection',
    impact: 'CRITICAL',
    section: 2,
  },
  { prefix: 'error-', name: 'Error Handling', impact: 'HIGH', section: 3 },
  { prefix: 'security-', name: 'Security', impact: 'HIGH', section: 4 },
  { prefix: 'perf-', name: 'Performance', impact: 'HIGH', section: 5 },
  { prefix: 'test-', name: 'Testing', impact: 'MEDIUM-HIGH', section: 6 },
  { prefix: 'db-', name: 'Database & ORM', impact: 'MEDIUM-HIGH', section: 7 },
  { prefix: 'api-', name: 'API Design', impact: 'MEDIUM', section: 8 },
  { prefix: 'micro-', name: 'Microservices', impact: 'MEDIUM', section: 9 },
  {
    prefix: 'devops-',
    name: 'DevOps & Deployment',
    impact: 'LOW-MEDIUM',
    section: 10,
  },
];

export function parseFrontmatter(content: string): {
  frontmatter: RuleFrontmatter | null;
  body: string;
} {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: null, body: content };
  }

  const frontmatterStr = match[1];
  const body = match[2];
  const frontmatter: Partial<RuleFrontmatter> = {};
  const lines = frontmatterStr.split('\n');
  let currentKey = '';
  let inArray = false;
  const arrayItems: string[] = [];

  for (const line of lines) {
    if (line.match(/^[a-zA-Z]+:/)) {
      if (inArray && currentKey === 'tags') {
        frontmatter.tags = [...arrayItems];
      }
      inArray = false;
      arrayItems.length = 0;

      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();
      currentKey = key.trim();

      if (value === '') {
        inArray = true;
      } else {
        const typedKey = currentKey as keyof RuleFrontmatter;
        if (typedKey !== 'tags') {
          (frontmatter as Record<string, string>)[typedKey] = value;
        }
      }
    } else if (inArray && line.trim().startsWith('-')) {
      arrayItems.push(line.trim().replace(/^-\s*/, ''));
    }
  }

  if (inArray && currentKey === 'tags') {
    frontmatter.tags = [...arrayItems];
  }

  return {
    frontmatter: frontmatter as RuleFrontmatter,
    body: body.trim(),
  };
}

export function getCategoryForFile(filename: string): Category | null {
  return CATEGORIES.find((cat) => filename.startsWith(cat.prefix)) || null;
}

export function readMetadata(dir: string): Metadata {
  const metadataPath = path.join(dir, '..', 'metadata.json');
  return JSON.parse(fs.readFileSync(metadataPath, 'utf-8')) as Metadata;
}
