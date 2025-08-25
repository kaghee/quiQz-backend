import pool from "../db"
import { QueryResult } from "pg"
import {
  ref,
  uploadBytes,
  getDownloadURL,
  listAll,
  StorageReference,
  deleteObject,
} from "firebase/storage"
import { storage } from "../firebase"
import { BlockType } from "../types"

const findSlideInBlocks = (blocks: BlockType[], slideId: string) => {
  let result: { blockIndex: number; slideIndex: number } = {
    blockIndex: -1,
    slideIndex: -1,
  }
  blocks.forEach((currBlock, blockIndex) => {
    const foundSlide = currBlock.slides.find(
      (slide) => slide.id.toString() === slideId,
    )

    if (foundSlide) {
      result = { blockIndex, slideIndex: currBlock.slides.indexOf(foundSlide) }
      return
    }
  })

  return result
}

/** Updates the quiz in the db to have the provided image url
 * on the relevant slide. */
const addImageToQuizSlide = async (
  quizTitle: string,
  slideId: string,
  url: string,
  imageIndex: string,
) => {
  const result: QueryResult = await pool.query(
    "SELECT * FROM quiz WHERE title = $1",
    [quizTitle],
  )
  let quizToUpdate = result.rows[0]

  if (quizToUpdate) {
    const { blockIndex, slideIndex } = findSlideInBlocks(
      quizToUpdate.blocks,
      slideId,
    )
    const slide = quizToUpdate.blocks[blockIndex].slides[slideIndex]
    if (!slide.images) {
      slide["images"] = {}
    }
    slide.images[imageIndex] = url

    await pool.query("UPDATE quiz SET blocks = $1 WHERE id = $2", [
      JSON.stringify(quizToUpdate.blocks),
      quizToUpdate.id,
    ])
  }
}

/** Checks the Firebase bucket for existing images for the given
 * slide and image index. Deletes any found images for the index.
 */
const deleteImageIfExists = async (
  storageRef: StorageReference,
  imageIndex: string,
) => {
  const res = await listAll(storageRef)
  console.log(res.items.map((i) => i.name))

  const filesWithIndex = res.items.filter(
    (item) => item.name.split(".")[0] === imageIndex,
  )

  for (const item of filesWithIndex) {
    await deleteObject(item)
    console.info(`Successfully deleted ${item.fullPath} from the bucket.`)
  }
}

/** Uploads image to Firebase and updates the quiz in the db
 * to have the image url on the relevant slide.
 * Returns the Firebase url of the uploaded image.
 */
export const uploadImage = async ({
  file,
  path,
  fileName,
  quizTitle,
  slideNo,
  imageIndex,
}: {
  file: Express.Multer.File
  path: string
  fileName: string
  quizTitle: string
  slideNo: string
  imageIndex: string
}) => {
  let storageRef = ref(storage, path)
  // Delete images (if any) with the same index
  await deleteImageIfExists(storageRef, imageIndex)

  const filePath = `${path}${fileName}`
  storageRef = ref(storage, filePath)

  // Upload file
  const snapshot = await uploadBytes(storageRef, file.buffer)
  const url = await getDownloadURL(snapshot.ref)

  // Update quiz object with new file
  addImageToQuizSlide(quizTitle, slideNo, url, imageIndex)

  return url
}

export const getQuizIdByTitle = async (title: string) => {
  const result: QueryResult = await pool.query(
    "SELECT id FROM quiz WHERE title = $1",
    [title],
  )

  return result.rows[0].id
}
