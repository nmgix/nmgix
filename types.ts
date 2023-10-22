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
  testMode: boolean;
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
