import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const item1 = await prisma.item.create({
    data: { title: 'Bohumín Kubišta', description: 'Malíř a město.' },
  })
  const item2 = await prisma.item.create({
    data: { title: 'Marcel Makrela', description: 'Husky reality.' },
  })
  const item3 = await prisma.item.create({
    data: { title: 'Radek Burgerový Poradce', description: 'Husky reality.' },
  })
  const item4 = await prisma.item.create({
    data: { title: 'Michal Míchačka', description: 'Michal Fuglík Černění.' },
  })
  await prisma.dataset.create({
    data: {
      title: "Test Dataset",
      items: {
        connect: [{ id: item1.id }, { id: item2.id }, {id: item3.id}],
      },
    }
  })
  await prisma.dataset.create({
    data: {
      title: "M+G Fuglík",
      items: {
        connect: [{ id: item4.id }],
      },
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
