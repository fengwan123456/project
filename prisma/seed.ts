import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { SEED_VENUES } from "../src/lib/seed-data/venues";

const prisma = new PrismaClient();

async function main() {
  // 清空旧数据（先清引用表，再清被引用表）
  await prisma.smsCode.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.planItem.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.activity.deleteMany();

  await prisma.activity.createMany({
    data: SEED_VENUES.map((v) => ({
      ...v,
      tags: v.tags.join(","),
    })),
  });

  const count = await prisma.activity.count();
  console.log(`Seeded ${count} activities.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
