import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const item1 = await prisma.item.create({
    data: { title: 'Bohumín Kubišta', description: 'Malíř a město.' },
  })
  const item2 = await prisma.item.create({
    data: { title: 'Marcel Makrela', description: 'Husky reality.' },
  })
  await prisma.dataset.create({
    data: {
      items: {
        connect: [{ id: item1.id }, { id: item2.id }],
      }
    }
  })
}

main()
  .then(() => {
    console.log('Seed data inserted')
    return prisma.$disconnect()
  })
  .catch((e) => {
    console.error(e)
    return prisma.$disconnect().finally(() => process.exit(1))
  })
