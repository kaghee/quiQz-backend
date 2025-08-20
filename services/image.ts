import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { storage } from "../firebase"

export const uploadImage = async (file: Express.Multer.File, path: string) => {
  const storageRef = ref(storage, path)

  const snapshot = await uploadBytes(storageRef, file.buffer)
  const url = await getDownloadURL(snapshot.ref)

  return url
}
