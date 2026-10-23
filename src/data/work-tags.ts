export const expertiseTags = [
  { id: 'product-design', label: 'Product Design' },
  { id: 'ux-research', label: 'UX Research' },
  { id: 'ui-design', label: 'UI Design' },
  { id: 'prototyping', label: 'Prototyping' },
  { id: 'design-systems', label: 'Design Systems' },
  { id: 'visual-design', label: 'Visual Design' },
  { id: 'marketing-design', label: 'Marketing Design' },
  { id: 'brand-identity', label: 'Brand Identity' },
  { id: 'development', label: 'Development' },
  { id: 'digital-analytics', label: 'Digital Analytics' },
  { id: 'quality-assurance', label: 'Quality Assurance' }
] as const;

export const industryTags = [
  { id: 'adtech', label: 'AdTech' },
  { id: 'fintech', label: 'Fintech' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'ecommerce', label: 'E-commerce' },
  { id: 'gaming', label: 'Gaming' }
] as const;

export const workTagGroups = [
  { id: 'expertise', label: 'Expertise', tags: expertiseTags },
  { id: 'industries', label: 'Industries', tags: industryTags },
] as const;
