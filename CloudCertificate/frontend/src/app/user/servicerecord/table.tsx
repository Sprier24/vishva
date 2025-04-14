"use client";

import React, { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, SearchIcon, FileDown, ChevronDownIcon } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Selection, ChipProps, Select } from "@heroui/react"
import axios from "axios";
import { Pagination, Tooltip } from "@heroui/react"
import { useRouter } from "next/navigation";

interface Service {
    [x: string]: string | null;
    _id: string;
    contactPerson: string;
    contactNumber: string;
    serviceEngineer: string;
    date: string;
    place: string;
    placeOptions: string;
    natureOfJob: string;
    reportNo: string;
    makeModelNumberoftheInstrumentQuantity: string;
    serialNumberoftheInstrumentCalibratedOK: string;
    serialNumberoftheFaultyNonWorkingInstruments: string;
    engineerName: string;
}

type SortDescriptor = {
    column: string;
    direction: 'ascending' | 'descending';
}

interface ServiceResponse {
    serviceId: string;
    message: string;
    downloadUrl: string;
}

const generateUniqueId = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0]; // Returns "YYYY-MM-DD"
};

const columns = [
    { name: "Contact Person", uid: "contactPerson", sortable: true, width: "120px" },
    { name: "Contact Number", uid: "contactNumber", sortable: true, width: "120px" },
    { name: "Service Engineer", uid: "serviceEngineer", sortable: true, width: "120px" },
    { name: "Date", uid: "date", sortable: true, width: "120px" }, // Added date column
    { name: "Report No", uid: "reportNo", sortable: true, width: "120px" },
    { name: "Action", uid: "actions", sortable: true, width: "100px" },
];

export const statusOptions = [
    { name: "Paused", uid: "paused" },
    { name: "Vacation", uid: "vacation" },
];


const statusColorMap: Record<string, ChipProps["color"]> = {
    active: "success",
    paused: "danger",
    vacation: "warning",
};

const INITIAL_VISIBLE_COLUMNS = ["nameAndLocation", "contactPerson", "contactNumber", "serviceEngineer", "reportNo", "actions"];


export default function Servicetable() {
    const [services, setServices] = useState<Service[]>([]);
    const [service, setService] = useState<ServiceResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(new Set([]));
    const [visibleColumns, setVisibleColumns] = React.useState<Selection>(new Set(columns.map(column => column.uid)));
    const [statusFilter, setStatusFilter] = React.useState<Selection>("all");
    const [rowsPerPage, setRowsPerPage] = useState(15);
    const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
        column: "createdAt", // This should match your date field name
        direction: "descending", // Newest first
    });
    const [page, setPage] = React.useState(1);
    const router = useRouter();

    const [isDownloading, setIsDownloading] = useState<string | null>(null);


    const fetchServices = async () => {
            try {
                const response = await axios.get(
                    "http://localhost:5000/api/v1/services/getServices",
                    {
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${localStorage.getItem("token")}`
                        }
                    }
                );
    
                let servicesData;
                if (typeof response.data === 'object' && 'data' in response.data) {
                    servicesData = response.data.data;
                } else if (Array.isArray(response.data)) {
                    servicesData = response.data;
                } else {
                    throw new Error('Invalid response format');
                }
    
                // Sort by createdAt in descending order (newest first)
                servicesData.sort((a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
    
                const servicesWithKeys = servicesData.map((service: Service) => ({
                    ...service,
                    key: service._id || generateUniqueId()
                }));
    
                setServices(servicesWithKeys);
                setError(null);
            } catch (error) {
                console.error("Error fetching services:", error);
                setError("Failed to fetch services.");
                setServices([]);
            }
        };
    
    useEffect(() => {
        fetchServices();
    }, []);

    const [filterValue, setFilterValue] = useState("");
    const hasSearchFilter = Boolean(filterValue);

    const headerColumns = React.useMemo(() => {
        if (visibleColumns === "all") return columns;

        return columns.filter((column) => Array.from(visibleColumns).includes(column.uid));
    }, [visibleColumns]);

    const filteredItems = React.useMemo(() => {
        let filteredServices = [...services];

        if (hasSearchFilter) {
            filteredServices = filteredServices.filter((service) =>
                // service.nameAndLocation.toLowerCase().includes(filterValue.toLowerCase()) ||
                service.contactPerson.toLowerCase().includes(filterValue.toLowerCase())
            );
        }

        return filteredServices;
    }, [services, hasSearchFilter, filterValue]);

    const pages = Math.ceil(filteredItems.length / rowsPerPage);

    const items = React.useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;

        return filteredItems.slice(start, end);
    }, [page, filteredItems, rowsPerPage]);

      const sortedItems = React.useMemo(() => {
          return [...items].sort((a, b) => {
              // Handle date fields specially
              if (sortDescriptor.column === 'date' || sortDescriptor.column === 'createdAt') {
                  const dateA = new Date(a[sortDescriptor.column]).getTime();
                  const dateB = new Date(b[sortDescriptor.column]).getTime();
                  const cmp = dateA < dateB ? -1 : dateA > dateB ? 1 : 0;
                  return sortDescriptor.direction === "descending" ? -cmp : cmp;
              }
  
              // Default string comparison
              const first = a[sortDescriptor.column as keyof Service] || '';
              const second = b[sortDescriptor.column as keyof Service] || '';
              const cmp = String(first).localeCompare(String(second));
  
              return sortDescriptor.direction === "descending" ? -cmp : cmp;
          });
      }, [sortDescriptor, items]);

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedService, setSelectedService] = useState<Service | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleDownload = async (serviceId: string) => {
        try {
            setIsDownloading(serviceId);
            console.log('Attempting to download service:', serviceId);

            // Now download the PDF directly
            const pdfResponse = await axios.get(
                `http://localhost:5000/api/v1/services/download/${serviceId}`,
                {
                    responseType: 'blob',
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("token")}`,
                        "Accept": "application/pdf"
                    }
                }
            );

            // Verify the content type
            const contentType = pdfResponse.headers['content-type'];
            if (!contentType || !contentType.includes('application/pdf')) {
                throw new Error('Received invalid content type from server');
            }

            const blob = new Blob([pdfResponse.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `service-${serviceId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast({
                title: "Success",
                description: "Service downloaded successfully",
                variant: "default",
            });
        } catch (err) {
            console.error('Download error:', err);
            let errorMessage = "Failed to download service. Please try again.";

            if (axios.isAxiosError(err)) {
                console.error('Error details:', {
                    status: err.response?.status,
                    data: err.response?.data,
                    url: err.config?.url
                });

                if (err.response?.status === 401) {
                    errorMessage = "Please login again to download the service.";
                } else if (err.response?.status === 404) {
                    errorMessage = "Service not found.";
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
                    placeholder="Search by name or GST"
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
    }, [filterValue, onRowsPerPageChange, services.length, onSearchChange, visibleColumns]);

    const bottomContent = React.useMemo(() => {
        return (
            <div className="py-2 px-2 relative flex justify-between items-center">
                <span className="text-default-400 text-small">
                    Total {services.length} services
                </span>

                {/* Centered Pagination */}
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

                {/* Navigation Buttons */}
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
            setSelectedKeys(new Set(services.map(service => service._id)));
        } else {
            setSelectedKeys(keys as Set<string>);
        }
    };

    const handleVisibleColumnsChange = (keys: Selection) => {
        setVisibleColumns(keys);
    };

    const renderCell = useCallback((service: Service, columnKey: string) => {
        if (columnKey === "actions") {
            return (
                <div className="relative flex items-center gap-2">
                    <Tooltip>
                        <span
                            className="text-lg text-danger cursor-pointer active:opacity-50"
                            onClick={() => handleDownload(service._id)}
                        > {isDownloading === service.serviceId ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                            <FileDown className="h-6 w-6" />
                        )}
                        </span>
                    </Tooltip>
                </div>
            );
        }
        return service[columnKey as keyof Service];
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
                                                        onClick={() => {
                                                            setSortDescriptor(prev => ({
                                                                column: column.uid,
                                                                direction: prev.column === column.uid && prev.direction === 'ascending'
                                                                    ? 'descending'
                                                                    : 'ascending'
                                                            }));
                                                        }}
                                                    >
                                                        <div className="flex items-center">
                                                            {column.name}
                                                            {sortDescriptor.column === column.uid && (
                                                                <span className="ml-1">
                                                                    {sortDescriptor.direction === 'ascending' ? '↑' : '↓'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableColumn>
                                                )}
                                            </TableHeader>
            <TableBody emptyContent={"No service found"} items={sortedItems}>
                {(item) => (
                    <TableRow key={item._id}>
                        {(columnKey) => <TableCell style={{ fontSize: "12px", padding: "8px" }}>{renderCell(item as Service, columnKey as string)}</TableCell>}
                    </TableRow>
                )}
            </TableBody>
        </Table>


    );
}
