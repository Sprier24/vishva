'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Image from "next/image";

type File = {
  _id: string;
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
  const modalRef = useRef<HTMLDivElement>(null);
  const modalBackdropRef = useRef<HTMLDivElement>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);

  const getFileImage = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase(); 

    switch (extension) {
      case "pdf":
        return "/file-icons/pdf.png";
      case "doc":
      case "docx":
        return "/file-icons/word.png";
      case "xls":
      case "xlsx":
        return "/file-icons/excel.png";
      case "ppt":
      case "pptx":
        return "/file-icons/ppt.png";
      case "txt":
        return "/file-icons/text.png";
      default:
        return "/file-icons/file.png";
    }
  };

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

  const handleDeleteClick = (fileId: string) => {
    setFileToDelete(fileId);
    setIsDeleteDialogOpen(true);
    setSelectedFile(null);
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;

    try {
      const response = await fetch(`http://localhost:8000/api/v1/file-folder/files/${fileToDelete}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setFiles(prevFiles => prevFiles.filter(file => file._id !== fileToDelete));
        setIsDeleteDialogOpen(false);
        setFileToDelete(null);
      } else {
        console.error('Failed to delete file');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleFileClick = (item: File) => {
    setSelectedFile(item);
  };

  const handleModalClose = () => {
    setSelectedFile(null);
  };

  const handleDownload = async (file: File) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/file-folder/files/download/${file._id}`);
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = file.name;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(downloadLink);
      setTimeout(() => setDownloadStatus(null), 2000);
    } catch (error) {
      console.error("Download failed:", error);
      setTimeout(() => setDownloadStatus(null), 2000);
    }
  };

  return (
    <div className="google-drive-clone flex flex-col md:flex-row h-[90vh] bg-gray-100 border border-gray-300 shadow-[0_4px_10px_rgba(0,0,0,0.4)] p-4">
      <div className="sidebar w-full md:w-64 p-4 bg-white border-r border-gray-200">
        <input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-gray-50 text-gray-900 p-2 rounded-md w-full mb-4 border border-gray-300"
        />
        <h3 className="text-lg font-semibold mb-2 text-gray-800">Documents</h3>

        <div className="filter-buttons mb-4 flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`filter-btn ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'} py-1 px-3 rounded-md text-sm`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('file')}
            className={`filter-btn ${filter === 'file' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'} py-1 px-3 rounded-md text-sm`}
          >
            Files
          </button>
          <button
            onClick={() => setFilter('photo')}
            className={`filter-btn ${filter === 'photo' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'} py-1 px-3 rounded-md text-sm`}
          >
            Images
          </button>
        </div>

        {filteredFoldersAndFiles
          .filter((item) => item.type === 'folder')
          .map((folder: File) => (
            <div key={folder._id} className="relative">
              <button
                onClick={() => handleFolderClick(Number(folder._id))}
                className="text-gray-700 py-2 px-4 rounded-md mb-2 w-full text-left hover:bg-gray-100"
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
          className="bg-blue-500 text-white py-2 px-4 rounded-md w-full mt-4 hover:bg-blue-600"
        >
          Upload
        </button>

        <div className="file-count mt-4 p-4 bg-gray-100 border border-gray-300 rounded-md shadow-md text-sm text-gray-600">
          Total: {filteredFoldersAndFiles.length} {filter === 'all' ? 'files' : filter === 'file' ? 'files' : 'images'}
        </div>
      </div>

      <div className="main-content flex-1 p-6 bg-gray-60 overflow-y-auto scrollbar-hide">
        <div className="files grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredFoldersAndFiles.map((item: File) =>
            item.type === 'folder' ? (
              <div
                key={`folder-${item._id}`}
                onClick={() => handleFolderClick(Number(item._id))}
                className="folder p-4 bg-white rounded-lg shadow-sm cursor-pointer hover:shadow-md"
              >
                <h3 className="text-gray-900">{item.name}</h3>
              </div>
            ) : (
              <div
                key={`file-${item._id}`}
                onClick={() => handleFileClick(item)}
                className="file p-4 bg-white rounded-lg shadow-md cursor-pointer hover:shadow-lg items-center justify-center text-gray-900 text-center max-w-full overflow-hidden text-ellipsis "
              >
                {item.fileType === 'image' ? (
                  <div className="flex flex-col items-center">
                    <Image
                      src={`http://localhost:8000/uploads/${item.fileUrl}`}
                      alt={item.name}
                      className="w-32 h-32 object-cover mb-2 rounded-md"
                      width={200}
                      height={200}
                    />
                    <p className="text-gray-900 text-center max-w-full overflow-hidden text-ellipsis">
                      {item.name}
                    </p>
                  </div>
                ) : item.fileType === 'video' ? (
                  <video
                    src={`http://localhost:8000/uploads/${item.fileUrl}`}
                    className="w-32 h-32 object-cover mb-2 rounded-md"
                    controls
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="flex flex-col items-center">
                    <Image
                      src={getFileImage(item.name)}
                      alt={item.name}
                      className="w-20 h-20 object-contain mb-2"
                      width={200}
                      height={200}
                    />
                    <p className="text-gray-900 text-center max-w-full overflow-hidden text-ellipsis mt-2">
                      {item.name}
                    </p>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>

      {selectedFile && (
        <div
          className="modal fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4"
          ref={modalBackdropRef}
        >
          <div
            className="modal-content bg-white p-6 rounded-lg w-full sm:w-3/4 max-w-md shadow-lg"
            ref={modalRef}
          >

            <div className="mb-4">
              {selectedFile.fileType === "image" ? (
                <Image
                  src={`http://localhost:8000/uploads/${selectedFile.fileUrl}`}
                  alt={selectedFile.name}
                  className="w-full max-h-[80vh] object-contain rounded-md"
                  width={200}
                  height={200}
                />
              ) : selectedFile.fileType === "video" ? (
                <video
                  src={`http://localhost:8000/uploads/${selectedFile.fileUrl}`}
                  className="w-full max-h-[80vh] object-contain rounded-md"
                  controls
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="text-black text-center mb-2 flex flex-col items-center">
                  <Image
                    src={getFileImage(selectedFile?.name)}
                    alt={selectedFile?.name}
                    className="w-20 h-20 object-contain mb-2"
                    width={200}
                    height={200}
                  />
                  <h3 className="truncate">{selectedFile?.name}</h3>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => handleDownload(selectedFile)}
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-200 mr-2"
              >
                Download
              </button>

              <button
                onClick={() => handleDeleteClick(selectedFile._id)}
                className="flex-1 bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition duration-200  mr-2"
              >
                Delete
              </button>
              <button
                onClick={handleModalClose}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition duration-200"
              >
                Close
              </button>
            </div>

            {downloadStatus && <div className="text-green-500 mt-2">{downloadStatus}</div>}
          </div>
        </div>
      )}

      <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsDeleteDialogOpen(false);
        }
      }}>
        <DialogContent
          className="fixed left-1/2 top-[7rem] transform -translate-x-1/2 z-[9999] w-full max-w-md bg-white shadow-lg rounded-lg p-6 sm:max-w-sm sm:p-4 xs:max-w-[90%] xs:p-3 xs:top-[5rem]"
          onInteractOutside={(e) => {
            e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-lg xs:text-base">Confirm Delete</DialogTitle>
            <DialogDescription className="text-sm xs:text-xs">
              Are you sure you want to delete this file?
              The data won&apos;t be retrieved again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-4 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="px-4 py-2 text-sm xs:px-3 xs:py-1 xs:text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              className="px-4 py-2 text-sm xs:px-3 xs:py-1 xs:text-xs bg-gray-600 hover:bg-red-700"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default GoogleDriveClone;