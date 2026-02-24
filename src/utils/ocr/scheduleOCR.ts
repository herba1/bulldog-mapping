import { createWorker } from "tesseract.js";
import { OCRResult, OCRError } from "@/types/schedule";

const MIN_CONFIDENCE = 40; // Lowered to be more lenient with schedule screenshots
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function validateFile(file: File): OCRError | null {
  if (file.size > MAX_FILE_SIZE) {
    return {
      type: "FILE_TOO_LARGE",
      message: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
    };
  }

  if (!file.type.startsWith("image/")) {
    return {
      type: "INVALID_FORMAT",
      message: "Please upload an image file (PNG, JPG, WebP)",
    };
  }

  return null;
}

export async function extractTextFromImage(
  imageFile: File
): Promise<OCRResult> {
  // Validate file first
  const validationError = validateFile(imageFile);
  if (validationError) {
    throw new Error(validationError.message);
  }

  // Convert file to data URL
  const imageUrl = await fileToDataUrl(imageFile);

  // Create Tesseract worker
  const worker = await createWorker("eng");

  try {
    // Perform OCR
    const { data } = await worker.recognize(imageUrl);

    // Check confidence
    if (data.confidence < MIN_CONFIDENCE) {
      throw new Error(
        `Image quality too low (${Math.round(data.confidence)}% confidence). Please try a clearer image.`
      );
    }

    // Check if any text was found
    if (!data.text.trim()) {
      throw new Error("No text found in image. Please check the image.");
    }

    return {
      text: data.text,
      confidence: data.confidence,
      lines: data.text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0),
    };
  } finally {
    // Always terminate worker to free resources
    await worker.terminate();
  }
}

export { MIN_CONFIDENCE, MAX_FILE_SIZE };
