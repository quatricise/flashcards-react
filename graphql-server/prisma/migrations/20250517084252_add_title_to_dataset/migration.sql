/*
  Warnings:

  - Added the required column `title` to the `Dataset` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Dataset" ADD COLUMN     "title" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Image" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ImageToItem" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ImageToItem_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ImageToItem_B_index" ON "_ImageToItem"("B");

-- AddForeignKey
ALTER TABLE "_ImageToItem" ADD CONSTRAINT "_ImageToItem_A_fkey" FOREIGN KEY ("A") REFERENCES "Image"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ImageToItem" ADD CONSTRAINT "_ImageToItem_B_fkey" FOREIGN KEY ("B") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
