import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const dataset1 = await prisma.dataset.create({
    data: {
      title: "Test Dataset",
    }
  })
  const dataset2 = await prisma.dataset.create({
    data: {
      title: "M+G Fuglík",
    }
  })
  /* const item1 =  */await prisma.item.create({
    data: { title: 'Bohumín Kubišta', description: 'Malíř a město.', datasets: {
      connect: [{id: dataset1.id}, {id: dataset2.id}]
    }},
  })
  /* const item2 =  */await prisma.item.create({
    data: { title: 'Marcel Makrela', description: 'Husky reality.' , datasets: {
      connect: [{id: dataset1.id}, {id: dataset2.id}]
    }},
  })
  /* const item3 =  */await prisma.item.create({
    data: { title: 'Radek Burgerový Poradce', description: 'Husky reality.' , datasets: {
      connect: [{id: dataset1.id}, {id: dataset2.id}]
    }},
  })
  /* const item4 =  */await prisma.item.create({
    data: { title: 'Michal Míchačka', description: 'Michal Fuglík Černění.' , datasets: {
      connect: [{id: dataset1.id}, {id: dataset2.id}]
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
