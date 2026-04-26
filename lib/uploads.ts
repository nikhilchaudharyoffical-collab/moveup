export async function processUpload(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  return {
    buffer,
    mimeType: file.type,
    originalName: file.name,
  };
}

