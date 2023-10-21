export type ProgramParams = {
  user: string;
  cardSize: CanvasSize;
  screenSize: CanvasSize;
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
  language: string | string[];
  topics: string[];
  size: string;
  commits_url: string;
};

// export type RepositoryInfo = { commits: number; tranlationName: string };

export type CanvasSize = { width: number; height: number };
export type Description = { engName: string; ruName: string };
