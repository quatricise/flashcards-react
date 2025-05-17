import React, { useState } from 'react';

/* I'll gut this file for the actual upload button/place whatever */

function DummyUploadButton() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return alert('Select a file first');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('http://localhost:4000/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const data = await res.json();
      setUploadedUrl(data.url);
      console.log('Uploaded image URL:', data.url);
    } catch (error) {
      console.error(error);
      alert('Upload error');
    }
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={!file}>
        Upload Image
      </button>
      {uploadedUrl && (
        <div>
          <p>Image uploaded:</p>
          <img src={uploadedUrl} alt="Uploaded" style={{ maxWidth: '300px' }} />
        </div>
      )}
    </div>
  );
}

export default DummyUploadButton