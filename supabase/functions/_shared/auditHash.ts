function mix32(input: string, seed: number): string {
  let h = seed >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return (h >>> 0).toString(16).toUpperCase().padStart(8, '0');
}

export function computeVoteAuditHash(voteId: string, curso: string): string {
  const normalizedInput = `${String(voteId).trim().toLowerCase()}|${String(curso).trim()}`;
  const partA = mix32(normalizedInput, 0x811c9dc5);
  const partB = mix32(`audit:${normalizedInput}`, 0x9e3779b1);
  const hex12 = `${partA}${partB.slice(0, 4)}`;
  return `VTP-${hex12.slice(0, 4)}-${hex12.slice(4, 8)}-${hex12.slice(8, 12)}`;
}
