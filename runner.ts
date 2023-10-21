import { GithubReposResponse } from "./types";

let fetchParams = {
  method: "GET",
  headers: {
    Accept: "application/json"
  }
};

let params = {
  user: "nmgix"
};

async function main(): Promise<void> {
  let repos: GithubReposResponse = await fetch(
    `https://api.github.com/search/repositories?q=user:${params.user}&sort=updated&order=desc&per_page=4`,
    fetchParams
  ).then(res => res.json());
  //   console.log(repos.items.map(i => i.url));

  // юзание темплейта для создания фото (пока что канвас пока прорисходит сборка фотки)
  // очередь обязательно, это ж канвас
  // выбрать добавлять ли изображение на фон размером 200х200
  // выбор добавлять ли крупным русское название (чекнуть .git.content/description.md и там уже какой-то property с названием)
  // выбор добавлять кол-во коммитов (getCommitsNumber)

  // 4 фотки под последние 4 репы
  // собрать все фотки в одну, той же библой в файл generated_images/screen.png
  // закончить функцию, дальше ci/cd сам обновит картинку

  // настроить крон для ci/cd
}

main();

async function getCommitsNumber(url: string): Promise<number> {
  let str = url.replace("{/sha}", "?per_page=1&page=1");

  let res = await fetch(str, fetchParams);
  let linkHeader = res.headers.get("link")!.split(",")[1].split("&")[1];
  return Number(linkHeader.replace(/\D/g, ""));
}
