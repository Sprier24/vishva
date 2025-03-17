'use client';
import React, { useState, useEffect, useRef } from 'react';

type File = {
  id: string;
  name: string;
  type: string;
  parentId: number | null;
  fileUrl?: string;
  fileType?: string;
};

const GoogleDriveClone = () => {
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'file' | 'photo'>('all');

  // Ref for modal to detect click outside of it
  const modalRef = useRef<HTMLDivElement>(null);
  const modalBackdropRef = useRef<HTMLDivElement>(null); // Ref for modal backdrop

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/file-folder/files');
        const data = await response.json();
        if (data.success) {
          setFiles(data.data);
        } else {
          console.error('Failed to fetch files');
        }
      } catch (error) {
        console.error('Error fetching files:', error);
      }
    };

    fetchFiles();
  }, []);

  const filteredFoldersAndFiles = files
    .filter(
      (item) =>
        (item.parentId === currentFolderId || currentFolderId === null) &&
        (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .filter((item) => {
      if (filter === 'file') {
        return item.fileType !== 'image';
      } else if (filter === 'photo') {
        return item.fileType === 'image';
      }
      return true;
    });

  const handleFolderClick = (folderId: number) => {
    setCurrentFolderId(folderId);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name);
      formData.append('type', 'file');
      formData.append('parentId', currentFolderId ? currentFolderId.toString() : 'null');

      fetch('http://localhost:8000/api/v1/file-folder/upload', {
        method: 'POST',
        body: formData,
      })
        .then((res) => res.json())
        .then((data) => {
          const newFile = {
            ...data.data,
            type: 'file',
            parentId: currentFolderId,
          };

          setFiles((prevFiles) => [
            ...prevFiles,
            newFile,
          ]);
        })
        .catch((error) => {
          console.error('Error uploading file:', error);
        });
    }
  };

  const handleDelete = (fileId: string) => {
    fetch(`http://localhost:8000/api/v1/file-folder/files/${fileId}`, {
      method: 'DELETE',
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          console.log('File deleted successfully');
          setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
          setSelectedFile(null); // Close the modal after deletion
        } else {
          console.log('Failed to delete file');
        }
      })
      .catch(error => {
        console.error('Error deleting file:', error);
      });
  };

  const handleFileClick = (item: File) => {
    setSelectedFile(item);
  };

  const handleModalClose = () => {
    setSelectedFile(null);
  };

  const handleDownload = (file: File) => {
    const downloadLink = document.createElement('a');
    downloadLink.href = `http://localhost:8000/uploads/${file.fileUrl}`;
    downloadLink.download = file.name;
    downloadLink.click();

    setDownloadStatus('Download Started...');
    setTimeout(() => setDownloadStatus(null), 2000);
  };

  // Close the modal if clicked outside the modal content
  const handleClickOutside = (e: React.MouseEvent) => {
    if (modalBackdropRef.current && !modalRef.current?.contains(e.target as Node)) {
      setSelectedFile(null); // Close the modal if clicked outside
    }
  };

  return (
    <div className="google-drive-clone flex h-screen">
      <div className="sidebar w-64 p-4 bg-gray-800 text-white overflow-x-auto">
        <input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-gray-600 text-white p-2 rounded-md w-full mb-4"
        />
        <button
          onClick={() => setCurrentFolderId(null)}
          className="text-white py-2 px-4 rounded-md mb-4 hover:bg-gray-700 w-full text-left"
        >
          &#8592; My Drive
        </button>
        <h3 className="text-lg font-semibold mb-2">Files</h3>

        {/* Filter Buttons */}
        <div className="filter-buttons mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`filter-btn ${filter === 'all' ? 'bg-blue-500' : 'bg-gray-700'} py-2 px-4 rounded-md`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('file')}
            className={`filter-btn ${filter === 'file' ? 'bg-blue-500' : 'bg-gray-700'} py-2 px-4 rounded-md ml-2`}
          >
            Files
          </button>
          <button
            onClick={() => setFilter('photo')}
            className={`filter-btn ${filter === 'photo' ? 'bg-blue-500' : 'bg-gray-700'} py-2 px-4 rounded-md ml-2`}
          >
            Photos
          </button>
        </div>

        {filteredFoldersAndFiles
          .filter((item) => item.type === 'folder')
          .map((folder: File) => (
            <div key={folder.id} className="relative">
              <button
                onClick={() => handleFolderClick(Number(folder.id))}
                className="text-white py-2 px-4 rounded-md mb-2 w-full text-left hover:bg-gray-700"
              >
                📁 {folder.name}
              </button>
            </div>
          ))}

        <input
          type="file"
          id="fileInput"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={() => document.getElementById('fileInput')?.click()}
          className="bg-blue-500 text-white py-2 px-4 rounded-md w-full mt-4 hover:bg-blue-700"
        >
          Upload File
        </button>
      </div>

      {/* Main Content */}
      <div className="main-content flex-1 p-6 bg-gray-900">
        <div className="files flex flex-wrap gap-4 overflow-y-auto max-h-[calc(100vh-120px)] scrollbar-hide">
          {filteredFoldersAndFiles.map((item: File) =>
            item.type === 'folder' ? (
              <div
                key={item.id}
                onClick={() => handleFolderClick(Number(item.id))}
                className="folder w-36 p-4 mb-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600"
              >
                <h3 className="text-white">{item.name}</h3>
              </div>
            ) : (
              <div
                key={item.id}
                onClick={() => handleFileClick(item)}
                className="file w-36 p-4 mb-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600"
              >
                {item.fileType === 'image' ? (
                  <div className="flex flex-col items-center">
                    <img
                      src={`http://localhost:8000/uploads/${item.fileUrl}`}
                      alt={item.name}
                      className="w-32 h-32 object-cover mb-2"
                    />
                    <p className="text-white text-center">{item.name}</p>
                  </div>
                ) : item.fileType === 'video' ? (
                  <video
                    src={`http://localhost:8000/uploads/${item.fileUrl}`}
                    className="w-32 h-32 object-cover mb-2"
                    controls
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="text-white text-center mb-2">
                    <p>📄</p>
                    <h3>{item.name}</h3>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>

      {selectedFile && (
        <div
          className="modal fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center"
          ref={modalBackdropRef}
          onClick={handleClickOutside} // Close modal if clicked outside
        >
          <div
            className="modal-content bg-white p-6 rounded-lg w-3/4 max-w-4xl"
            ref={modalRef}
          >
            {/* Download Button */}
            <button
              onClick={() => handleDownload(selectedFile)}
              className="bg-blue-500 text-white py-2 px-4 rounded-md mt-4 hover:bg-blue-700"
            >
              Download
            </button>

            <button
              onClick={() => handleDelete(selectedFile.id)} // Pass the file's ID here
              className="bg-red-500 text-white py-2 px-4 rounded-md mt-2 hover:bg-red-700"
            >
              Delete
            </button>

            {downloadStatus && (
              <div className="text-green-500 mt-2">{downloadStatus}</div>
            )}

            {selectedFile.fileType === 'image' ? (
              <img
                src={`http://localhost:8000/uploads/${selectedFile.fileUrl}`}
                alt={selectedFile.name}
                className="w-full h-auto"
              />
            ) : selectedFile.fileType === 'video' ? (
              <video
                src={`http://localhost:8000/uploads/${selectedFile.fileUrl}`}
                className="w-full h-auto"
                controls
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="text-black text-center mb-2">
                <p>📄</p>
                <h3>{selectedFile?.name}</h3>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleDriveClone;
