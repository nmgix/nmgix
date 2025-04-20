export const getTextBlocks = (text: string) => {
  return text.split(/(?=\[[^\]]+\])/);
};

export const getYearsData = (textBlock: string) => {
  const yearBlocks: Record<number, string[]> = {};
  let currentYear: number | null = null;

  textBlock.split("\n").forEach(line => {
    line = line.trim();

    // Если это год
    const yearMatch = line.match(/^>\s*(\d{4})$/);
    if (yearMatch) {
      currentYear = parseInt(yearMatch[1], 10);
      yearBlocks[currentYear] = [];
      return;
    }

    // Если это строка с пунктом
    const entryMatch = line.match(/^\d+\.\s+(.*)/);
    if (entryMatch && currentYear !== null) {
      yearBlocks[currentYear].push(entryMatch[1]);
    }
  });

  return yearBlocks;
};
