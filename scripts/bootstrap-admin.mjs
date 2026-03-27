import prismaPackage from "@prisma/client"

const { PrismaClient } = prismaPackage
const prisma = new PrismaClient()

const validRoles = new Set(["STUDENT", "EDITOR", "TEACHER"])

async function main() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL
  const name = process.env.BOOTSTRAP_ADMIN_NAME || "First Admin"
  const passwordHash = process.env.BOOTSTRAP_ADMIN_PASSWORD_HASH
  const role = (process.env.BOOTSTRAP_ADMIN_ROLE || "TEACHER").toUpperCase()

  if (!email || !passwordHash) {
    throw new Error(
      "Missing BOOTSTRAP_ADMIN_EMAIL or BOOTSTRAP_ADMIN_PASSWORD_HASH in environment."
    )
  }

  if (!validRoles.has(role)) {
    throw new Error("BOOTSTRAP_ADMIN_ROLE must be STUDENT, EDITOR, or TEACHER.")
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      password: passwordHash,
      role,
    },
    create: {
      email,
      name,
      password: passwordHash,
      role,
    },
  })

  console.log(`Bootstrap user ready: ${user.email} (${user.role})`)
}

main()
  .catch((error) => {
    console.error(error.message)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })