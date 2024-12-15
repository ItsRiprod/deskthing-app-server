import { describe, beforeEach, it, expect, vi } from 'vitest'
import { DeskThing } from '../src/index'
import * as fs from 'fs'
import * as crypto from 'crypto'

describe("saveImageReferenceFromURL", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn().mockImplementation(() => Promise.resolve({
            ok: true,
            headers: new Headers({
                "content-type": "image/png",
                "content-length": "1000",
            }),
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
        }));
    });

    it("should successfully encode and save an image from URL", async () => {
        const imageUrl = "http://example.com/image.png";
        const mockUUID = "mock-uuid-1234-1234-1234";
        const mkdir = vi.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined);
        const writeFile = vi.spyOn(fs.promises, 'writeFile').mockResolvedValue(undefined);
        vi.spyOn(crypto, 'randomUUID').mockReturnValue(mockUUID);

        const result = await DeskThing.saveImageReferenceFromURL(imageUrl);
        expect(result).toBe(`http://localhost:8891/app/undefined/images/${mockUUID}.png`);
        expect(mkdir).toHaveBeenCalledWith(expect.stringContaining('images'), { recursive: true });
        expect(writeFile).toHaveBeenCalledWith(expect.stringContaining(`${mockUUID}.png`), expect.any(Buffer));
        expect(DeskThing.imageUrls[imageUrl]).toBe(`images/${mockUUID}.png`);
    });

    it("should successfully handle local file paths", async () => {
        const localPath = "/path/to/image.jpg";
        const mockUUID = "mock-uuid-1234-1234-1234";
        const mockBuffer = Buffer.from([0xFF, 0xD8]); // JPEG magic numbers
        
        vi.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined);
        vi.spyOn(fs.promises, 'writeFile').mockResolvedValue(undefined);
        vi.spyOn(fs.promises, 'readFile').mockResolvedValue(mockBuffer);
        vi.spyOn(crypto, 'randomUUID').mockReturnValue(mockUUID);
        
        const result = await DeskThing.saveImageReferenceFromURL(localPath);
        expect(result).toBe(`http://localhost:8891/app/undefined/images/${mockUUID}.jpeg`);
    });    it("should throw error for empty URL", async () => {
        await expect(DeskThing.saveImageReferenceFromURL("")).rejects.toThrow("Invalid URL provided");
    });
    it("should throw error for non-string URL", async () => {
        await expect(DeskThing.saveImageReferenceFromURL(123)).rejects.toThrow("Invalid URL provided");
    });

    it("should handle invalid content type", async () => {
        global.fetch = vi.fn().mockImplementation(() => Promise.resolve({
            ok: true,
            headers: new Headers({
                "content-type": "text/plain",
                "content-length": "1000",
            }),
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
        }));
        
        const result = await DeskThing.saveImageReferenceFromURL("http://example.com/invalid");
        expect(result).toBe(null);
    });

    it("should reuse cached image URL", async () => {
        const imageUrl = "http://example.com/image.png";
        const cachedPath = "images/cached.png";
        DeskThing.imageUrls = { [imageUrl]: cachedPath };

        const result = await DeskThing.saveImageReferenceFromURL(imageUrl);
        expect(result).toBe(cachedPath);
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should handle HTTP error responses", async () => {
        global.fetch = vi.fn().mockImplementation(() => Promise.resolve({
            ok: false,
            status: 404,
        }));
        const result = await DeskThing.saveImageReferenceFromURL("http://example.com/not-found.jpg");
        expect(result).toBe(null);
    });
});