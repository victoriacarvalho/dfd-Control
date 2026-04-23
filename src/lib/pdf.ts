import { extractText } from "unpdf";

export async function extractTextFromPDF(buffer: Uint8Array) {
  try {
    const result = await extractText(buffer);
    return result.text;
  } catch (error) {
    console.error("Erro ao extrair PDF:", error);
    throw new Error("Falha ao ler PDF");
  }
}
