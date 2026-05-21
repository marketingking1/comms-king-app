import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import type { AgentName } from '@/lib/ai/providers';

export type AgentSpec = {
  name: AgentName;
  description: string;
  skills: string[];
  systemPrompt: string;
  degraded?: boolean;
};

const AGENTS_DIR = path.join(process.cwd(), 'agents');
const SKILLS_DIR = path.join(process.cwd(), 'skills');

/**
 * Lê o .md de um agente, faz parse do frontmatter e retorna spec utilizável.
 * Skills referenciadas são carregadas inline pra dar contexto ao LLM.
 */
export async function loadAgent(name: AgentName): Promise<AgentSpec> {
  const filePath = path.join(AGENTS_DIR, `${name}.md`);
  const raw = await fs.readFile(filePath, 'utf-8');
  const parsed = matter(raw);

  const fm = parsed.data as {
    model?: string;
    description?: string;
    skills?: string[];
    degraded_mode?: boolean;
  };

  const skills = fm.skills ?? [];
  const skillsContext = await loadSkillsInline(skills);

  // System prompt = body do agent + skills inline
  const systemPrompt = [
    parsed.content.trim(),
    skillsContext ? `\n\n---\n\n# SKILLS REFERENCIADAS\n\n${skillsContext}` : '',
  ].join('');

  return {
    name,
    description: fm.description ?? '',
    skills,
    systemPrompt,
    degraded: fm.degraded_mode ?? false,
  };
}

async function loadSkillsInline(skills: string[]): Promise<string> {
  const parts: string[] = [];
  for (const skill of skills) {
    const skillFile = path.join(SKILLS_DIR, skill, 'SKILL.md');
    try {
      const content = await fs.readFile(skillFile, 'utf-8');
      const parsed = matter(content);
      parts.push(
        `## SKILL: ${skill}\n_${parsed.data.description ?? ''}_\n\n${parsed.content.trim()}`,
      );
    } catch {
      // skill ausente — log mas não bloqueia
      parts.push(`## SKILL: ${skill}\n[SKILL FILE NOT FOUND]`);
    }
  }
  return parts.join('\n\n---\n\n');
}

export async function listAgents(): Promise<AgentName[]> {
  const files = await fs.readdir(AGENTS_DIR);
  return files
    .filter((f) => f.startsWith('comms-') && f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, '') as AgentName);
}
