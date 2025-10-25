class CloudinaryService {
    constructor() {
      // Cloudinary configuration - these should be set in your environment
      this.cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || "your-cloud-name"
      this.uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || "your-upload-preset"
      this.apiKey = process.env.REACT_APP_CLOUDINARY_API_KEY || "your-api-key"
    }
  
    async uploadFile(file) {
      try {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("upload_preset", this.uploadPreset)
        formData.append("cloud_name", this.cloudName)
  
        const response = await fetch(`https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`, {
          method: "POST",
          body: formData,
        })
  
        if (!response.ok) {
          throw new Error("Upload failed")
        }
  
        const data = await response.json()
        return {
          url: data.secure_url,
          publicId: data.public_id,
          originalName: file.name,
        }
      } catch (error) {
        console.error("Cloudinary upload error:", error)
        throw new Error("Failed to upload file to Cloudinary")
      }
    }
  
    async deleteFile(publicId) {
      try {
        // Note: Deletion requires server-side implementation with API secret
        // This is a placeholder for future server-side deletion endpoint
        console.log("Delete file with publicId:", publicId)
        return { success: true }
      } catch (error) {
        console.error("Cloudinary delete error:", error)
        throw new Error("Failed to delete file from Cloudinary")
      }
    }
  }
  
  export default new CloudinaryService()
  