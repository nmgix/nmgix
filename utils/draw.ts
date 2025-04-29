import fetch from "node-fetch";
import { createCanvas, loadImage } from "canvas";
import { Description, fetchParams, GithubReposResponseRepository, ImagesVars, imageType, paths, ProgramParams } from "./types";
import path from "path";
import { formatTitle } from "./title";
import { getCommitsNumber } from "./git";
import { getEventWordForm, getTextBlocks, getYearsData, trimToFit } from "./parser";
import { JSDOM } from "jsdom";
import fs from "fs";
import drawMultiLine from "canvas-multiline-text";
import * as d3 from "d3";
import { Resvg } from "@resvg/resvg-js";
// import { Rsvg } from "librsvg";
// import fs from "fs";

const yearsVerticalOffset = 8;
const columnVerticalOffset = 27;

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

  // рендер бокового белого окна
  const {
    window: { document }
  } = new JSDOM("<html><body></body></html>");
  await loadImage(await drawBox(document, { width: 210, height: 500 })).then(image => ctx.drawImage(image, 650, 140));

  // получение и рендер информации из data.md
  try {
    const text = fs.readFileSync(path.join(process.cwd(), ...paths.textData), { encoding: "utf8" });
    if (!text || text.length == 0) throw new Error("didn't find data.md to parse info from");
    const textBlocks = getTextBlocks(text);
    if (textBlocks.length === 0) throw new Error("no text blocks found");
    const yearBlocks = getYearsData(textBlocks[0]);
    if (Object.keys(yearBlocks).length == 0) throw new Error("no year blocks found");

    const startPos = { x: 667, y: 173 };
    let verticalOffset = 0;
    const offsets: number[] = [];
    const eventsLength: number[] = [];
    const limitedEventsLength: number[] = [];
    const maxEventsRows = 16;

    Object.keys(yearBlocks).forEach(k => yearBlocks[k as unknown as keyof typeof yearBlocks].reverse());
    const limitedEvents = trimToFit(yearBlocks, maxEventsRows);
    Object.keys(limitedEvents).forEach(k => limitedEvents[k as unknown as keyof typeof limitedEvents].reverse());

    Object.entries(yearBlocks).map(async ([_, events]) => {
      // получить кол-во всего событий в каждом году
      eventsLength.push(events.length);
    });
    Object.entries(limitedEvents).map(async ([year, events]) => {
      // получить лимитированное кол-во событий в году (всего 10, а после алгоритма - 5)
      limitedEventsLength.push(events.length);
      offsets.push(verticalOffset);
      events.forEach(event => {
        ctx.font = '20px "Gilroy Bold"';
        ctx.fillStyle = "#000000";
        ctx.fillText(year, startPos.x, startPos.y + verticalOffset);
        ctx.fillStyle = "#000000";
        drawMultiLine(ctx as unknown as CanvasRenderingContext2D, event, {
          font: "Gilroy Regular",
          lineHeight: 0.91,
          maxFontSize: 12,
          minFontSize: 10,
          rect: { width: 133, height: 29, x: startPos.x + 57, y: startPos.y + verticalOffset - 19 }
        });
        verticalOffset += columnVerticalOffset;
      });

      verticalOffset += yearsVerticalOffset;
    });
    const gradientBoxInstanceBuffer = await loadImage(await drawGradientDownBox(document, { width: 190, height: 60 }));
    offsets.forEach((offset, idx) => {
      const yearEventsLength = eventsLength[idx];
      const limitedYearEventsLength = limitedEventsLength[idx];
      if (yearEventsLength > limitedYearEventsLength) {
        ctx.drawImage(gradientBoxInstanceBuffer, startPos.x, startPos.y + offset - 19);

        ctx.font = '10px "Gilroy Regular"';
        ctx.fillStyle = "#676767";
        const eventsLeft = yearEventsLength - limitedYearEventsLength;

        ctx.fillText(`+${String(eventsLeft)} ${getEventWordForm(eventsLeft)} `, startPos.x + 70, startPos.y + offset - 5);
      }
    });
  } catch (error) {
    console.log(error);
  }

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

export async function drawBox(document: Document, size: { width: number; height: number }) {
  // const boxTop = new Rsvg(path.join(process.cwd(), ...paths.formsFolder))

  const svg = d3
    .select(document)
    .select("body")
    .append("svg")
    .attr("width", size.width)
    .attr("xmlns", "http://www.w3.org/2000/svg")
    .attr("height", size.height);
  svg.append("rect").attr("id", "history").attr("width", size.width).attr("height", size.height).style("fill", "white").attr("rx", 10);
  const svgresult = d3.select(document).select("body").html();
  d3.select(document).select("body").html("");
  return new Resvg(svgresult).render().asPng();
}

async function drawGradientDownBox(document: Document, size: { width: number; height: number }) {
  const svg = d3
    .select(document)
    .select("body")
    .append("svg")
    .attr("width", size.width)
    .attr("xmlns", "http://www.w3.org/2000/svg")
    .attr("height", size.height);

  // Добавим defs и градиент
  const defs = svg.append("defs");
  defs
    .append("linearGradient")
    .attr("id", "fade-white")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "0%")
    .attr("y2", "100%")
    .selectAll("stop")
    .data([
      { offset: "0%", color: "white", opacity: 1 },
      { offset: "100%", color: "white", opacity: 0 }
    ])
    .enter()
    .append("stop")
    .attr("offset", d => d.offset)
    .attr("stop-color", d => d.color)
    .attr("stop-opacity", d => d.opacity);

  // Прямоугольник с градиентом
  svg.append("rect").attr("id", "history").attr("width", size.width).attr("height", size.height).style("fill", "url(#fade-white)");

  const svgresult = d3.select(document).select("body").html();
  d3.select(document).select("body").html("");
  return new Resvg(svgresult).render().asPng();
}
