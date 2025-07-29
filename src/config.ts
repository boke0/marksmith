import * as fs from 'fs';

export type CliConfig = {
  targets: Array<string>;
}

export const loadConfig = () => {
  let cliConfigFile = '{}';
  try{
    cliConfigFile = fs.readFileSync(`./repocks.config.json`, 'utf-8')
  }catch{}
  return {
    targets: [
      "~/.repocks/**/*.md",
      "./docs/**/*.md",
    ],
    ...JSON.parse(cliConfigFile)
  }
}
