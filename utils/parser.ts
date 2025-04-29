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

export const getContacts = (textBlock: string) => {
  let contacts: { [constactType: string]: string } = {};
  textBlock.split("\n").forEach(line => {
    line = line.trim();
    const [contactType, contactData] = line.split(":");
    if (!!contactType && !!contactData) contacts[contactType] = contactData;
  });
  return contacts;
};

export function trimToFit<T>(data: Record<string, T[]>, maxRows = 16) {
  const keys = Object.keys(data);

  const trimmed: Record<string, T[]> = {};
  const counts = keys.map(k => ({ key: k, count: data[k].length }));

  if (keys.length > maxRows) {
    throw new Error("Слишком много ключей для 16 рядов — минимум по 1 не влезет");
  }

  keys.forEach(k => {
    trimmed[k] = data[k].slice(0, 1);
  });

  let remainingRows = maxRows - keys.length;

  counts.sort((a, b) => b.count - a.count);

  while (remainingRows > 0) {
    for (let i = 0; i < counts.length && remainingRows > 0; i++) {
      const { key } = counts[i];
      const current = trimmed[key].length;
      const available = data[key].length;

      if (current < available) {
        trimmed[key].push(data[key][current]);
        remainingRows--;
      }
    }
  }

  return trimmed;
}

export function getEventWordForm(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return "событие";
  } else if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) {
    return "события";
  } else {
    return "событий";
  }
}
