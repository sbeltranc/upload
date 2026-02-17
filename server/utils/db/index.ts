import { drizzle } from 'drizzle-orm/node-postgres';

const config = useRuntimeConfig();

export default drizzle(config.databaseUrl);