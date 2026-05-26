#!/usr/bin/env npx ts-node

/**
 * Build script for generating AGENTS.md from individual rule files
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import {
  CATEGORIES,
  Metadata,
  Rule,
  getCategoryForFile,
  parseFrontmatter,
  readMetadata,
} from './build-utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function readRules(): Rule[] {
  const rulesDir = path.join(__dirname, '..', 'rules');
  const files = fs
    .readdirSync(rulesDir)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_'));

  const rules: Rule[] = [];
  for (const file of files) {
    const filePath = path.join(rulesDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const { frontmatter, body } = parseFrontmatter(content);

    if (!frontmatter) continue;

    const category = getCategoryForFile(file);
    if (!category) continue;

    rules.push({
      filename: file,
      frontmatter,
      content: body,
      category: category.name,
      categorySection: category.section,
    });
  }
  return rules;
}

function generateTableOfContents(rulesByCategory: Map<string, Rule[]>): string {
  let toc = '## Table of Contents\n\n';
  for (const cat of CATEGORIES) {
    const rules = rulesByCategory.get(cat.name);
    if (!rules || rules.length === 0) continue;

    const sectionAnchor = `${cat.section}-${cat.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')}`;
    toc += `${cat.section}. [${cat.name}](#${sectionAnchor}) — **${cat.impact}**\n`;

    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      const ruleNum = `${cat.section}${i + 1}`;
      const anchor = `${ruleNum}-${rule.frontmatter.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')}`;
      toc += `   - ${cat.section}.${i + 1} [${
        rule.frontmatter.title
      }](#${anchor})\n`;
    }
  }
  return toc;
}

function generateAgentsMd(rules: Rule[], metadata: Metadata): string {
  const rulesByCategory = new Map<string, Rule[]>();
  for (const rule of rules) {
    if (!rulesByCategory.has(rule.category)) {
      rulesByCategory.set(rule.category, []);
    }
    rulesByCategory.get(rule.category)!.push(rule);
  }

  for (const categoryRules of rulesByCategory.values()) {
    categoryRules.sort((a, b) => a.filename.localeCompare(b.filename));
  }

  let doc = `# NestJS Best Practices\n\n**Version ${metadata.version}**\n${metadata.organization}\n${metadata.date}\n\n`;
  doc += `> **Note:**\n> This document is mainly for agents and LLMs...\n\n---\n\n## Abstract\n\n${metadata.abstract}\n\n---\n\n`;
  doc += generateTableOfContents(rulesByCategory);
  doc += '\n---\n\n';

  for (const cat of CATEGORIES) {
    const categoryRules = rulesByCategory.get(cat.name);
    if (!categoryRules || categoryRules.length === 0) continue;

    doc += `## ${cat.section}. ${cat.name}\n\n**Section Impact: ${cat.impact}**\n\n`;

    for (let i = 0; i < categoryRules.length; i++) {
      const rule = categoryRules[i];
      doc += `### ${cat.section}.${i + 1} ${rule.frontmatter.title}\n\n`;
      doc += `**Impact: ${rule.frontmatter.impact}** — ${rule.frontmatter.impactDescription}\n\n`;

      let ruleContent = rule.content;
      ruleContent = ruleContent.replace(/^#{1,2}\s+.*\n+/, '');
      ruleContent = ruleContent.replace(/^\*\*Impact:.*\*\*.*\n+/, '');
      doc += ruleContent + '\n\n---\n\n';
    }
  }

  doc += `## References\n\n`;
  for (const ref of metadata.references) {
    doc += `- ${ref}\n`;
  }
  doc += `\n---\n\n*Generated on ${new Date().toISOString().split('T')[0]}*\n`;
  return doc;
}

function main() {
  const metadata = readMetadata(__dirname);
  const rules = readRules();
  const agentsMd = generateAgentsMd(rules, metadata);
  const outputPath = path.join(__dirname, '..', 'AGENTS.md');
  fs.writeFileSync(outputPath, agentsMd);
}

main();
