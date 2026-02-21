/**
 * File utilities — helpers for camera and document picker results
 */

export const getFileType = (uri: string): string => {
    const ext = uri.split('.').pop()?.toLowerCase() || '';
    const mimeTypes: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
        bmp: 'image/bmp',
        tiff: 'image/tiff',
        pdf: 'application/pdf',
    };
    return mimeTypes[ext] || 'application/octet-stream';
};

export const getFileName = (uri: string): string => {
    return uri.split('/').pop() || 'file';
};

export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};
