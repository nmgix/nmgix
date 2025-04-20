export enum ImagesVars {
  typescript = "ts.png",
  javascript = "js.png",
  scss = "sass.png",
  sass = "sass.png",
  docker = "docker.png",
  dockerfile = "docker.png",
  html = "html.png"
}

export const paths = {
  defaultRepoImage: ["default_images", "screen.png"],
  emptyframeRepoImage: ["default_images", "emptyframe.png"],

  screenStore: ["generated_images", "screen.png"],

  iconFolder: ["icons"],
  textData: ["data.md"]
};

export const imageType = "image/png";

export let fetchParams = {
  method: "GET",
  headers: {
    Accept: "application/json",
    Authorization: `Bearer ${process.env.PUBLIC_ACCESS_TOKEN}`
  }
};

export type ProgramParams = {
  user: string;
  card: {
    cardSize: CanvasSize;
    text: {
      subtitleModifier: number;
      largeTextLineHeight: number;
      smallTextLineHeight: number;
    };
  };
  screen: {
    screenSize: CanvasSize;
  };
};

export type GithubReposResponse = {
  total_count: number;
  items: GithubReposResponseRepository[];
};

export type GithubReposResponseRepository = {
  name: string;
  html_url: string; // usual url
  description: string;
  url: string; //api url
  topics: string[];
  size: string;
  commits_url: string;
};

// export type RepositoryInfo = { commits: number; tranlationName: string };

export type CanvasSize = { width: number; height: number };
export type Description = { engName: string; ruName: string };
