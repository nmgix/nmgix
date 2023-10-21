import { GithubReposResponse, GithubReposResponseRepository, ProgramParams, RepositoryInfo } from "./types";
import { createCanvas, loadImage } from "canvas";

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

async function main(): Promise<void> {
  let repos: GithubReposResponse = await fetch(
    `https://api.github.com/search/repositories?q=user:${params.user}&sort=updated&order=desc&per_page=4`,
    fetchParams
  ).then(res => res.json());
  //   console.log(repos.items.map(i => i.url));

  // перед удалением старые файлы удалются (т.е. screen.png, card1.png, card2.png, card3.png, card4.png)

  // юзание темплейта для создания фото (пока что канвас пока прорисходит сборка фотки)
  // очередь обязательно, это ж канвас
  // выбрать добавлять ли изображение на фон размером 200х200
  // выбор добавлять ли крупным русское название (чекнуть .git.content/description.md и там уже какой-то property с названием)
  // выбор добавлять кол-во коммитов (getCommitsNumber)

  // 4 фотки под последние 4 репы
  // собрать все фотки в одну, той же библой в файл generated_images/screen.png
  // закончить функцию, дальше ci/cd сам обновит картинку

  // настроить крон для ci/cd
  console.log(repos.items[0].name);
}

main();

async function getCommitsNumber(url: string): Promise<number> {
  let str = url.replace("{/sha}", "?per_page=1&page=1");

  let res = await fetch(str, fetchParams);
  let linkHeader = res.headers.get("link")!.split(",")[1].split("&")[1];
  return Number(linkHeader.replace(/\D/g, ""));
}

function drawScreen() {}

async function drawCard(info: GithubReposResponseRepository & RepositoryInfo, index: number) {
  const canvas = createCanvas(params.cardSize.width, params.cardSize.height);
  const ctx = canvas.getContext("2d");

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
  }

  //   первый этап, загружаем дефолтное изображения фона
  loadImage("default_images/emptyframe.png").then(image => {
    ctx.drawImage(image, dx, 729);
  });

  //   дальше по этому репозиторию сделать запрос чтобы найти папку .git.content
  const requestLink = `${info.url}/contents/.git.content`;
  const image = await fetch(`${requestLink}/image.png`);
  const imageBuffer = Buffer.from(await image.arrayBuffer());
  const description = await fetch(`${requestLink}/description.md`, fetchParams).then(res => res.json());

  if (imageBuffer.length === 0 || !description) {
    console.log("no side data!");
    // тут имя репы и ниже коммиты
  }
  // тут изображение и потом имена
  //   тут из description.md имя русск и ниже англ

  loadImage("default_images/emptyframe.png").then(image => {
    ctx.drawImage(image, dx, 729);
  });
}
