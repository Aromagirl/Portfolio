export const expertiseTags = [
  { id: 'product-design', label: 'Product Design' },
  { id: 'ux-research', label: 'UX Research' },
  { id: 'ui-design', label: 'UI Design' },
  { id: 'development', label: 'Development' },
  { id: 'visual-design', label: 'Visual Design' },
  { id: 'marketing', label: 'Marketing' },
] as const;

export const industryTags = [
  { id: 'fintech', label: 'Fintech' },
  { id: 'cybersecurity', label: 'Cybersecurity' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'ecommerce', label: 'E-commerce' },
  { id: 'gaming', label: 'Gaming' },
] as const;

export const workTagGroups = [
  { id: 'expertise', label: 'Expertise', tags: expertiseTags },
  { id: 'industries', label: 'Industries', tags: industryTags },
] as const;
