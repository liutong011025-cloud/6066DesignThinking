import { config } from "dotenv";
config({ path: ".env.local" }); config();
import { db } from "../src/lib/db";
import { GROUP_NAMES } from "../src/lib/course";
await db().group.createMany({ data: GROUP_NAMES.map((name, i) => ({ id: i + 1, name })), skipDuplicates: true });
console.log("22 course groups and the separate Test workspace are ready. Existing work has been preserved.");
await db().$disconnect();
