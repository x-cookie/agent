/** Maps a lesson number to its skill-badge artwork. 12 unique tiers exist for 14
 * lessons — the two most-advanced lessons reuse the highest (most premium) tiers. */
export function badgeImageForLesson(num: number): string {
  const tier = num <= 12 ? num : num === 13 ? 11 : 12;
  return `/badges/badge-tier-${tier}.png`;
}
