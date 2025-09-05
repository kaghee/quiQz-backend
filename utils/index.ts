import { BlockType } from "../types"

export const normalizeText = (text: string) => {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

export const findSlideInBlocks = (blocks: BlockType[], slideId: string) => {
  let result: { blockIndex: number; slideIndex: number } = {
    blockIndex: -1,
    slideIndex: -1,
  }
  blocks.forEach((currBlock, blockIndex) => {
    const foundSlide = currBlock.slides?.find(
      (slide) => slide.id.toString() === slideId,
    )

    if (currBlock.slides && foundSlide) {
      result = { blockIndex, slideIndex: currBlock.slides.indexOf(foundSlide) }
      return
    }
  })

  return result
}
