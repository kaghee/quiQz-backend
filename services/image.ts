import pool from "../db"
import { QueryResult } from "pg"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
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
    quizToUpdate.blocks[blockIndex].slides[slideIndex].images.push(url)

    await pool.query("UPDATE quiz SET blocks = $1 WHERE id = $2", [
      JSON.stringify(quizToUpdate.blocks),
      quizToUpdate.id,
    ])

    console.log("Image url added to quiz object.")
  }
}

/** Uploads image to Firebase and updates the quiz in the db
 * to have the image url on the relevant slide.
 * Returns the Firebase url of the uploaded image.
 */
export const uploadImage = async ({
  file,
  path,
  quizTitle,
  slideNo,
  // imageIndex
}: {
  file: Express.Multer.File
  path: string
  quizTitle: string
  slideNo: string
}) => {
  const storageRef = ref(storage, path)

  const snapshot = await uploadBytes(storageRef, file.buffer)
  const url = await getDownloadURL(snapshot.ref)

  addImageToQuizSlide(quizTitle, slideNo, url)

  return url
}
