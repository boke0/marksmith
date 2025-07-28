import * as fs from 'fs';

export type CliConfig = {
  targets: Array<string>;
  port: number;
}

export const loadConfig = () => {
  const cliConfigFile = fs.readFileSync(`./marksmith.config.json`, 'utf-8') ?? '{}'
  return {
    port: 13000,
    targets: [
      "~/.marksmith/**/*.md",
      "./docs/**/*.md",
    ],
    ...JSON.parse(cliConfigFile)
  }
}
