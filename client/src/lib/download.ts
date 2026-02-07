export async function downloadFile(url: string, filename: string) {
  try {
    const downloadUrl = `/api/download?path=${encodeURIComponent(url)}&name=${encodeURIComponent(filename)}`;
    const response = await fetch(downloadUrl, { credentials: 'include' });
    if (!response.ok) throw new Error('Download failed');
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    }, 100);
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
}

export async function downloadMultipleFiles(files: Array<{ url: string; name: string }>) {
  for (const file of files) {
    try {
      await downloadFile(file.url, file.name);
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch {
    }
  }
}
