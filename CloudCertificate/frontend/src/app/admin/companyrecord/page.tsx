'use client';
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from 'next/navigation';
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, SearchIcon, Edit2Icon, DeleteIcon, FileDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import axios from "axios";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import { ModeToggle } from "@/components/ModeToggle";
import { Pagination, Tooltip } from "@heroui/react";
import { AdminSidebar } from "@/components/admin-sidebar";

interface CompanyDetails {
    _id: string;
    companyName: string;
    address: string;
    gstNumber: string;
    industries: string;
    website: string;
    industriesType: string;
    flag: string;
    key?: string;
}

const generateUniqueId = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const columns = [
    { name: "Company Name", uid: "companyName", sortable: true, width: "120px" },
    { name: "Address", uid: "address", sortable: true, width: "120px" },
    { name: "GST Number", uid: "gstNumber", sortable: true, width: "120px" },
    { name: "Industries", uid: "industries", sortable: true, width: "120px" },
    { name: "Website", uid: "website", sortable: true, width: "120px" },
    { name: "Industries Tyre", uid: "industriesType", sortable: true, width: "120px" },
    { name: "Flag", uid: "flag", sortable: true, width: "120px" },
    { name: "Action", uid: "actions", sortable: false, width: "100px" },
];

const INITIAL_VISIBLE_COLUMNS = ["companyName", "address", "gstNumber", "industries", "website", "industriesType", "flag", "actions"];

export default function CompanyDetailsTable() {
    const [companies, setCompanies] = useState<CompanyDetails[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set([]));
    const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(INITIAL_VISIBLE_COLUMNS));
    const [rowsPerPage, setRowsPerPage] = useState(15);
    const [page, setPage] = useState(1);
    const [filterValue, setFilterValue] = useState("");
    const [isDownloading, setIsDownloading] = useState<string | null>(null);
    const [sortDescriptor, setSortDescriptor] = useState<{
        column: string | null;
        direction: "ascending" | "descending";
    }>({
        column: null,
        direction: "ascending",
    });
    
    const router = useRouter();
    const hasSearchFilter = Boolean(filterValue);

    const fetchCompanies = async () => {
        try {
            const response = await axios.get(
                `http://localhost:5000/api/v1/company/getAllcompanies`,
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            const companiesData = Array.isArray(response.data)
                ? response.data
                : response.data?.data
                    ? response.data.data
                    : [];

            const companiesWithKeys = companiesData
                .reverse() // 👈 Latest added data comes first
                .map((company: CompanyDetails) => ({
                    ...company,
                    key: company._id || generateUniqueId(),
                }));

            setCompanies(companiesWithKeys);
            setError(null);
        } catch (error) {
            console.error("Error fetching companies:", error);
            setError("Failed to fetch companies. Please try again.");
            setCompanies([]);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    const handleDelete = async (companyId: string) => {
        if (!window.confirm("Are you sure you want to delete this company?")) {
            return;
        }

        try {
            await axios.delete(
                `http://localhost:5000/api/v1/company/deleteCompany/${companyId}`,
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            setCompanies(prev => prev.filter(company => company._id !== companyId));
            toast({
                title: "Delete Successful!",
                description: "Company deleted successfully!",
            });
        } catch (error) {
            console.error("Error deleting company:", error);
            toast({
                title: "Error",
                description: "Failed to delete company.",
                variant: "destructive",
            });
        }
    };

    const filteredItems = React.useMemo(() => {
        let filtered = [...companies];

        if (hasSearchFilter) {
            const searchLower = filterValue.toLowerCase();
            filtered = filtered.filter(company =>
                company.companyName.toLowerCase().includes(searchLower) ||
                company.gstNumber.toLowerCase().includes(searchLower)
            );
        }

        return filtered;
    }, [companies, filterValue, hasSearchFilter]);

    const sortedItems = React.useMemo(() => {
        if (!sortDescriptor.column) {
            // No sorting = just show as-is (which is reversed from fetch)
            return filteredItems;
        }
    
        return [...filteredItems].sort((a, b) => {
            const first = a[sortDescriptor.column as keyof CompanyDetails] || "";
            const second = b[sortDescriptor.column as keyof CompanyDetails] || "";
    
            let cmp = 0;
            if (first < second) cmp = -1;
            if (first > second) cmp = 1;
    
            return sortDescriptor.direction === "descending" ? -cmp : cmp;
        });
    }, [filteredItems, sortDescriptor]);
    

    const paginatedItems = React.useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        return sortedItems.slice(start, start + rowsPerPage);
    }, [sortedItems, page, rowsPerPage]);

    const pages = Math.ceil(filteredItems.length / rowsPerPage) || 1;

    const onNextPage = useCallback(() => {
        if (page < pages) setPage(page + 1);
    }, [page, pages]);

    const onPreviousPage = useCallback(() => {
        if (page > 1) setPage(page - 1);
    }, [page]);

    const onRowsPerPageChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setRowsPerPage(Number(e.target.value));
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
    }, [filterValue, onRowsPerPageChange, companies.length]);

    const bottomContent = React.useMemo(() => {
        return (
            <div className="py-2 px-2 relative flex justify-between items-center">
                <span className="text-default-400 text-small">
                    Total {companies.length} companies
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
    }, [page, pages, onPreviousPage, onNextPage, companies.length]);

    const renderCell = useCallback((company: CompanyDetails, columnKey: string) => {
        if (columnKey === "actions") {
            return (
                <div className="relative flex items-center gap-2">
                    <Tooltip>
                        <span
                            className="text-lg text-info cursor-pointer active:opacity-50"
                            onClick={(e) => {
                                e.preventDefault();
                                router.push(`companyform?id=${company._id}`);
                            }}
                        >
                            <Edit2Icon className="h-6 w-6" />
                        </span>
                    </Tooltip>

                    <Tooltip>
                        <span
                            className="text-lg text-danger cursor-pointer active:opacity-50"
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete(company._id);
                            }}
                        >
                            <DeleteIcon className="h-6 w-6" />
                        </span>
                    </Tooltip>
                </div>
            );
        }
        return company[columnKey as keyof CompanyDetails];
    }, [router]);

    return (
        <SidebarProvider>
            <AdminSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <ModeToggle />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/admin/dashboard">
                                        Dashboard
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/admin/companyform">
                                        Create Company
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8 pt-15">
                    <Card className="max-w-6xl mx-auto">
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold text-center">Company Record</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {topContent}
                            <Table>
                                <TableHeader>
                                    {columns.map((column) => (
                                        <TableColumn
                                            key={column.uid}
                                            allowsSorting={column.sortable}
                                            onClick={() => {
                                                if (!column.sortable) return;
                                                setSortDescriptor(prev => ({
                                                    column: column.uid,
                                                    direction:
                                                        prev.column === column.uid && prev.direction === "ascending"
                                                            ? "descending"
                                                            : "ascending",
                                                }));
                                            }}
                                            style={{ cursor: column.sortable ? "pointer" : "default" }}
                                        >
                                            {column.name}
                                            {sortDescriptor.column === column.uid && (
                                                <span className="ml-1">
                                                    {sortDescriptor.direction === "ascending" ? "▲" : "▼"}
                                                </span>
                                            )}
                                        </TableColumn>
                                    ))}
                                </TableHeader>
                                <TableBody emptyContent={"No companies found"} items={paginatedItems}>
                                    {(item) => (
                                        <TableRow key={item._id}>
                                            {(columnKey) => <TableCell style={{ fontSize: "12px", padding: "8px" }}>{renderCell(item, columnKey as string)}</TableCell>}
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            {bottomContent}
                        </CardContent>
                    </Card>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}