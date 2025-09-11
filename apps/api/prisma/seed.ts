import {Prisma, PrismaClient} from "@prisma/client"
import { create } from "domain";

let prisma=new PrismaClient()
const org = await prisma.organization.upsert({
  where: { id: "dev-org" },   // look for this org
  update: {},                 // nothing to update if it exists
  create: {
    id: "dev-org",
    name: "Dev Org",
    settings: {
      create: {
        notifyEmail: "dev@example.com"
      }
    }
  }
});

const user=await prisma.user.upsert({
    where:{email : "dev@user.test"},
    update:{},
    create:{
        email:"dev@user.test",
        password:"hashed-placeholder"
    }
})

const member = await prisma.orgMember.upsert({
  where: { userId_orgId: { userId: user.id, orgId: org.id } }, // composite unique
  update: {},
  create: { userId: user.id, orgId: org.id, role: "owner" }
});

console.log({ org: { id: org.id, name: org.name }, user: { id: user.id, email: user.email }, member });

await prisma.$disconnect();
