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
import { findSlideInBlocks } from "../utils"
import { baseImage, BlockType, ImageMeta } from "../types"

export class ImageDeletionError extends Error {
  constructor(message?: string) {
    super(message)
    this.name = "ImageDeletionError"
  }
}

/** Updates the quiz in the db to have the provided image url
 * on the relevant slide. */
const addImageToQuizSlide = async (
  quizTitle: string,
  slideId: string,
  url: string,
  type: "question" | "answer",
  imageIndex: number,
  imageId: string,
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
      slide["images"] = [{ ...baseImage, id: imageId, url }]
    } else {
      let updatedImages
      const existing = slide.images.find((img: ImageMeta) => img.id === imageId)
      if (existing) {
        updatedImages = slide.images.map((img: ImageMeta) =>
          img?.id === imageId ? { ...img, url } : img,
        )
      } else {
        updatedImages = [
          ...slide.images,
          {
            ...baseImage,
            id: imageId,
            url,
            index: imageIndex,
            type,
          },
        ]
      }

      slide.images = updatedImages
    }

    try {
      await pool.query("UPDATE quiz SET blocks = $1 WHERE id = $2", [
        JSON.stringify(quizToUpdate.blocks),
        quizToUpdate.id,
      ])
      console.info(`Added image ${imageIndex} to ${quizToUpdate.title}`)
    } catch (e) {
      console.error("Quiz update failed.", e)
    }
  }
}

/** Updates the quiz in the db after removing the image url
 * from the relevant slide. */
const deleteImageFromQuizSlide = async (
  quizTitle: string,
  slideId: string,
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
    const updatedImages = slide.images.filter(
      (img: ImageMeta) => img.index !== parseInt(imageIndex),
    )

    const updatedBlocks = quizToUpdate.blocks.map(
      (block: BlockType, bIdx: number) =>
        bIdx === blockIndex
          ? {
              ...block,
              slides: block.slides.map((slide, sIdx) =>
                sIdx === slideIndex
                  ? { ...slide, images: updatedImages }
                  : slide,
              ),
            }
          : block,
    )

    await pool.query("UPDATE quiz SET blocks = $1 WHERE id = $2", [
      JSON.stringify(updatedBlocks),
      quizToUpdate.id,
    ])
  }
}

/** Deletes an image specified by path (without extension)
 *  from the Firebase bucket. */
export const deleteConcreteImage = async (
  filePath: string,
  fileIndex: string,
) => {
  try {
    const firebasePath = filePath.replace("---", "/")
    const storageRef = ref(storage, firebasePath)
    const res = await listAll(storageRef)

    const filesWithIndex = res.items.filter(
      (item) => item.name.split(".")[0] === fileIndex,
    )
    for (const item of filesWithIndex) {
      await deleteObject(item)
      console.info(`Deleted file ${item.fullPath} from the bucket.`)
    }

    const [quizTitle, slideId] = filePath.split("---")
    if (quizTitle && slideId) {
      await deleteImageFromQuizSlide(quizTitle, slideId, fileIndex)
    }
  } catch (e) {
    throw new ImageDeletionError(JSON.stringify(e))
  }
}

/** Checks the Firebase bucket for existing images for the given
 * slide and image index. Deletes any found images for the index.
 */
const deleteImageByIndices = async (
  storageRef: StorageReference,
  imageIndex: string,
) => {
  try {
    const res = await listAll(storageRef)

    const filesWithIndex = res.items.filter(
      (item) => item.name.split(".")[0] === imageIndex,
    )

    for (const item of filesWithIndex) {
      await deleteObject(item)
      console.info(`Deleted ${item.fullPath} from the bucket.`)
    }
  } catch (e) {
    throw new ImageDeletionError(JSON.stringify(e))
  }
}

/** Deletes every image from every folder within the quiz's folder
 * in the Firebase bucket. */
export const deleteQuizFromBucket = async (quizTitle: string) => {
  try {
    const storageRef = ref(storage, `/${quizTitle}/`)
    const res = await listAll(storageRef)
    let deleteCounter = 0

    for (const folder of res.prefixes) {
      const foldersRes = await listAll(folder)
      for (const item of foldersRes.items) {
        await deleteObject(item)
        console.info(`Deleted ${item.fullPath} from the bucket.`)
        deleteCounter++
      }
    }
    return deleteCounter
  } catch (e) {
    console.error(`Failed to delete folder ${quizTitle}.`, e)
    throw new ImageDeletionError(JSON.stringify(e))
  }
}

/** Uploads image to Firebase and updates the quiz in the db
 * to have the image url on the relevant slide.
 * Returns the Firebase url of the uploaded image.
 */
export const uploadImage = async (params: {
  file: Express.Multer.File
  path: string
  fileName: string
  quizTitle: string
  slideNo: string
  imageIndex: string
  imageId: string
}) => {
  const { file, path, fileName, quizTitle, slideNo, imageIndex, imageId } =
    params

  let storageRef = ref(storage, path)
  // Delete images (if any) with the same index
  await deleteImageByIndices(storageRef, imageIndex)

  const filePath = `${path}${fileName}`
  storageRef = ref(storage, filePath)

  // Upload file
  const snapshot = await uploadBytes(storageRef, file.buffer)
  const url = await getDownloadURL(snapshot.ref)
  console.info(`Uploaded ${filePath} to the bucket.`)

  // Update quiz object with new file
  const type = imageIndex.includes("answer-") ? "answer" : "question"

  let index: number = parseInt(imageIndex)
  if (type === "answer") {
    index = parseInt(imageIndex.split("answer-")[1] as string)
  }

  addImageToQuizSlide(quizTitle, slideNo, url, type, index, imageId)

  return url
}

export const getQuizIdByTitle = async (title: string) => {
  const result: QueryResult = await pool.query(
    "SELECT id FROM quiz WHERE title = $1",
    [title],
  )

  return result.rows[0].id
}
