import { PrismaClient } from "@prisma/client";

const globalForPrisma=globalThis as unknown as {prisma?:PrismaClient}

let prisma:PrismaClient;

if(globalForPrisma.prisma){
    prisma=globalForPrisma.prisma;
}else{
    prisma=new PrismaClient({
        log:["warn","error"],
    })
}

if (process.env.Node_ENV !== "production"){
    globalForPrisma.prisma=prisma;
}

export {prisma}