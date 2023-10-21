import { Description, GithubReposResponse, GithubReposResponseRepository, ProgramParams } from "./types";
import { createCanvas, loadImage, registerFont } from "canvas";
import fs from "fs";
registerFont("fonts/Gilroy-Heavy.ttf", { family: "Gilroy Heavy" });
registerFont("fonts/Gilroy-Regular.ttf", { family: "Gilroy Regular" });

let fetchParams = {
  method: "GET",
  headers: {
    Accept: "application/json"
  }
};

let params: ProgramParams = {
  user: "nmgix",
  cardSize: { width: 200, height: 200 },
  screenSize: { width: 900, height: 991 }
};

// let verticalShift = 0;

async function main(): Promise<void> {
  let repos: GithubReposResponse = await fetch(
    `https://api.github.com/search/repositories?q=user:${params.user}&sort=updated&order=desc&per_page=4`,
    fetchParams
  ).then(res => res.json());
  //   console.log(repos.items.map(i => i.url));

  //  // // перед удалением старые файлы удалются (т.е. screen.png, card1.png, card2.png, card3.png, card4.png)

  // юзание темплейта для создания фото (пока что канвас пока прорисходит сборка фотки)
  // очередь обязательно, это ж канвас
  // выбрать добавлять ли изображение на фон размером 200х200
  // выбор добавлять ли крупным русское название (чекнуть .git.content/description.md и там уже какой-то property с названием)
  // выбор добавлять кол-во коммитов (getCommitsNumber)

  // 4 фотки под последние 4 репы
  // собрать все фотки в одну, той же библой в файл generated_images/screen.png
  // закончить функцию, дальше ci/cd сам обновит картинку

  // настроить крон для ci/cd
  await drawCard(repos.items[0], 0);
}

main();

async function getCommitsNumber(url: string): Promise<number> {
  let str = url.replace("{/sha}", "?per_page=1&page=1");

  let res = await fetch(str, fetchParams);
  let linkHeader = res.headers.get("link")!.split(",")[1].split("&")[1];
  return Number(linkHeader.replace(/\D/g, ""));
}

function drawScreen() {
  const canvas = createCanvas(params.cardSize.width, params.cardSize.height);
  const ctx = canvas.getContext("2d");

  // тут загрузить все фотки, края и прочее

  // {
  //     // index берется из цикла (4 карточки расставить)

  //     let dx: number;
  // //   мне лень считать, да и так проще понять расстановку
  // switch (index) {
  //   case 0:
  //     dx = 30;
  //     break;
  //   case 1:
  //     dx = 240;
  //     break;
  //   case 2:
  //     dx = 450;
  //     break;
  //   case 3:
  //     dx = 660;
  //     break;
  // }

  // //   первый этап, загружаем дефолтное изображения фона
  // await loadImage("default_images/emptyframe.png").then(image => {
  //   ctx.drawImage(image, dx, 729);
  // });
  // }
}

async function drawCard(info: GithubReposResponseRepository, index: number) {
  const canvas = createCanvas(params.cardSize.width, params.cardSize.height);
  const ctx = canvas.getContext("2d");

  //   первый этап, загружаем дефолтное изображения фона
  await loadImage("default_images/emptyframe.png").then(image => {
    ctx.drawImage(image, 0, 0);
  });

  //   дальше по этому репозиторию сделать запрос чтобы найти папку .git.content
  const requestLink = `${info.url}/contents/.git.content`;
  const imageRequest = await fetch(`${requestLink}/profile_card.png`, fetchParams);
  const descriptionRequest = await fetch(`${requestLink}/profile_description.json`, fetchParams);

  //  если инфы совсем нет по репозиторию, нет папки .git.content или нет нужных файлов
  if (imageRequest.status === 404 && descriptionRequest.status === 404) {
    ctx.font = '24px "Gilroy Heavy"';
    ctx.fillText(info.name, 16, 33, params.cardSize.width - 16);
    writeCommits();
  } else {
    // если есть фоновое изображение
    if (imageRequest.status === 200) {
      const imageBuffer = Buffer.from((await imageRequest.json()).content, "base64");
      await loadImage(imageBuffer).then(image => {
        console.log(image);
        ctx.drawImage(image, 3, 3);
      });
    }
    // если есть переводы на русск/англ
    if (descriptionRequest.status === 200) {
      let description: Description = await descriptionRequest.json();
      ctx.font = '24px "Gilroy Heavy"';
      ctx.fillText(description.ruName, 16, 33, params.cardSize.width - 16);
      //   нужна функция чтобы устанавливать текст и глобальная переменная которая будет следить за свободным местом для текста
      // при любом сбросе на строчку ниже, при любом новом тексте, она должна инкрементироваться
      // так же нужно следить чтобы не дошло за нижний или правый край
    } else {
      // тут писать просто название репы, ибо перевода нет
      ctx.font = '24px "Gilroy Heavy"';
      ctx.fillText(info.name, 16, 33, params.cardSize.width - 16);
    }

    writeCommits();
  }
  const buffer = canvas.toBuffer("image/png");
  // этот буфер нужно будет возращать
  fs.writeFileSync("./generated_images/card1.png", buffer);

  async function writeCommits() {
    let commits = await getCommitsNumber(info.commits_url);

    ctx.font = '16px "Gilroy Regular"';
    ctx.fillText(`${commits} commit${commits > 1 ? "s" : ""}`, 16, 180, params.cardSize.width - 16);
  }
}
