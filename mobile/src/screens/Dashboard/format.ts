export function formatAttackId(attackId: string | null): string {
  return attackId ?? 'no technique matched';
}
