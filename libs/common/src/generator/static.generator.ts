import {
  existsSync,
  mkdirSync,
  readdirSync,
  createWriteStream,
  readFileSync,
  rmSync,
} from 'fs';
import JsonToTS from 'json-to-ts';

/**
 * Directory 경로 변수
 */
const StaticDir = 'libs/dao/src/static/';
const JsonDataDir = './static-data/';

/**
 * static entity, repository, module 생성하는 함수
 */
export async function generateStaticData(): Promise<void> {
  if (existsSync(StaticDir)) {
    rmSync(StaticDir, { recursive: true });
  }

  // Static 폴더 생성
  mkdirSync(StaticDir);

  // json 데이터 읽기
  const files = existsSync(JsonDataDir) ? readdirSync(JsonDataDir) : [];

  // dao 생성
  for (const file of files.filter((it) => !isExcludeFile(it))) {
    // data-character.entity 로 파일 이름 만들어 놔서 .를 기준으로 data-character 를 가져 오게끔 함
    const fileName = file.split('.')[0];

    const upperCamelCaseName: string = `Data${fileName}`;

    // 파일 이름을 소문자 대문자 사이에 - 을 넣는게 $1-$2라는 뜻
    // ex) ArenaBot.json -> data-arena-bot.json 으로 만들기 위해서 사용
    const lowerHyphenCaseName: string = `data-${fileName
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase()}`;

    createFolder(lowerHyphenCaseName);
    createEntity(lowerHyphenCaseName, upperCamelCaseName, fileName);
    createRepository(lowerHyphenCaseName, upperCamelCaseName, fileName);
  }

  // Static 모듈 생성
  createStaticModule(files);
}

/**
 * 특정 json 파일 제외
 */
export function isExcludeFile(fileName: string): boolean {
  return ['sample.json'].includes(fileName);
}

/**
 * static 폴더 or 하위 폴더 없을때 생성
 */
function createFolder(directoryName: string) {
  const directory = `${StaticDir}${directoryName}`;

  if (!existsSync(directory)) {
    mkdirSync(directory);
  }
}

/**
 * entity 파일 생성
 */
function createEntity(
  lowerHyphenCaseName: string,
  upperCamelCaseName: string,
  fileName: string,
): void {
  const path = `${StaticDir}${lowerHyphenCaseName}/${lowerHyphenCaseName}.entity.ts`;
  const fsStream = createWriteStream(path);

  // json 파일 읽고 parsing
  const jsonFile = readFileSync(`${JsonDataDir}${fileName}.json`, 'utf8');
  const jsonData = JSON.parse(jsonFile);

  const typescriptInterfaces: string[] = JsonToTS(jsonData);

  typescriptInterfaces.forEach((typescriptInterface) => {
    const classString = typescriptInterface
      .replace('RootObject', `${upperCamelCaseName}`)
      .replace('interface', 'export class');

    fsStream.write(classString);
  });
  fsStream.write('\n');

  fsStream.end();
}

/**
 * Repository 생성
 */
function createRepository(
  lowerCamelCaseName: string,
  upperCamelCaseName: string,
  fileName: string,
): void {
  const filePath = `${StaticDir}${lowerCamelCaseName}/${lowerCamelCaseName}.repository.ts`;
  const fsStream = createWriteStream(filePath);

  const repositoryCode = `import { Injectable, Logger } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { readFileSync } from 'fs';
import { ${upperCamelCaseName} } from '@libs/dao/static/${lowerCamelCaseName}/${lowerCamelCaseName}.entity';

@Injectable()
export class ${upperCamelCaseName}Repository {
  items: Record<number, ${upperCamelCaseName}> = {};

  constructor() {
    this.load();
  }

  private _getJsonData(): string {
    try {
      return readFileSync('./static-data/${fileName}.json', 'utf-8');
    } catch (e) {
      Logger.error(e.message);
    }
  }

  load(): void {
    const json = this._getJsonData();
    if (!json) return;

    const data = JSON.parse(json);

    this.items = Object.fromEntries(
      data.map((it) => [it.ID, plainToInstance(${upperCamelCaseName}, it)]),
    );
  }

  values(): ${upperCamelCaseName}[] {
    return Object.values(this.items);
  }

  findById(id: number): ${upperCamelCaseName} {
    return this.items[id];
  }

  findByIdIn(ids: number[]): ${upperCamelCaseName}[] {
    return ids.map((id) => this.items[id]).filter((it) => !!it);
  }
}
`;

  fsStream.write(repositoryCode);

  fsStream.end();
}

/**
 * static module 생성
 */
function createStaticModule(files: string[]) {
  const fsStream = createWriteStream(`${StaticDir}static.module.ts`);

  const repositories = files
    .filter((it) => !isExcludeFile(it))
    .map((file) => `Data${file.split('.')[0]}Repository,`)
    .join('\n    ');

  const staticRepositoryCode = `import { Module } from '@nestjs/common';
${createImportRepositories(files)}

@Module({
  providers: [
    ${repositories}
  ],
  exports: [
    ${repositories}
  ],
})
export class StaticModule {}
`;

  fsStream.write(staticRepositoryCode);
  fsStream.end();
}

/**
 * Static Module Import 부분
 */
function createImportRepositories(files: string[]) {
  return files
    .filter((it) => !isExcludeFile(it))
    .map((file) => {
      const fileName = file.split('.')[0];
      const upperCamelCaseName = `Data${fileName}`;
      const lowerHyphenCaseName = `data-${fileName
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .toLowerCase()}`;

      return `import { ${upperCamelCaseName}Repository } from '@libs/dao/static/${lowerHyphenCaseName}/${lowerHyphenCaseName}.repository';`;
    })
    .join('\n');
}

generateStaticData().then();
