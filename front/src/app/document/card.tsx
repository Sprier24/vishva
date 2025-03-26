'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"

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
  const modalRef = useRef<HTMLDivElement>(null);
  const modalBackdropRef = useRef<HTMLDivElement>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const getFileImage = (fileName?: string) => {
    if (!fileName) return "default-icon.png"; // Return a default icon if the file name is invalid

    const extension = fileName.split(".").pop()?.toLowerCase(); // Extract file extension

    switch (extension) {
      case "pdf":
        return "pdf-icon.png";
      case "doc":
      case "docx":
        return "word-icon.png";
      case "xls":
      case "xlsx":
        return "excel-icon.png";
      case "png":
      case "jpg":
      case "jpeg":
        return "image-icon.png";
      default:
        return "default-icon.png"; // Default icon for unknown file types
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


  // Function to handle delete button click
  const handleDeleteClick = (file: { id: string; name: string }) => {
    setSelectedFile(file);
    setIsDeleteDialogOpen(true);
  };

  // Function to confirm deletion
  const handleDeleteConfirm = async () => {
    if (!selectedFile?.id) return;

    try {
      const response = await fetch(`http://localhost:8000/api/v1/file-folder/files/${selectedFile.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete file");
      }

      toast({
        title: "File Deleted Successfully",
        description: `The file "${selectedFile.name}" has been successfully deleted.`,
      });

      // Update UI after deletion
      setFiles(prevFiles => prevFiles.filter(file => file.id !== selectedFile.id));
      setSelectedFile(null);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete file",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedFile(null);
    }
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
    <div className="google-drive-clone flex flex-col md:flex-row h-[90vh] bg-gray-100 border border-gray-300 shadow-[0_4px_10px_rgba(0,0,0,0.4)] p-4">
      {/* Sidebar */}
      <div className="sidebar w-full md:w-64 p-4 bg-white border-r border-gray-200">
        <input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-gray-50 text-gray-900 p-2 rounded-md w-full mb-4 border border-gray-300"
        />
        <h3 className="text-lg font-semibold mb-2 text-gray-800">Files</h3>

        {/* Filter Buttons */}
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
            Photos
          </button>
        </div>

        {filteredFoldersAndFiles
          .filter((item) => item.type === 'folder')
          .map((folder: File) => (
            <div key={folder.id} className="relative">
              <button
                onClick={() => handleFolderClick(Number(folder.id))}
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
          Upload File
        </button>
      </div>

      {/* Main Content */}
      <div className="main-content flex-1 p-6 bg-gray-60 overflow-y-auto scrollbar-hide">
        <div className="files grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredFoldersAndFiles.map((item: File) =>
            item.type === 'folder' ? (
              <div
                key={item.id}
                onClick={() => handleFolderClick(Number(item.id))}
                className="folder p-4 bg-white rounded-lg shadow-sm cursor-pointer hover:shadow-md"
              >
                <h3 className="text-gray-900">{item.name}</h3>
              </div>
            ) : (
              <div
                key={item.id}
                onClick={() => handleFileClick(item)}
                className="file p-4 bg-white rounded-lg shadow-md cursor-pointer hover:shadow-lg items-center justify-center text-gray-900 text-center max-w-full overflow-hidden text-ellipsis "
              >
                {item.fileType === 'image' ? (
                  <div className="flex flex-col items-center">
                    <img
                      src={`http://localhost:8000/uploads/${item.fileUrl}`}
                      alt={item.name}
                      className="w-32 h-32 object-cover mb-2 rounded-md"
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
                    <img
                      src={getFileImage(item.name)}
                      alt={item.name}
                      className="w-20 h-20 object-contain mb-2" // Adjust size as needed
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

      {/* Modal */}
      {selectedFile && (
        <div className="modal fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4">
          <div className="modal-content bg-white p-6 rounded-lg w-full sm:w-3/4 max-w-md shadow-lg">
            {/* File Preview */}
            <div className="mb-4">
              {selectedFile.fileType === "image" ? (
                <img
                  src={`http://localhost:8000/uploads/${selectedFile.fileUrl}`}
                  alt={selectedFile.name}
                  className="w-full max-h-[80vh] object-contain rounded-md"
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
                  <img
                    src={getFileImage(selectedFile?.name)}
                    alt={selectedFile?.name}
                    className="w-20 h-20 object-contain mb-2"
                  />
                  <h3 className="truncate">{selectedFile?.name}</h3>
                </div>
              )}
            </div>

            {/* Buttons Section - All in One Line */}
            <div className="flex justify-between space-x-2 mt-4">
              <button
                onClick={() => handleDownload(selectedFile)}
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-200"
              >
                Download
              </button>

              <button
                onClick={() => handleDeleteClick(selectedFile)}
                className="flex-1 bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition duration-200"
              >
                Delete
              </button>

              <button
                onClick={() => setSelectedFile(null)}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition duration-200"
              >
                Close
              </button>
            </div>

            {/* Download Status */}
            {downloadStatus && <div className="text-green-500 mt-2">{downloadStatus}</div>}
          </div>
        </div>
      )}


      <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsDeleteDialogOpen(false);
        }
      }}>
        <DialogContent className="fixed left-1/2 top-[7rem] transform -translate-x-1/2 z-[9999] w-full max-w-md bg-white shadow-lg rounded-lg p-6 
        sm:max-w-sm sm:p-4 xs:max-w-[90%] xs:p-3 xs:top-[5rem]"
          onInteractOutside={(e) => {
            e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-lg xs:text-base">Confirm Deletion</DialogTitle>
            <DialogDescription className="text-sm xs:text-xs">
              Are you sure you want to delete this invoice? This action cannot be undone.
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
              className="px-4 py-2 text-sm xs:px-3 xs:py-1 xs:text-xs bg-red-600"
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