"use client";
import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Edit, Trash2, Loader2, PlusCircle, SearchIcon, ChevronDownIcon, Printer, FileDown, Download } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "@/hooks/use-toast"
import { z } from "zod"
import { cn } from "@/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Selection } from "@heroui/react"
import axios from "axios";
import { format } from "date-fns"
import { Chip, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Pagination, Tooltip, User } from "@heroui/react"
import { useRouter } from "next/navigation";
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Certificate {
  _id: string;
  certificateNo: string;
  customerName: string;
  siteLocation: string;
  makeModel: string;
  range: string;
  serialNo: string;
  calibrationGas: string;
  gasCanisterDetails: string;
  dateOfCalibration: string;
  calibrationDueDate: string;
  engineerName: string;
  [key: string]: string;
}

type SortDescriptor = {
  column: string;
  direction: 'ascending' | 'descending';
}

interface CertificateResponse {
  certificateId: string;
  message: string;
  downloadUrl: string;
}

const generateUniqueId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toISOString().split("T")[0]; 
};

const columns = [
  { name: "Certificate Number", uid: "certificateNo", sortable: true, width: "120px" },
  { name: "Customer Name", uid: "customerName", sortable: true, width: "120px" },
  { name: "Site Location", uid: "siteLocation", sortable: true, width: "120px" },
  { name: "Model", uid: "makeModel", sortable: true, width: "120px" },
  { name: "Serial Number", uid: "serialNo", sortable: true, width: "120px" },
  { name: "Engineer Name", uid: "engineerName", sortable: true, width: "120px" },
  { name: "Download", uid: "actions", sortable: true, width: "100px" },
];
const INITIAL_VISIBLE_COLUMNS = ["certificateNo", "customerName", "siteLocation", "makeModel", "serialNo", "engineerName", "actions"];

export default function Certificatetable() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [certificate, setCertificate] = useState<CertificateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(new Set([]));
  const [visibleColumns, setVisibleColumns] = React.useState<Selection>(new Set(columns.map(column => column.uid)));
  const [statusFilter, setStatusFilter] = React.useState<Selection>("all");
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
    column: "dateOfCalibration", // or "createdAt" if you have that field
    direction: "descending", // Newest first
  });
  const [page, setPage] = React.useState(1);
  const router = useRouter();

  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const fetchCertificates = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/v1/certificates/getCertificate",
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      let certificatesData;
      if (typeof response.data === 'object' && 'data' in response.data) {
        certificatesData = response.data.data;
      } else if (Array.isArray(response.data)) {
        certificatesData = response.data;
      } else {
        certificatesData = [];
      }

      const sortedData = certificatesData.sort((a: Certificate, b: Certificate) => {
        const dateA = new Date(a.dateOfCalibration || a.createdAt || 0).getTime();
        const dateB = new Date(b.dateOfCalibration || b.createdAt || 0).getTime();
        return dateB - dateA; 
      });

      const certificatesWithKeys = sortedData.map((certificate: Certificate) => ({
        ...certificate,
        key: certificate._id || generateUniqueId()
      }));

      setCertificates(certificatesWithKeys);
      setError(null);
    } catch (error) {
      console.error("Error fetching certificates:", error);
      setError("Failed to fetch certificates.");
      setCertificates([]);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const [filterValue, setFilterValue] = useState("");
  const hasSearchFilter = Boolean(filterValue);

  const headerColumns = React.useMemo(() => {
    if (visibleColumns === "all") return columns;

    return columns.filter((column) => Array.from(visibleColumns).includes(column.uid));
  }, [visibleColumns]);

  const filteredItems = React.useMemo(() => {
    let filteredCertificates = [...certificates];

    if (hasSearchFilter) {
      filteredCertificates = filteredCertificates.filter((certificate) =>
        certificate.certificateNo.toLowerCase().includes(filterValue.toLowerCase()) ||
        certificate.customerName.toLowerCase().includes(filterValue.toLowerCase()) ||
        certificate.siteLocation.toLowerCase().includes(filterValue.toLowerCase()) ||
        certificate.makeModel.toLowerCase().includes(filterValue.toLowerCase()) ||
        certificate.serialNo.toLowerCase().includes(filterValue.toLowerCase()) ||
        certificate.engineerName.toLowerCase().includes(filterValue.toLowerCase())
      );
    }

    return filteredCertificates;
  }, [certificates, hasSearchFilter, filterValue]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = React.useMemo(() => {
    return [...items].sort((a, b) => {
      const first = a[sortDescriptor.column as keyof Certificate];
      const second = b[sortDescriptor.column as keyof Certificate];

      if (sortDescriptor.column.includes('Date') || sortDescriptor.column === 'dateOfCalibration' || sortDescriptor.column === 'calibrationDueDate') {
        const dateA = new Date(first as string).getTime();
        const dateB = new Date(second as string).getTime();
        const cmp = dateA < dateB ? -1 : dateA > dateB ? 1 : 0;
        return sortDescriptor.direction === "descending" ? -cmp : cmp;
      }

      if (sortDescriptor.column === 'certificateNo') {
        const numA = parseInt(first as string, 10);
        const numB = parseInt(second as string, 10);
        if (!isNaN(numA) && !isNaN(numB)) {
          const cmp = numA < numB ? -1 : numA > numB ? 1 : 0;
          return sortDescriptor.direction === "descending" ? -cmp : cmp;
        }
      }

      const cmp = String(first).localeCompare(String(second));
      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleDownload = async (certificateId: string) => {
    try {
      setIsDownloading(certificateId);
      console.log('Attempting to download certificate:', certificateId);
      const pdfResponse = await axios.get(
        `http://localhost:5000/api/v1/certificates/download/${certificateId}`,
        {
          responseType: 'blob',
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
            "Accept": "application/pdf"
          }
        }
      );

      const contentType = pdfResponse.headers['content-type'];
      if (!contentType || !contentType.includes('application/pdf')) {
        throw new Error('Received invalid content type from server');
      }

      const blob = new Blob([pdfResponse.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificate-${certificateId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Certificate Downloaded",
        description: "The certificate has been successfully downloaded",
        variant: "default",
      });
    } catch (err) {
      console.error('Download error:', err);
      let errorMessage = "Failed to download certificate. Please try again.";

      if (axios.isAxiosError(err)) {
        console.error('Error details:', {
          status: err.response?.status,
          data: err.response?.data,
          url: err.config?.url
        });

        if (err.response?.status === 401) {
          errorMessage = "Please login again to download the certificate.";
        } else if (err.response?.status === 404) {
          errorMessage = "Certificate not found.";
        } else if (!navigator.onLine) {
          errorMessage = "No internet connection. Please check your network.";
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDownloading(null);
    }
  };

  const onNextPage = React.useCallback(() => {
    if (page < pages) {
      setPage(page + 1);
    }
  }, [page, pages]);

  const onPreviousPage = React.useCallback(() => {
    if (page > 1) {
      setPage(page - 1);
    }
  }, [page]);

  const onRowsPerPageChange = React.useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  }, []);

  const onSearchChange = React.useCallback((value: string) => {
    if (value) {
      setFilterValue(value);
      setPage(1);
    } else {
      setFilterValue("");
    }
  }, []);

  const onClear = React.useCallback(() => {
    setFilterValue("");
    setPage(1);
  }, []);

  const topContent = React.useMemo(() => {
    return (
      <div className="flex justify-between items-center gap-4">
        <Input
          isClearable
          className="w-full max-w-[300px]"
          placeholder="Search"
          startContent={<SearchIcon className="h-4 w-5 text-muted-foreground" />}
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value)}
          onClear={() => setFilterValue("")}
        />
        <label className="flex items-center text-default-400 text-small">
          Rows per page:
          <select
            className="bg-transparent dark:bg-gray-800 outline-none text-default-400 text-small ml-2"
            onChange={onRowsPerPageChange}
            defaultValue="5"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="15">15</option>
          </select>
        </label>
      </div>
    );
  }, [filterValue, onRowsPerPageChange, certificates.length, onSearchChange, visibleColumns]);

  const bottomContent = React.useMemo(() => {
    return (
      <div className="py-2 px-2 relative flex justify-between items-center">
        <span className="text-default-400 text-small">
          Total {certificates.length} certificates
        </span>
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <Pagination
            isCompact
            showShadow
            color="success"
            page={page}
            total={pages}
            onChange={setPage}
            classNames={{
              cursor: "bg-[hsl(339.92deg_91.04%_52.35%)] shadow-md",
              item: "data-[active=true]:bg-[hsl(339.92deg_91.04%_52.35%)] data-[active=true]:text-white rounded-lg",
            }}
          />
        </div>
        <div className="rounded-lg bg-default-100 hover:bg-default-200 hidden sm:flex w-[30%] justify-end gap-2">
          <Button
            className="bg-[hsl(339.92deg_91.04%_52.35%)]"
            variant="default"
            size="sm"
            disabled={page === 1}
            onClick={onPreviousPage}
          >
            Previous
          </Button>
          <Button
            className="bg-[hsl(339.92deg_91.04%_52.35%)]"
            variant="default"
            size="sm"
            disabled={page === pages}
            onClick={onNextPage}
          >
            Next
          </Button>
        </div>
      </div>
    );
  }, [selectedKeys, page, pages, onPreviousPage, onNextPage, items.length, hasSearchFilter]);

  const handleSelectionChange = (keys: Selection) => {
    if (keys === "all") {
      setSelectedKeys(new Set(certificates.map(cert => cert._id)));
    } else {
      setSelectedKeys(keys as Set<string>);
    }
  };

  const handleVisibleColumnsChange = (keys: Selection) => {
    setVisibleColumns(keys);
  };

  const renderCell = React.useCallback((certificate: Certificate, columnKey: string): React.ReactNode => {
    const cellValue = certificate[columnKey];

    if ((columnKey === "dateOfCalibration" || columnKey === "calibrationDueDate") && cellValue) {
      return formatDate(cellValue);
    }

    if (columnKey === "actions") {
      return (
        <div className="relative flex items-center gap-2">
          <Tooltip color="danger">
            <span
              className="text-lg text-danger cursor-pointer active:opacity-50"
              onClick={(e) => {
                e.preventDefault();
                handleDownload(certificate.certificateId);
              }}
            >
              <Download className="h-6 w-6" />
            </span>
          </Tooltip>
        </div>
      );
    }

    return cellValue;
  }, []);

  return (
    <Table
      isHeaderSticky
      aria-label="Leads table with custom cells, pagination and sorting"
      bottomContent={bottomContent}
      bottomContentPlacement="outside"
      classNames={{
        wrapper: "max-h-[382px] ower-flow-y-auto",
      }}
      selectedKeys={selectedKeys}
      sortDescriptor={sortDescriptor}
      topContent={topContent}
      topContentPlacement="outside"
      onSelectionChange={handleSelectionChange}
      onSortChange={(descriptor) => {
        setSortDescriptor({
          column: descriptor.column as string,
          direction: descriptor.direction as "ascending" | "descending",
        });
      }}
    >
      <TableHeader columns={headerColumns}>
        {(column) => (
          <TableColumn
            key={column.uid}
            align={column.uid === "actions" ? "center" : "start"}
            allowsSorting={column.sortable}
          >
            <div className="flex items-center">
              {column.name}
              {sortDescriptor.column === column.uid && (
                <ChevronDownIcon
                  className={`ml-2 h-4 w-4 transition-transform ${sortDescriptor.direction === "ascending" ? "rotate-180" : ""
                    }`}
                />
              )}
            </div>
          </TableColumn>
        )}
      </TableHeader>
      <TableBody emptyContent={"Create certificate and add data"} items={sortedItems}>
        {(item) => (
          <TableRow key={item._id}>
            {(columnKey) => <TableCell style={{ fontSize: "12px", padding: "8px" }}>{renderCell(item as Certificate, columnKey as string)}</TableCell>}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
