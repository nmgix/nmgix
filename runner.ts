import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import "dotenv/config";

import { registerFont } from "canvas";
registerFont("fonts/Gilroy-Heavy.ttf", { family: "Gilroy Heavy" });
registerFont("fonts/Gilroy-Regular.ttf", { family: "Gilroy Regular" });

import { fetchParams, GithubReposResponse, paths, ProgramParams } from "./utils/types";
import { drawCard, drawScreen } from "./utils/draw";

// .env → PUBLIC_ACCESS_TOKEN=ghp_************************************
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
  }
};

(async function main(): Promise<void> {
  console.time("Screen generating took");

  let repos: GithubReposResponse = (await fetch(
    `https://api.github.com/search/repositories?q=user:${params.user}&sort=updated&order=desc&per_page=5`,
    fetchParams
  ).then(async res => await res.json())) as GithubReposResponse;

  let reposImages = await Promise.all(repos.items.filter(repo => repo.name !== params.user).map(async repo => await drawCard(repo, params)));
  const resultBuffer = await drawScreen(reposImages, params).then(buffer => {
    console.timeEnd("Screen generating took");
    return buffer;
  });

  fs.writeFileSync(path.join(__dirname, ...paths.screenStore), resultBuffer);
  return process.exit(0);
})();
