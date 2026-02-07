export async function downloadFile(url: string, filename: string): Promise<boolean> {
  try {
    const downloadUrl = `/api/download?path=${encodeURIComponent(url)}&name=${encodeURIComponent(filename)}`;
    const response = await fetch(downloadUrl, { credentials: 'include' });
    if (!response.ok) return false;
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
    }, 200);
    return true;
  } catch (error) {
    console.error('Download failed:', error);
    return false;
  }
}

export async function downloadMultipleFiles(files: Array<{ url: string; name: string }>): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;
  for (const file of files) {
    const ok = await downloadFile(file.url, file.name);
    if (ok) success++;
    else failed++;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  return { success, failed };
}
