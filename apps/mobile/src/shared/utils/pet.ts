export function formatAge(birthDate: string | null): string | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const now = new Date();
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 0) return null;
  if (months < 12) return `${months} tháng`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest === 0 ? `${years} tuổi` : `${years} tuổi ${rest} tháng`;
}
