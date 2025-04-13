import { createCanvas, loadImage } from "canvas";
import { Description, fetchParams, GithubReposResponseRepository, ImagesVars, imageType, paths, ProgramParams } from "./types";
import path from "path";
import { formatTitle } from "./title";
import { getCommitsNumber } from "./git";

export async function drawScreen(reposImages: Buffer[], params: ProgramParams) {
  const canvas = createCanvas(params.screen.screenSize.width, params.screen.screenSize.height);
  const ctx = canvas.getContext("2d");

  // создание изображения, фона
  let windowImage = await loadImage(path.join(process.cwd(), ...paths.defaultRepoImage)).catch(err => {
    console.log("Ошибка получения template: " + err);
    throw new Error("Изображение - template не найдено");
  });
  ctx.drawImage(windowImage, 0, 0);

  // рендер готовых картинок
  // ↓ этот await обязательный иначе промисы дискарднутся (улетят в помойку)
  await reposImages.forEach(async (repoImageBuffer, index) => {
    await loadImage(repoImageBuffer).then(image => {
      let placementSet = [30, 240, 450, 660];
      let x = placementSet[index] ?? 30;
      let y = 722;
      ctx.drawImage(image, x, y);
    });
  });

  //   установка текущей даты обновления изображения
  const currentDate = new Date();
  const timeZone = "Europe/Moscow";
  const formattedDateTime = new Intl.DateTimeFormat("ru-RU", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone
  }).format(currentDate);
  ctx.font = '14px "Gilroy Regular"';
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(`Обновлено: ${formattedDateTime} (UTC +3)`, 33, 938);

  return canvas.toBuffer(imageType);
}

export async function drawCard(info: GithubReposResponseRepository, params: ProgramParams) {
  const canvas = createCanvas(params.card.cardSize.width, params.card.cardSize.height);
  const ctx = canvas.getContext("2d");

  // загружаем дефолтное изображения фона
  await loadImage(path.join(process.cwd(), ...paths.emptyframeRepoImage)).then(image => {
    ctx.drawImage(image, 0, 0);
  });

  // дальше по этому репозиторию сделать запрос чтобы найти папку .git.content
  const requestLink = `${info.url}/contents/.git.content`;
  const imageRequest = await fetch(`${requestLink}/profile_card.png`, fetchParams);
  const descriptionRequest = await fetch(`${requestLink}/profile_description.json`, fetchParams);
  const languages: { [x: string]: number } = await fetch(`${info.url}/languages`).then(res => res.json());

  // если есть фоновое изображение
  if (imageRequest.status === 200) {
    const imageBuffer = Buffer.from(((await imageRequest.json()) as { content: string }).content, "base64");
    await loadImage(imageBuffer).then(image => {
      ctx.drawImage(image, 3, 3);
    });
  }

  let verticalShift = 1;

  const projectDescriptionFound = descriptionRequest.status === 200;
  let projectDescription: Description = {} as Description;
  if (projectDescriptionFound) {
    const buffer = (await descriptionRequest.json()) as { content: string };
    if (buffer) projectDescription = JSON.parse(Buffer.from(buffer.content, "base64").toString("utf8")) ?? { ruName: info.name };
  }
  // главный заголовок
  const firstTitle = formatTitle(projectDescription?.ruName ?? info.name);
  ctx.font = '24px "Gilroy Heavy"';
  ctx.fillText(firstTitle[0], 16, 33, params.card.cardSize.width - 16);
  verticalShift++;
  if (!!firstTitle[1] && firstTitle[0] !== firstTitle[1]) {
    ctx.fillText(firstTitle[1], 16, 33 + params.card.text.largeTextLineHeight);
    verticalShift++;
  }
  if (projectDescriptionFound) {
    // подзаголовок
    const secondTitle = formatTitle(projectDescription?.engName ?? undefined);
    ctx.font = '18px "Gilroy Regular"';
    ctx.fillText(secondTitle[0], 16, 33 * verticalShift + 2 * verticalShift + params.card.text.subtitleModifier, params.card.cardSize.width - 16);
    if (secondTitle[0] !== secondTitle[1] && secondTitle[1]) {
      ctx.fillText(
        secondTitle[1],
        16,
        33 * verticalShift + 3 * verticalShift + params.card.text.smallTextLineHeight + params.card.text.subtitleModifier
      );
    }
  }

  let invertedVerticalShift = 0;

  Object.keys(languages)
    .slice(0, 4)
    .forEach(async lang => {
      let icon =
        lang.toLowerCase() in ImagesVars
          ? path.join(process.cwd(), paths.iconFolder[0], ImagesVars[lang.toLowerCase() as keyof typeof ImagesVars])
          : undefined;
      if (!icon) return;
      await loadImage(icon).then(image => {
        ctx.drawImage(image, 170, 170 - 25 * invertedVerticalShift);
        invertedVerticalShift++;
      });
    });

  await (async function writeCommits() {
    let commits = await getCommitsNumber(info.commits_url);
    ctx.font = '16px "Gilroy Regular"';
    ctx.fillText(`${commits} commit${commits > 1 ? "s" : ""}`, 16, 180, params.card.cardSize.width - 16);
  })();

  return canvas.toBuffer(imageType);
}
