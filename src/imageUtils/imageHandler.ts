import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

// Types
type ImageSource = {
  buffer: Buffer;
  contentType: string;
};

export class ImageHandler {
  private imageUrls: Record<string, string> = {};
  private logger: (level: string, message: string) => void;
  
  constructor(logger: (level: string, message: string) => void) {
    this.logger = logger;
    logger("info", "Removing old autogen folder...");
    const imagesDir = path.join(__dirname, "images", "autogen");
    if (fs.existsSync(imagesDir)) {
      fs.rmSync(imagesDir, { recursive: true, force: true });
    }
  }

  /**
   * Save an image from a URL, file path, or data URL
   */
  async saveImageReference(url: string, appId: string, headers?: Record<string, string>): Promise<string | null> {
    if (!url || typeof url !== "string") {
      throw new Error("Invalid URL provided");
    }

    // Return cached path if already processed
    if (this.imageUrls[url]) {
      return this.imageUrls[url];
    }

    try {
      // Step 1: Get the image buffer and content type
      const imageSource = await this.getImageSource(url, headers);
      
      // Step 2: Process the image (validate and normalize)
      const { buffer, extension } = this.processImage(imageSource);
      
      // Step 3: Save the image to disk
      const fileName = await this.saveImageToDisk(buffer, extension);
      
      // Step 4: Record and return the URL
      const imageUrl = `http://localhost:8891/gen/${appId}/images/autogen/${fileName}`;
      this.imageUrls[url] = imageUrl;
      
      return imageUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger("error", `Failed to process image! ${errorMessage}`);
      console.error("[deskthing-server] Error processing image:", error);
      return null;
    }
  }

  /**
   * Get image data from different sources (URL, file, data URL)
   */
  private async getImageSource(url: string, headers?: Record<string, string>): Promise<ImageSource> {
    // Handle data URLs
    if (url.startsWith("data:")) {
      return this.getImageFromDataUrl(url);
    }
    
    // Handle local file paths
    if (this.isLocalPath(url)) {
      return this.getImageFromFile(url);
    }
    
    // Handle remote URLs
    return this.getImageFromRemoteUrl(url, headers);
  }

  /**
   * Check if a URL is a local file path
   */
  private isLocalPath(url: string): boolean {
    return url.startsWith("file://") || 
           url.startsWith("/") || 
           url.match(/^[a-zA-Z]:\\/) !== null || 
           url.startsWith("./") || 
           url.startsWith("../");
  }

  /**
   * Extract image data from a data URL
   */
  private getImageFromDataUrl(dataUrl: string): ImageSource {
    const matches = dataUrl.match(/^data:([a-z]+\/[a-z0-9-+.]+);base64,(.+)$/i);
    if (!matches) {
      throw new Error("Invalid data URL format");
    }
    const contentType = matches[1];
    const buffer = Buffer.from(matches[2], "base64");
    return { buffer, contentType };
  }

  /**
   * Read image data from a local file
   */
  private async getImageFromFile(filePath: string): Promise<ImageSource> {
    const localPath = filePath.startsWith("file://") ? filePath.slice(7) : filePath;
    try {
      const buffer = await fs.promises.readFile(localPath);
      const contentType = this.detectContentTypeFromBuffer(buffer);
      return { buffer, contentType };
    } catch (err) {
      throw new Error(`Failed to read local file: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Fetch image data from a remote URL with retry mechanism
   */
  private async getImageFromRemoteUrl(url: string, headers?: Record<string, string>): Promise<ImageSource> {
    const maxRetries = 3;
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < maxRetries) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            Accept: "image/*,*/*;q=0.8",
            ...headers,
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        }

        const contentType = response.headers.get("content-type") || "application/octet-stream";
        const arrayBuffer = await response.arrayBuffer();

        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
          throw new Error("Received empty response");
        }

        const buffer = Buffer.from(arrayBuffer);
        return { buffer, contentType };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        attempt++;
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      } finally {
        clearTimeout(timeoutId);
      }
    }

    throw lastError || new Error("Failed to fetch image after multiple attempts");
  }

  /**
   * Process the image: validate content type and determine extension
   */
  private processImage(imageSource: ImageSource): { buffer: Buffer; extension: string } {
    const { buffer, contentType } = imageSource;
    
    // Validate and normalize content type
    let normalizedContentType = contentType;
    if (!contentType.startsWith("image/")) {
      const detectedType = this.detectContentTypeFromBuffer(buffer);
      if (detectedType.startsWith("image/")) {
        normalizedContentType = detectedType;
      } else {
        throw new Error("Invalid or unsupported content type: " + contentType);
      }
    }

    // Determine file extension from MIME type
    let extension = normalizedContentType.split("/").pop()?.toLowerCase() || "jpg";

    // Normalize extension
    extension = this.normalizeExtension(extension);
    
    return { buffer, extension };
  }

  /**
   * Standardize extensions for common formats
   */
  private normalizeExtension(extension: string): string {
    return extension === "jpeg" ? "jpg"
         : extension === "svg+xml" ? "svg"
         : extension === "x-icon" ? "ico"
         : extension === "vnd.microsoft.icon" ? "ico"
         : extension === "unknown" || extension === "octet-stream" ? "jpg"
         : extension;
  }

  /**
   * Detect content type from buffer using magic numbers
   */
  private detectContentTypeFromBuffer(buffer: Buffer): string {
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return "image/jpeg";
    }
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      return "image/png";
    }
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
      return "image/gif";
    }
    if (buffer[0] === 0x42 && buffer[1] === 0x4d) {
      return "image/bmp";
    }
    if (buffer[0] === 0x00 && buffer[1] === 0x00 && buffer[2] === 0x01 && buffer[3] === 0x00) {
      return "image/x-icon";
    }
    
    return "application/octet-stream";
  }

  /**
   * Save image buffer to disk
   */
  private async saveImageToDisk(buffer: Buffer, extension: string): Promise<string> {
    // Generate unique filename
    const uniqueId = crypto.randomUUID();
    const fileName = `${uniqueId}.${extension}`;
    const imagesDir = path.join(__dirname, "images");
    const imagePath = path.join(imagesDir, "autogen", fileName);

    // Ensure images directory exists
    await fs.promises.mkdir(imagesDir, { recursive: true });

    // Write file
    await fs.promises.writeFile(imagePath, buffer);
    
    return fileName;
  }
}
