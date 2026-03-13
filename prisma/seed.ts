import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import slugify from "slugify";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  const categoriesData = [
    {
      name: "Memecoins General",
      boards: ["Discussion", "New Launches", "Rug Pull Reports"],
    },
    {
      name: "Trading & Speculation",
      boards: ["Price Talk", "Technical Analysis", "DEX Discussion"],
    },
    {
      name: "Development",
      boards: ["Smart Contracts", "Token Creation", "Project Development"],
    },
    {
      name: "Community",
      boards: ["Memes & Culture", "Off-topic", "Introductions"],
    },
    {
      name: "Meta",
      boards: ["Site Feedback", "Announcements"],
    },
  ];

  for (let i = 0; i < categoriesData.length; i++) {
    const cat = categoriesData[i];
    const catSlug = slugify(cat.name, { lower: true, strict: true });
    const category = await prisma.category.upsert({
      where: { slug: catSlug },
      update: {},
      create: {
        name: cat.name,
        slug: catSlug,
        sortOrder: i,
      },
    });

    console.log(`Created category: ${category.name}`);

    for (let j = 0; j < cat.boards.length; j++) {
      const boardName = cat.boards[j];
      const boardSlug = slugify(boardName, { lower: true, strict: true });
      const board = await prisma.board.upsert({
        where: { slug: boardSlug },
        update: {},
        create: {
          name: boardName,
          slug: boardSlug,
          description: `${boardName} board`,
          sortOrder: j,
          categoryId: category.id,
        },
      });

      console.log(`  Created board: ${board.name}`);
    }
  }

  const adminPassword = process.env.ADMIN_PASSWORD || "Admin1234!";
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@memecointalk.org" },
    update: {},
    create: {
      username: "admin",
      email: "admin@memecointalk.org",
      passwordHash: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log(`Created admin user: ${admin.username}`);

  await prisma.forumStats.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      totalMembers: 1,
      totalThreads: 0,
      totalPosts: 0,
      newestMember: "admin",
    },
  });

  console.log("Created ForumStats singleton");
  console.log("Seeding complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
