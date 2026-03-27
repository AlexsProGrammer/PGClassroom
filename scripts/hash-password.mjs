import bcrypt from "bcryptjs"

const roundsArg = process.argv.find((arg) => arg.startsWith("--rounds="))
const rounds = roundsArg ? Number(roundsArg.split("=")[1]) : 12
const password = process.argv.slice(2).find((arg) => !arg.startsWith("--"))

if (!password) {
  console.error("Usage: pnpm hash:password -- <plain-password> [--rounds=12]")
  process.exit(1)
}

if (!Number.isInteger(rounds) || rounds < 4 || rounds > 15) {
  console.error("Invalid rounds. Use an integer between 4 and 15.")
  process.exit(1)
}

const hash = bcrypt.hashSync(password, rounds)
console.log(hash)