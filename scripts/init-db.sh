#!/bin/bash
cd /vercel/share/v0-next-shadcn
npx prisma migrate dev --name init --skip-generate
npx prisma generate
