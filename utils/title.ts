// https://blog.logrocket.com/creating-saving-images-node-canvas/

const maxCharacters = 14;

const getMaxNextLine = (input: string, maxChars = maxCharacters) => {
  const allWords = input.split(/[ -]/).filter(Boolean);
  // Find the index in the words array at which we should stop or we will exceed
  // maximum characters.
  // @ts-ignore
  const lineIndex = allWords.reduce((prev, cur, index) => {
    // @ts-ignore
    if (prev?.done) return prev;
    // @ts-ignore
    const endLastWord = prev?.position || 0;
    const position = endLastWord + 1 + cur.length;
    return position >= maxChars ? { done: true, index } : { position, index };
  });
  // Using the index, build a string for this line ...
  // @ts-ignore
  const line = allWords.slice(0, lineIndex.index).join(" ");
  // And determine what's left.
  // @ts-ignore
  const remainingChars = allWords.slice(lineIndex.index).join(" ");
  // Return the result.
  return { line, remainingChars };
};

export const formatTitle = (title: string) => {
  let output = [];
  if (title.length >= maxCharacters * 2) {
    const firstLine = getMaxNextLine(title);
    const secondLine = getMaxNextLine(firstLine.remainingChars);
    output = [firstLine.line];
    let fmSecondLine = secondLine.line;
    if (secondLine.remainingChars.length > 0) fmSecondLine += " ...";
    output.push(fmSecondLine);
  } else if (title.length >= maxCharacters) {
    const firstLine = getMaxNextLine(title, title.length / 2);
    output = [firstLine.line, firstLine.remainingChars];
  } else {
    output = [title];
  }

  return output;
};
