import Fastify from "fastify";
import cors from "@fastify/cors";
import "dotenv/config";
import { prisma } from "./db";
import {z} from "zod"
import bcrypt from "bcrypt";

const app = Fastify({ logger: true });
try {
  const u = new URL(process.env.DATABASE_URL ?? "");
  app.log.info({ dbUser: u.username, dbHost: u.host }, "DB target (masked)");
} catch {}
const signupSchema= z.object({
  email:z.string().email().transform((e) => e.trim().toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters"),
  orgName:z.string().trim().min(1).optional(),
})

type SignupInput=z.infer<typeof signupSchema>;
await app.register(cors, { origin: true });

app.get("/healthz", async () => {
  await prisma.$queryRaw`SELECT 1`;
  
  return {ok: true};

});
app.get("/", async () => ({ message: "StripeDisputeShield — API Hello World ✅" }));
app.get("/_envcheck", async () => ({
  hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
  hasRedisUrl: Boolean(process.env.REDIS_URL),
  appBaseUrl: process.env.APP_BASE_URL,
  port: process.env.PORT || 4000
}));



app.get("/version",async()=>{
  return { "name": "StripeDisputeShield API", "version": "0.0.1" }

})

app.post("/auth/signup",async(req,res)=>{
  const parsed=signupSchema.safeParse(req.body);
  if (!parsed.success){
    return res.status(400).send({
      error:"Invalid signup payload",
      issues:parsed.error.flatten(),
    })
  }
  

  const {email,password,orgName}=parsed.data as SignupInput;
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  try{
    const [user,org,member]=await prisma.$transaction(async(tx)=>{
      const user=await tx.user.create({
        data:{
        email,
        password:hashedPassword,
      }

      })

      const org=await tx.organization.create({
        data:{
          name:orgName ?? email.split("@")[0],
          members:{
            create:{
              userId:user.id,
              role:"owner"
            },
          },
          settings:{
            create:{notifyEmail:email},
          }
          
        }
      });
     
      const member=await tx.orgMember.findUniqueOrThrow({
        where:{userId_orgId:{userId:user.id,orgId:org.id}},
      })

    return [user,org,member] as const;
  


});
return res.send({
  user:{id:user.id,email:user.email},
  organization:{id:org.id,name:org.name},
  member:{role:member.role},
});
  }catch(err:any){
     if (err.code === "P2002" && err.meta?.target?.includes("email")) {
    return res.status(409).send({ error: "Email already in use" });
  }
  throw err;
  }
})
const port = Number(process.env.PORT ?? 4000);
app.listen({ port, host: "0.0.0.0" }).then(() => {
  app.log.info(`API listening on http://localhost:${port}`);
});
