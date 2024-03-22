import { glob } from 'glob';
import { ResourceWithOptions } from 'adminjs';
import {
  adminTypeOrmModuleOptions,
  commonTypeOrmModuleOptions,
} from '@libs/common/database/typeorm/typeorm-module.options';
import { flatten } from '@nestjs/common';

export class ResourceProvider {
  /**
   * 전체 리소스 가져오는 코드
   */
  static async getResources(
    resourceWithOptions?: ResourceWithOptions[],
  ): Promise<ResourceWithOptions[]> {
    /**
     * 리소스 옵션 object 로 parsing
     */
    const resourceOptions = Object.fromEntries(
      (resourceWithOptions || []).map((it) => [it.resource.name, it]),
    );

    const resources = [];

    // admin
    resources.push(ResourceProvider.getAdminResource(resourceOptions));

    // common
    resources.push(ResourceProvider.getCommonResource(resourceOptions));

    return flatten(await Promise.all(resources));
  }

  static async getAdminResource(
    resourceOptions?: Record<string, ResourceWithOptions>,
  ): Promise<ResourceWithOptions[]> {
    // admin entity 의 경로를 불러오고 glob 으로 파일 목록 조회
    const entityGlob = `${process.cwd()}/${adminTypeOrmModuleOptions.entities}`;

    return await ResourceProvider.getResource(entityGlob, resourceOptions);
  }

  static async getCommonResource(
    resourceOptions?: Record<string, ResourceWithOptions>,
  ): Promise<ResourceWithOptions[]> {
    // admin entity 의 경로를 불러오고 glob 으로 파일 목록 조회
    const entityGlob = `${process.cwd()}/${
      commonTypeOrmModuleOptions.entities
    }`;

    return await ResourceProvider.getResource(entityGlob, resourceOptions);
  }

  /**
   * 리소스 가져오는 함수
   */
  static async getResource(
    entityGlob: string,
    resourceOptions?: Record<string, ResourceWithOptions>,
    database?: string,
  ): Promise<ResourceWithOptions[]> {
    const resources = [];

    const entityPaths = await glob(entityGlob);
    for (const path of entityPaths.sort()) {
      const module = await import(path);

      const fileName = path.split('/').pop();

      const className = fileName
        .split('.')[0]
        .split('-')
        .map((it) => it.charAt(0).toUpperCase() + it.slice(1))
        .join('');

      const resourceName = database
        ? className + database?.slice(-2)
        : className;

      resources.push({
        ...(resourceOptions[className] ?? { options: {} }),
        resource: module[resourceName],
      });
    }

    return resources;
  }
}
