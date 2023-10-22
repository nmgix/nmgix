import fetch from "node-fetch";
import fs from "fs";
import "dotenv/config";
import { createCanvas, loadImage, registerFont } from "canvas";
registerFont("fonts/Gilroy-Heavy.ttf", { family: "Gilroy Heavy" });
registerFont("fonts/Gilroy-Regular.ttf", { family: "Gilroy Regular" });

import { Description, GithubReposResponse, GithubReposResponseRepository, ProgramParams } from "./types";
import { formatTitle } from "./title";

let fetchParams = {
  method: "GET",
  headers: {
    Accept: "application/json",
    Authorization: `Bearer ${process.env.PUBLIC_ACCESS_TOKEN}`
  }
};

let params: ProgramParams = {
  user: "nmgix",
  card: {
    cardSize: { width: 200, height: 200 },
    text: {
      largeTextLineHeight: 24,
      smallTextLineHeight: 14,
      subtitleModifier: -22
    }
  },
  screen: {
    screenSize: { width: 900, height: 991 }
  },
  testMode: true
};

async function main(): Promise<void> {
  console.time("Screen generating took");

  let repos: GithubReposResponse = (await fetch(
    `https://api.github.com/search/repositories?q=user:${params.user}&sort=updated&order=desc&per_page=4`,
    fetchParams
  ).then(async res => await res.json())) as GithubReposResponse;

  let reposImages = await Promise.all(repos.items.map(async r => await drawCard(r)));
  await drawScreen(reposImages);

  console.timeEnd("Screen generating took");
  //   добавить public access token в secrets в гит репозитории
  return process.exit(0);
}

main();

async function getCommitsNumber(url: string) {
  let str = url.replace("{/sha}", "?per_page=1&page=1");

  let res = await fetch(str, fetchParams);
  let linkHeader = res.headers.get("link")!.split(",")[1].split("&")[1];
  return Number(linkHeader.replace(/\D/g, ""));
}

async function drawScreen(reposImages: Buffer[]) {
  const canvas = createCanvas(params.screen.screenSize.width, params.screen.screenSize.height);
  const ctx = canvas.getContext("2d");

  await loadImage("default_images/screen.png").then(image => {
    ctx.drawImage(image, 0, 0);
  });

  await reposImages.forEach(async (repoImageBuffer, index) => {
    await loadImage(repoImageBuffer).then(image => {
      let dx: number;
      //   мне лень считать, да и так проще понять расстановку
      switch (index) {
        case 0:
          dx = 30;
          break;
        case 1:
          dx = 240;
          break;
        case 2:
          dx = 450;
          break;
        case 3:
          dx = 660;
          break;
        default:
          dx = 30;
          break;
      }

      ctx.drawImage(image, dx, 728);
    });
  });

  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync("./generated_images/screen.png", buffer);
}

async function drawCard(info: GithubReposResponseRepository) {
  let verticalShift = 1;
  const canvas = createCanvas(params.card.cardSize.width, params.card.cardSize.height);
  const ctx = canvas.getContext("2d");

  //   первый этап, загружаем дефолтное изображения фона
  await loadImage("default_images/emptyframe.png").then(image => {
    ctx.drawImage(image, 0, 0);
  });

  //   дальше по этому репозиторию сделать запрос чтобы найти папку .git.content
  const requestLink = `${info.url}/contents/.git.content`;
  const imageRequest = await fetch(`${requestLink}/profile_card.png`, fetchParams);
  const descriptionRequest = await fetch(`${requestLink}/profile_description.json`, fetchParams);
  // если есть фоновое изображение
  if (imageRequest.status === 200) {
    const imageBuffer = Buffer.from(((await imageRequest.json()) as { content: string }).content, "base64");
    await loadImage(imageBuffer).then(image => {
      ctx.drawImage(image, 3, 3);
    });
  }

  if (descriptionRequest.status === 404) {
    // если нет .git.content, то просто имя репозитория
    ctx.font = '24px "Gilroy Heavy"';

    const text = formatTitle(info.name);
    ctx.fillText(text[0], 16, 33, params.card.cardSize.width - 16);
    verticalShift++;
    if (text[0] !== text[1] && text[1]) {
      ctx.fillText(text[1], 16, 33 + params.card.text.largeTextLineHeight);
      verticalShift++;
    }
  }
  if (descriptionRequest.status === 200) {
    let description: Description = JSON.parse(
      Buffer.from(((await descriptionRequest.json()) as { content: string }).content, "base64").toString("utf8")
    );
    // главный заголовок
    ctx.font = '24px "Gilroy Heavy"';
    const firstTitle = formatTitle(description.ruName);
    ctx.fillText(firstTitle[0], 16, 33, params.card.cardSize.width - 16);
    verticalShift++;
    if (firstTitle[0] !== firstTitle[1] && firstTitle[1]) {
      ctx.fillText(firstTitle[1], 16, 33 + params.card.text.largeTextLineHeight);
      verticalShift++;
    }

    // подзаголовок
    ctx.font = '18px "Gilroy Regular"';
    const secondTitle = formatTitle(description.engName);
    ctx.fillText(secondTitle[0], 16, 33 * verticalShift + params.card.text.subtitleModifier, params.card.cardSize.width - 16);
    verticalShift++;
    if (secondTitle[0] !== secondTitle[1] && secondTitle[1]) {
      ctx.fillText(secondTitle[1], 16, 33 * verticalShift + params.card.text.largeTextLineHeight + params.card.text.subtitleModifier);
      verticalShift++;
    }
  }

  await writeCommits();

  // возвращение готового канваса в виде буфера
  const buffer = canvas.toBuffer("image/png");
  return buffer;

  async function writeCommits() {
    let commits = await getCommitsNumber(info.commits_url);

    ctx.font = '16px "Gilroy Regular"';
    ctx.fillText(`${commits} commit${commits > 1 ? "s" : ""}`, 16, 180, params.card.cardSize.width - 16);
  }
}
