import { PrismaClient } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";

declare global {
  var prisma: PrismaClient | undefined;
}

if (!global.prisma) {
  global.prisma = new PrismaClient();
} else if (process.env.NODE_ENV != "production") {
  global.prisma.$disconnect();
  global.prisma = new PrismaClient();
}

const prisma = global.prisma;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // @ts-expect-error
  const table = prisma[req.query.table as string];
  if (!table) {
    res.status(404).end();
    return;
  }
  try {
    switch (req.method) {
      case "POST":
        const {id, ...data} = req.body;
        res.json(
          await table.upsert({
            create: data,
            update: data,
            where: {id},
          })
        );
        break;
      case "GET":
        if (req.query.id) {
          res.json(
            await table.findUnique({
              where: {id: req.query.id},
            })
          );
        } else {
          res.json(await table.findMany());
        }
        break;
      case "DELETE":
        res.json(
          await table.delete({
            where: {id: req.query.id},
          })
        );
        break;
      default:
        res.status(501).end();
        break;
    }
  } catch (error: any) {
    res.status(400).send(error.message ?? error);
  }
}
