import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const dataset1 = await prisma.dataset.create({
    data: {
      title: "Bobby Mandle",
    }
  })
  const dataset2 = await prisma.dataset.create({
    data: {
      title: "M+G Fuglík",
    }
  })
  const dataset3 = await prisma.dataset.create({
    data: {
      title: "Z-lean Koks party",
    }
  })
  const dataset4 = await prisma.dataset.create({
    data: {
      title: "Andrej Kobliž",
    }
  })
  await prisma.item.create({
    data: { title: 'Bohumín Kubišta', description: 'Malíř a město.', datasets: {
      connect: [{id: dataset1.id}, {id: dataset2.id}, {id: dataset3.id}, {id: dataset4.id}]
    }},
  })
  await prisma.item.create({
    data: { title: 'Marcel Makrela', description: 'Fine fish AGRO Jesenice.' , datasets: {
      connect: [{id: dataset1.id}, {id: dataset2.id}, {id: dataset3.id}, {id: dataset4.id}]
    }},
  })
  await prisma.item.create({
    data: { title: 'Radek Burgerový Poradce', description: 'Husky reality.' , datasets: {
      connect: [{id: dataset1.id}, {id: dataset2.id}, {id: dataset3.id}, {id: dataset4.id}]
    }},
  })
  await prisma.item.create({
    data: { title: 'Michal Míchačka', description: 'Michal Fuglík Černění.' , datasets: {
      connect: [{id: dataset1.id}, {id: dataset2.id}, {id: dataset3.id}, {id: dataset4.id}]
    }},
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
