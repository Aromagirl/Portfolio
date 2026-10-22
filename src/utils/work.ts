import { getCollection } from 'astro:content';
import { contentAnchorAliases } from '../config/content-anchors';
import type { CollectionEntry } from 'astro:content';

export const projectPath = (project: CollectionEntry<'projects'>) =>
  project.data.casePage ? `/${project.data.casePage}/` : `/work/${project.data.slug}/`;

export const workSectionPath = (project: CollectionEntry<'projects'>, section: CollectionEntry<'workSections'>) =>
  `/work/${project.data.slug}/${section.data.slug}/`;

export async function getWorkSections(project: CollectionEntry<'projects'>) {
  const sections = (await getCollection('workSections', ({ data }) => data.project.id === project.id))
    .sort((a, b) => a.data.order - b.data.order || a.data.slug.localeCompare(b.data.slug));
  if (new Set(sections.map(section => section.data.slug)).size !== sections.length) {
    throw new Error(`Duplicate work section URL for ${project.data.slug}`);
  }
  return sections;
}

export function workSectionAnchors(section: CollectionEntry<'workSections'>): string[] {
  const aliases = contentAnchorAliases[section.id] ?? {};
  return [...new Set([...section.data.legacyAnchors, ...Object.keys(aliases), ...Object.values(aliases).filter(target => !target.startsWith('@'))])];
}
