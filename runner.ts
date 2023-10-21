import { GithubReposResponse } from "./types";

let fetchParams = {
  method: "GET",
  headers: {
    Accept: "application/json"
  }
};

// можно через github variables ник задавать, но мне лень
let params = {
  user: "nmgix"
};

async function main(): Promise<void> {
  let repos: GithubReposResponse = await fetch(
    `https://api.github.com/search/repositories?q=user:${params.user}&sort=updated&order=desc`,
    fetchParams
  ).then(res => res.json());
  //   let idk = await getCommitsNumber(repos.items[0].commits_url);
  //   console.log(idk);
}

main();

async function getCommitsNumber(url: string): Promise<number> {
  // да можно было как query params, мне лень
  let str = url.replace("{/sha}", "?per_page=1&page=1");

  let res = await fetch(str, fetchParams);
  let linkHeader = res.headers.get("link")!.split(",")[1].split("&")[1];
  return Number(linkHeader.replace(/\D/g, ""));
}
