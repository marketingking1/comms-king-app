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
      const references = await loadSkillReferences(skill);
      parts.push(
        `## SKILL: ${skill}\n_${parsed.data.description ?? ''}_\n\n${parsed.content.trim()}${
          references ? `\n\n### REFERÊNCIAS — ${skill}\n\n${references}` : ''
        }`,
      );
    } catch {
      // skill ausente — log mas não bloqueia
      parts.push(`## SKILL: ${skill}\n[SKILL FILE NOT FOUND]`);
    }
  }
  return parts.join('\n\n---\n\n');
}

/**
 * Carrega TODOS os .md em `skills/<skill>/references/` e devolve concatenado.
 * Inclui banco de verbatims, headlines validadas, históricos de performance, etc.
 * Sem isso, agentes ficavam tateando ângulo em vez de cravar a partir do dado real.
 */
async function loadSkillReferences(skill: string): Promise<string> {
  const refDir = path.join(SKILLS_DIR, skill, 'references');
  let files: string[];
  try {
    files = await fs.readdir(refDir);
  } catch {
    return ''; // sem references/ é caso comum, não erro
  }
  const mdFiles = files.filter((f) => f.endsWith('.md')).sort();
  if (mdFiles.length === 0) return '';

  const chunks: string[] = [];
  for (const file of mdFiles) {
    try {
      const content = await fs.readFile(path.join(refDir, file), 'utf-8');
      chunks.push(`#### ${file}\n\n${content.trim()}`);
    } catch {
      // ignore
    }
  }
  return chunks.join('\n\n');
}

export async function listAgents(): Promise<AgentName[]> {
  const files = await fs.readdir(AGENTS_DIR);
  return files
    .filter((f) => f.startsWith('comms-') && f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, '') as AgentName);
}
