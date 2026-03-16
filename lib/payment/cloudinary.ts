type CloudinaryUploadResponse = {
  secure_url?: string;
  public_id?: string;
};

export async function uploadToCloudinary(file: Blob): Promise<CloudinaryUploadResponse> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary ayarlari eksik.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return (await response.json()) as CloudinaryUploadResponse;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error("Cloudinary upload failed: " + message);
  }
}
