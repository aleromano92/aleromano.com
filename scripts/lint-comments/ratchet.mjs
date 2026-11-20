export function compareToBaseline(baseline, counts) {
  const files = [...new Set([...Object.keys(baseline), ...Object.keys(counts)])].sort();
  const increased = [];
  const tightened = [];
  for (const file of files) {
    const allowed = baseline[file] ?? 0;
    const actual = counts[file] ?? 0;
    if (actual > allowed) increased.push({ file, allowed, actual });
    if (actual < allowed) tightened.push({ file, allowed, actual });
  }
  return { increased, tightened };
}

export function toBaseline(counts) {
  return Object.fromEntries(
    Object.entries(counts)
      .filter(([, count]) => count > 0)
      .sort(([a], [b]) => a.localeCompare(b)),
  );
}
