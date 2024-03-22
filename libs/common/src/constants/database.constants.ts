export const DATABASE_NAME = {
  ADMIN: process.env.ADMIN_DB_NAME,
  USER: process.env.COMMON_DB_NAME,
} as const;
export type DataBaseName = (typeof DATABASE_NAME)[keyof typeof DATABASE_NAME];
