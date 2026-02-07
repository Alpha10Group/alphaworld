export async function downloadFile(url: string, filename: string) {
  try {
    const response = await fetch(url, { credentials: 'include' });
    if (!response.ok) throw new Error('Download failed');
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
}
