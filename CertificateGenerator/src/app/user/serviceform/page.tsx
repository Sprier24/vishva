"use client";
import { useState, useEffect, useCallback, ChangeEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import axios from "axios";
import { toast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { AppSidebar } from "@/components/app-sidebar";
import { jsPDF } from "jspdf";

interface Contact {
    id: string;
    firstName: string;
    contactNo: string;
    companyName?: string;
}
interface EngineerRemark {
    serviceSpares: string;
    partNo: string;
    rate: string;
    quantity: string;
    total: string;
    poNo: string;
}
interface ServiceRequest {
    id: string;
    serviceId?: string;
    customerName: string;
    customerLocation: string;
    contactPerson: string;
    contactNumber: string;
    serviceEngineer: string;
    serviceEngineerId?: string;
    date: string;
    place: string;
    placeOptions: string;
    natureOfJob: string;
    reportNo: string;
    makeModelNumberoftheInstrumentQuantity: string;
    serialNumberoftheInstrumentCalibratedOK: string;
    serialNumberoftheFaultyNonWorkingInstruments: string;
    engineerReport: string;
    customerReport: string;
    engineerRemarks: EngineerRemark[];
    engineerName: string;
    engineerId?: string;
    status: string;
}
interface ServiceResponse {
    serviceId: string;
    message: string;
    downloadUrl: string;
}
interface Engineer {
    id: string;
    name: string;
}
interface ServiceEngineer {
    id: string;
    name: string;
}

const initialFormData: ServiceRequest = {
    id: "",
    customerName: "",
    customerLocation: "",
    contactPerson: "",
    contactNumber: "",
    serviceEngineer: "",
    date: new Date().toISOString().split('T')[0],
    place: "",
    placeOptions: "At Site",
    natureOfJob: "AMC",
    reportNo: "",
    makeModelNumberoftheInstrumentQuantity: "",
    serialNumberoftheInstrumentCalibratedOK: "",
    serialNumberoftheFaultyNonWorkingInstruments: "",
    engineerReport: "",
    customerReport: "",
    engineerRemarks: [{ serviceSpares: "", partNo: "", rate: "", quantity: "", poNo: "", total: "" }],
    engineerName: "",
    status: "checked"
};

export default function ServiceFormWrapper() {
    return (
        <Suspense fallback={<ServiceFormLoading />}>
            <GenerateService />
        </Suspense>
    );
}

function ServiceFormLoading() {
    return (
        <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
            <span className="ml-4">Loading Service form...</span>
        </div>
    );
}

function GenerateService() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const serviceId = searchParams.get('id');
    const isEditMode = !!serviceId;
    const today = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState<string>(today);
    const [formData, setFormData] = useState<ServiceRequest>(initialFormData);
    const [contactPersons, setContactPersons] = useState<Contact[]>([]);
    const [service, setService] = useState<ServiceResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [engineers, setEngineers] = useState<Engineer[]>([]);
    const [serviceEngineers, setServiceEngineers] = useState<ServiceEngineer[]>([]);
    const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isLoadingContacts, setIsLoadingContacts] = useState(false);
    const [isLoadingEngineers, setIsLoadingEngineers] = useState(true);
    const [isSendingPDF, setIsSendingPDF] = useState(false);
    const [generatedPdfBlob, setGeneratedPdfBlob] = useState<Blob | null>(null);
    const generateReportNo = useCallback(() => {
        const date = new Date();
        const currentYear = date.getFullYear();
        const shortStartYear = String(currentYear).slice(-2);
        const shortEndYear = String(currentYear + 1).slice(-2);
        const yearRange = `${shortStartYear}-${shortEndYear}`;
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        return `RPS/SRV/${yearRange}/${randomNum}`;
    }, []);

    const fetchContactPersons = useCallback(async () => {
        setIsLoadingContacts(true);
        try {
            const response = await axios.get("/api/contact", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            const data = Array.isArray(response.data?.data)
                ? response.data.data
                : Array.isArray(response.data)
                    ? response.data
                    : [];
            setContactPersons(data);
            setFilteredContacts(data);
        } catch (error) {
            console.error("Error fetching contact", error);
            toast({
                title: "Failed to load contact",
                variant: "destructive",
            });
            setContactPersons([]);
            setFilteredContacts([]);
        } finally {
            setIsLoadingContacts(false);
        }
    }, []);

    const fetchEngineers = useCallback(async () => {
        try {
            const res = await fetch("/api/engineers");
            const data = await res.json();
            setEngineers(Array.isArray(data) ? data : []);
        } catch (error) {
            toast({
                title: "Failed to load engineers",
                variant: "destructive"
            });
        }
    }, []);

    const fetchServiceEngineers = useCallback(async () => {
        try {
            const res = await fetch("/api/service-engineers");
            const data = await res.json();
            setServiceEngineers(Array.isArray(data) ? data : []);
        } catch (error) {
            toast({
                title: "Failed to load service engineers",
                variant: "destructive"
            });
        } finally {
            setIsLoadingEngineers(false);
        }
    }, []);



    useEffect(() => {
        if (!isEditMode) {
            setFormData(prev => ({
                ...prev,
                reportNo: generateReportNo()
            }));
        }
    }, [isEditMode, generateReportNo]);

    useEffect(() => {
        fetchContactPersons();
        fetchEngineers();
        fetchServiceEngineers();
    }, [fetchContactPersons, fetchEngineers, fetchServiceEngineers]);

    useEffect(() => {
        if (!Array.isArray(contactPersons)) {
            setFilteredContacts([]);
            return;
        }
        const customerNameInput = formData.customerName.trim().toLowerCase();
        setFilteredContacts(
            customerNameInput.length > 0
                ? contactPersons.filter(person =>
                    (person.companyName || '').toLowerCase().includes(customerNameInput) ||
                    (person.firstName || '').toLowerCase().includes(customerNameInput)
                )
                : contactPersons
        );
    }, [formData.customerName, contactPersons]);

    const handleServiceEngineerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = e.target.value;
        const selectedEngineer = serviceEngineers.find(engineer => engineer.id === selectedId);
        setFormData(prev => ({
            ...prev,
            serviceEngineerId: selectedId,
            serviceEngineer: selectedEngineer?.name || ""
        }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEngineerRemarksChange = (index: number, field: keyof EngineerRemark, value: string) => {
        const updatedEngineerRemarks = [...formData.engineerRemarks];
        updatedEngineerRemarks[index] = { ...updatedEngineerRemarks[index], [field]: value };
        if (field === 'rate' || field === 'quantity') {
            const rate = parseFloat(updatedEngineerRemarks[index].rate) || 0;
            const quantity = parseFloat(updatedEngineerRemarks[index].quantity) || 0;
            updatedEngineerRemarks[index].total = (rate * quantity).toString();
        }
        setFormData({ ...formData, engineerRemarks: updatedEngineerRemarks });
    };

    const removeEngineerRemark = (index: number) => {
        const updatedEngineerRemarks = [...formData.engineerRemarks];
        updatedEngineerRemarks.splice(index, 1);
        setFormData({ ...formData, engineerRemarks: updatedEngineerRemarks });
    };

    const addEngineerRemark = () => {
        if (formData.engineerRemarks.length < 10) {
            setFormData({
                ...formData,
                engineerRemarks: [
                    ...formData.engineerRemarks,
                    { serviceSpares: "", partNo: "", rate: "", quantity: "", poNo: "", total: "" }
                ]
            });
        }
    };

    const validateForm = (): boolean => {
        const requiredFields = [
            'customerName', 'customerLocation', 'contactPerson', 'contactNumber',
            'serviceEngineer', 'date', 'place', 'natureOfJob',
            'makeModelNumberoftheInstrumentQuantity', 'serialNumberoftheInstrumentCalibratedOK',
            'serialNumberoftheFaultyNonWorkingInstruments', 'engineerReport', 'engineerName'
        ];
        const missingFields = requiredFields.filter(field => {
            const value = formData[field as keyof typeof formData];
            return typeof value === 'string' ? value.trim() === '' : !value;
        });
        if (missingFields.length > 0) {
            setError(`Please fill all required fields: ${missingFields.join(', ')}`);
            return false;
        }
        const validRemarks = formData.engineerRemarks.filter(remark =>
            remark.serviceSpares?.trim() &&
            remark.partNo?.trim() &&
            remark.rate?.toString().trim() &&
            remark.quantity?.toString().trim() &&
            remark.total?.toString().trim() &&
            remark.poNo?.trim()
        );
        if (validRemarks.length === 0) {
            setError("Please add at least one valid engineer remark");
            return false;
        }
        return true;
    };

    const generatePDFDocument = async (): Promise<jsPDF> => {
        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Load images asynchronously
        const loadImage = (src: string): Promise<HTMLImageElement> => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.src = src;
                img.onload = () => resolve(img);
                img.onerror = () => reject(`Failed to load image: ${src}`);
            });
        };

        // Await images to load
        const logo = await loadImage("/img/rps.png");
        const infoImage = await loadImage("/img/handf.png");

        const formatDate = (inputDateString: string | undefined): string => {
            if (!inputDateString) return "N/A";
            const inputDate = new Date(inputDateString);
            if (isNaN(inputDate.getTime())) return "N/A";
            const pad = (n: number) => n.toString().padStart(2, "0");
            return `${pad(inputDate.getDate())} - ${pad(inputDate.getMonth() + 1)} - ${inputDate.getFullYear()}`;
        };

        const leftMargin = 15;
        const rightMargin = 15;
        const topMargin = 20;
        let y = topMargin;

        // Add first page logo
        doc.addImage(logo, "PNG", 5, 5, 50, 15);
        y = 40;

        doc.setFont("times", "bold").setFontSize(13).setTextColor(0, 51, 153);
        doc.text("SERVICE / CALIBRATION / INSTALLATION JOB REPORT", pageWidth / 2, y, { align: "center" });
        y += 10;

        const addRow = (label: string, value: string) => {
            const labelOffset = 65;
            doc.setFont("times", "bold").setFontSize(10).setTextColor(0);
            doc.text(label + ":", leftMargin, y);
            doc.setFont("times", "normal").setTextColor(50);
            doc.text(value || "N/A", leftMargin + labelOffset, y);
            y += 7;
        };

        addRow("Report No.", formData.reportNo);
        addRow("Customer Name", formData.customerName);
        addRow("Customer Location", formData.customerLocation);
        addRow("Contact Person", formData.contactPerson);
        addRow("Status", formData.status);
        addRow("Contact Number", formData.contactNumber);
        addRow("Service Engineer", formData.serviceEngineer);
        addRow("Date", formatDate(formData.date));
        addRow("Place", formData.place);
        addRow("Place Options", formData.placeOptions);
        addRow("Nature of Job", formData.natureOfJob);
        addRow("Make & Model Number", formData.makeModelNumberoftheInstrumentQuantity);
        y += 5;
        addRow("Calibrated & Tested OK", formData.serialNumberoftheInstrumentCalibratedOK);
        addRow("Sr.No Faulty/Non-Working", formData.serialNumberoftheFaultyNonWorkingInstruments);
        y += 10;

        doc.setFont("times", "bold").setFontSize(10).setTextColor(0);
        doc.text("Engineer Report:", leftMargin, y);
        y += 5;

        const engineerReportHeight = 30;
        doc.setDrawColor(0);
        doc.setLineWidth(0.2);
        doc.rect(leftMargin, y, pageWidth - leftMargin - rightMargin, engineerReportHeight);

        const engineerReportLines = doc.splitTextToSize(formData.engineerReport || "No report provided", pageWidth - leftMargin - rightMargin - 5);
        doc.setFont("times", "normal").setFontSize(9).setTextColor(0);
        doc.text(engineerReportLines, leftMargin + 2, y + 5);
        y += engineerReportHeight + 5;

        doc.addPage();
        y = topMargin;

        doc.setFont("times", "bold").setFontSize(10).setTextColor(0);
        doc.text("ENGINEER REMARKS", leftMargin, y + 8);
        y += 10;

        const tableHeaders = ["Sr. No.", "Service/Spares", "Part No.", "Rate", "Quantity", "Total", "PO No."];
        const colWidths = [15, 50, 25, 20, 20, 25, 25];
        let x = leftMargin;

        tableHeaders.forEach((header, i) => {
            doc.rect(x, y, colWidths[i], 8);
            doc.text(header, x + 2, y + 6);
            x += colWidths[i];
        });

        y += 8;

        formData.engineerRemarks.forEach((item, index) => {
            x = leftMargin;
            const values = [
                String(index + 1),
                item.serviceSpares || "",
                item.partNo || "",
                item.rate || "",
                item.quantity || "",
                item.total || "",
                item.poNo || ""
            ];
            values.forEach((val, i) => {
                doc.rect(x, y, colWidths[i], 8);
                doc.text(val, x + 2, y + 6);
                x += colWidths[i];
            });
            y += 8;
            if (y + 50 > pageHeight) {
                doc.addPage();
                y = topMargin;
            }
        });

        y += 10;

        doc.setFont("times", "bold").setFontSize(10).setTextColor(0);
        doc.text("Customer Remark:", leftMargin, y);
        y += 5;

        const customerReportHeight = 30;
        doc.setDrawColor(0);
        doc.setLineWidth(0.2);
        doc.rect(leftMargin, y, pageWidth - leftMargin - rightMargin, customerReportHeight);


        const customerReportLines = doc.splitTextToSize(formData.customerReport || "No report provided", pageWidth - leftMargin - rightMargin - 5);
        doc.setFont("times", "normal").setFontSize(9).setTextColor(0);
        doc.text(customerReportLines, leftMargin + 2, y + 5);
        y += customerReportHeight + 5;
        doc.setFont("times", "normal");
        y += 35;
        doc.text("Customer Name,Seal & Sign", leftMargin, y);
        


        // Right side: Service Engineer
        doc.text("Service Engineer,Seal & Sign", pageWidth - rightMargin - 40, y);
        doc.text(formData.serviceEngineer || "", pageWidth - rightMargin - 40, y + 5);
        doc.text(formData.serviceEngineer || "", pageWidth - rightMargin - 40, y + 5);

        // Add logo to all pages (same as your first code)
        const addLogoToAllPages = () => {
            const logoX = 5;
            const logoY = 5;
            const logoWidth = 50;
            const logoHeight = 15;
            const pageCount = doc.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.addImage(logo, "PNG", logoX, logoY, logoWidth, logoHeight);
            }
        };

        addLogoToAllPages();

        // Add footer image to all pages
        const addFooterImage = () => {
            const footerY = pageHeight - 20;
            const footerWidth = 180;
            const footerHeight = 15;
            const footerX = (pageWidth - footerWidth) / 2;
            const pageCount = doc.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.addImage(infoImage, "PNG", footerX, footerY, footerWidth, footerHeight);
            }
        };

        addFooterImage();

        return doc;
    };


    const handleDownload = async () => {
        if (!generatedPdfBlob) {
            toast({
                title: "Error",
                description: "No PDF generated yet",
                variant: "destructive",
            });
            return;
        }

        // First, download the PDF
        try {
            const url = URL.createObjectURL(generatedPdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `service-${formData.reportNo}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);


            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (downloadError) {
            console.error("Download failed:", downloadError);
            toast({
                title: "Download Error",
                description: "Failed to download PDF",
                variant: "destructive",
            });
            return;
        }


        setIsSendingPDF(true);
        try {

            const base64data = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const result = reader.result?.toString().split(',')[1];
                    if (result) {
                        resolve(result);
                    } else {
                        reject(new Error("Failed to convert PDF to base64"));
                    }
                };
                reader.onerror = () => reject(new Error("FileReader error"));
                reader.readAsDataURL(generatedPdfBlob);
            });

            // Send to API
            const response = await axios.post('/api/send-service', {
                serviceId: formData.id || formData.serviceId || uuidv4(),
                pdfData: base64data,
                customerName: formData.customerName,

            }, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem("token")}`,
                    'Content-Type': 'application/json'
                }
            });

            toast({
                title: "Success",
                description: "PDF downloaded and sent via email successfully",
                variant: "default",
            });

        } catch (error: any) {
            console.error("Error sending email:", error);
            toast({
                title: "PDF Downloaded",
                description: "PDF was downloaded but email failed: " +
                    (error.response?.data?.error || error.message || "Email service error"),
                variant: "destructive",
            });
        } finally {
            setIsSendingPDF(false);
        }
    };




    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!validateForm()) {
            setLoading(false);
            return;
        }

        try {

            const doc = await generatePDFDocument();
            const pdfBlob = doc.output('blob');
            setGeneratedPdfBlob(pdfBlob);

            // Prepare payload
            const payload = {
                id: formData.id || uuidv4(),
                serviceId: formData.serviceId || formData.id || uuidv4(),
                customerName: formData.customerName.trim(),
                customerLocation: formData.customerLocation.trim(),
                contactPerson: formData.contactPerson.trim(),
                contactNumber: formData.contactNumber.trim(),
                serviceEngineer: formData.serviceEngineer.trim(),
                serviceEngineerId: formData.serviceEngineerId,
                date: formData.date,
                place: formData.place.trim(),
                placeOptions: formData.placeOptions,
                natureOfJob: formData.natureOfJob.trim(),
                reportNo: formData.reportNo.trim(),
                makeModelNumberoftheInstrumentQuantity: formData.makeModelNumberoftheInstrumentQuantity.trim(),
                serialNumberoftheInstrumentCalibratedOK: formData.serialNumberoftheInstrumentCalibratedOK.trim(),
                serialNumberoftheFaultyNonWorkingInstruments: formData.serialNumberoftheFaultyNonWorkingInstruments.trim(),
                engineerReport: formData.engineerReport.trim(),
                customerReport: formData.customerReport?.trim() || "",
                engineerRemarks: formData.engineerRemarks
                    .filter(remark => remark.serviceSpares.trim())
                    .map(remark => ({
                        serviceSpares: remark.serviceSpares.trim(),
                        partNo: remark.partNo.trim(),
                        rate: remark.rate.toString().trim(),
                        quantity: Number(remark.quantity),
                        total: remark.total.toString().trim(),
                        poNo: remark.poNo.trim()
                    })),
                engineerName: formData.engineerName.trim(),
                engineerId: formData.engineerId,
                status: formData.status || "checked"
            };

            // Save service data
            const response = await axios({
                method: 'post',
                url: '/api/services',
                data: payload,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem("token")}`,
                    'Content-Type': 'application/json',
                }
            });

            // Set service response with download URL
            const pdfUrl = URL.createObjectURL(pdfBlob);
            setService({
                serviceId: payload.serviceId,
                message: "Service created successfully",
                downloadUrl: pdfUrl
            });

            toast({
                title: "Success",
                description: "Service created and PDF generated successfully",
                variant: "default",
            });

        } catch (err: any) {
            console.error("API Error:", err);
            setError(err.response?.data?.error || "Failed to create service");
            toast({
                title: "Error",
                description: err.response?.data?.error || "An error occurred",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };
    function handleStartDateChange(event: ChangeEvent<HTMLInputElement>): void {
        setStartDate(event.target.value);
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem className="hidden md:block">
                                    <BreadcrumbLink href="/user/dashboard">
                                        Dashboard
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/user/servicerecord">
                                        Service Record
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8 pt-15">
                    <Card className="max-w-6xl mx-auto">
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold text-center">
                                {isEditMode ? "Update Service" : "Create Service"}
                            </CardTitle>
                            <CardDescription className="text-center">
                                {isEditMode
                                    ? "Modify the service details below"
                                    : "Fill out the form below to create a new service"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div className="relative w-full">
                                        <input
                                            type="text"
                                            name="customerName"
                                            placeholder="Customer Name"
                                            value={formData.customerName}
                                            onChange={(e) => {
                                                handleChange(e);
                                                setShowDropdown(true);
                                            }}
                                            onFocus={() => setShowDropdown(true)}
                                            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                                            className="w-full bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-2 rounded-md"
                                            required
                                        />
                                        {showDropdown && (
                                            <ul className="absolute left-0 top-full mt-1 z-20 w-full rounded-md border bg-white shadow-lg max-h-60 overflow-y-auto">
                                                {isLoadingContacts ? (
                                                    <li className="px-4 py-2 text-gray-500">Loading contacts...</li>
                                                ) : filteredContacts.length > 0 ? (
                                                    filteredContacts.map((contact) => (
                                                        <li
                                                            key={contact.id}
                                                            className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                                                            onClick={() => {
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    customerName: contact.companyName || "",
                                                                    contactPerson: contact.firstName || "",
                                                                    contactNumber: contact.contactNo || "",
                                                                }));
                                                                setShowDropdown(false);
                                                            }}
                                                        >
                                                            <div className="font-medium">{contact.companyName || "No company"}</div>
                                                            <div className="text-sm text-gray-600">
                                                                {`Contact: ${contact.firstName} | Phone: ${contact.contactNo}`}
                                                            </div>
                                                        </li>
                                                    ))
                                                ) : (
                                                    <li className="px-4 py-2 text-gray-500">
                                                        {contactPersons.length === 0
                                                            ? "Go to create contact and add data"
                                                            : "No matching contacts found"}
                                                    </li>
                                                )}
                                            </ul>
                                        )}

                                    </div>
                                    <input
                                        type="text"
                                        name="customerLocation"
                                        placeholder="Site Location"
                                        value={formData.customerLocation}
                                        onChange={handleChange}
                                        className="w-full bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-2 rounded-md"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <input
                                        type="text"
                                        name="contactPerson"
                                        placeholder="Contact Person"
                                        value={formData.contactPerson}
                                        onChange={handleChange}
                                        className="w-full bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-2 rounded-md"
                                        required
                                    />
                                    <input
                                        type="tel"
                                        name="contactNumber"
                                        placeholder="Contact Number"
                                        value={formData.contactNumber}
                                        onChange={handleChange}
                                        className="w-full bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-2 rounded-md"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="w-full bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-2 rounded-md"
                                        required
                                    >
                                        <option value="checked">Checked</option>
                                        <option value="unchecked">Unchecked</option>
                                    </select>
                                    <select
                                        name="serviceEngineerId"
                                        value={formData.serviceEngineerId || ""}
                                        onChange={handleServiceEngineerChange}
                                        className="w-full bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-2 rounded-md"
                                        required
                                        disabled={isLoadingEngineers}
                                    >
                                        <option value="">{isLoadingEngineers ? "Loading engineers..." : "Select Service Engineer"}</option>
                                        {serviceEngineers.map((engineer) => (
                                            <option key={engineer.id} value={engineer.id}>
                                                {engineer.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <input
                                        type="date"
                                        name="dateOfCalibration"
                                        value={startDate}
                                        onChange={handleStartDateChange}
                                        className="p-2 rounded-md border bg-gray-300"
                                        min="2000-01-01"
                                        max="2100-12-31"
                                    />
                                    <input
                                        type="text"
                                        name="place"
                                        placeholder="Enter Place"
                                        value={formData.place}
                                        onChange={handleChange}
                                        className="w-full bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-2 rounded-md"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <label className="font-medium text-black">Place :</label>
                                    <div className="flex gap-4">
                                        {["At Site", "In House"].map((option) => (
                                            <label key={option} className="flex items-center cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="placeOptions"
                                                    value={option}
                                                    checked={formData.placeOptions === option}
                                                    onChange={handleChange}
                                                    className={`
                        appearance-none w-4 h-4 border border-gray-400 rounded-full mr-2
                        checked:bg-blue-600 checked:border-blue-600
                        transition-colors duration-200
                    `}
                                                    style={{
                                                        backgroundColor:
                                                            formData.placeOptions === option ? "#2563EB" : "#ffffff",
                                                    }}
                                                />
                                                <span className="text-black">{option}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <label className="font-medium text-black">Nature of Job :</label>
                                    <div className="flex gap-4 flex-wrap">
                                        {["AMC", "Charged", "Warranty"].map((option) => (
                                            <label key={option} className="flex items-center cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="natureOfJob"
                                                    value={option}
                                                    checked={formData.natureOfJob === option}
                                                    onChange={handleChange}
                                                    className={`
                        appearance-none w-4 h-4 border border-gray-400 rounded-full mr-2
                        checked:bg-blue-600 checked:border-blue-600
                        transition-colors duration-200
                    `}
                                                    style={{
                                                        backgroundColor:
                                                            formData.natureOfJob === option ? "#2563EB" : "#ffffff",
                                                    }}
                                                />
                                                <span className="text-black">{option}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <input
                                        type="text"
                                        name="reportNo"
                                        placeholder="Report Number"
                                        value={formData.reportNo}
                                        onChange={handleChange}
                                        readOnly
                                        className="bg-gray-100 text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-2 rounded-md"
                                    />
                                    <select
                                        name="engineerName"
                                        value={formData.engineerName}
                                        onChange={handleChange}
                                        className="bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-2 rounded-md"
                                        required
                                    >
                                        <option value="">Select Engineer</option>
                                        {engineers.map((eng) => (
                                            <option key={eng.id} value={eng.name}>
                                                {eng.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <input
                                        name="makeModelNumberoftheInstrumentQuantity"
                                        placeholder="Model Number of the Instrument Quantity"
                                        value={formData.makeModelNumberoftheInstrumentQuantity}
                                        onChange={handleChange}
                                        className="w-full bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-2 rounded-md"
                                        required
                                    />
                                    <input
                                        name="serialNumberoftheInstrumentCalibratedOK"
                                        placeholder="Serial Number of the Instrument Calibrated & OK"
                                        value={formData.serialNumberoftheInstrumentCalibratedOK}
                                        onChange={handleChange}
                                        className="w-full bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-2 rounded-md"
                                        required
                                    />
                                    <input
                                        name="serialNumberoftheFaultyNonWorkingInstruments"
                                        placeholder="Serial Number of Faulty / Non-Working Instruments"
                                        value={formData.serialNumberoftheFaultyNonWorkingInstruments}
                                        onChange={handleChange}
                                        className="w-full bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-2 rounded-md"
                                        required
                                    />
                                    <input
                                        name="engineerReport"
                                        placeholder="Engineer Report"
                                        value={formData.engineerReport}
                                        onChange={handleChange}
                                        className="w-full bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-2 rounded-md"
                                        required
                                    />
                                </div>

                                <div className="flex justify-end mb-4">
                                    <button
                                        type="button"
                                        onClick={addEngineerRemark}
                                        className="bg-purple-950 text-white px-4 py-2 border rounded hover:bg-purple-900"
                                        disabled={formData.engineerRemarks.length >= 10}
                                    >
                                        Add Engineer Remark
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="table-auto border-collapse border border-gray-500 rounded w-full">
                                        <thead>
                                            <tr>
                                                <th className="border p-2">#</th>
                                                <th className="border p-2">Service / Spares</th>
                                                <th className="border p-2">Part Number</th>
                                                <th className="border p-2">Rate</th>
                                                <th className="border p-2">Quantity</th>
                                                <th className="border p-2">Total</th>
                                                <th className="border p-2">PO Number</th>
                                                <th className="border p-2">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formData.engineerRemarks.map((engineerRemark, index) => (
                                                <tr key={index}>
                                                    <td className="border p-2">{index + 1}</td>
                                                    <td className="border p-2">
                                                        <input
                                                            type="text"
                                                            value={engineerRemark.serviceSpares}
                                                            onChange={(e) => handleEngineerRemarksChange(index, 'serviceSpares', e.target.value)}
                                                            className="w-full bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-1 rounded-md"
                                                            required
                                                        />
                                                    </td>
                                                    <td className="border p-2">
                                                        <input
                                                            type="text"
                                                            value={engineerRemark.partNo}
                                                            onChange={(e) => handleEngineerRemarksChange(index, 'partNo', e.target.value)}
                                                            className="w-full bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-1 rounded-md"
                                                            required
                                                        />
                                                    </td>
                                                    <td className="border p-2">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={engineerRemark.rate}
                                                            onChange={(e) => handleEngineerRemarksChange(index, 'rate', e.target.value)}
                                                            className="w-full bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-1 rounded-md"
                                                            required
                                                        />
                                                    </td>
                                                    <td className="border p-2">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={engineerRemark.quantity}
                                                            onChange={(e) => handleEngineerRemarksChange(index, 'quantity', e.target.value)}
                                                            className="w-full bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-1 rounded-md"
                                                            required
                                                        />
                                                    </td>
                                                    <td className="border p-2">
                                                        <input
                                                            type="text"
                                                            value={engineerRemark.total || ""}
                                                            readOnly
                                                            className="w-full bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-1 rounded-md"
                                                        />
                                                    </td>
                                                    <td className="border p-2">
                                                        <input
                                                            type="text"
                                                            value={engineerRemark.poNo}
                                                            onChange={(e) => handleEngineerRemarksChange(index, 'poNo', e.target.value)}
                                                            className="w-full bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-1 rounded-md"
                                                            required
                                                        />
                                                    </td>
                                                    <td className="border p-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeEngineerRemark(index)}
                                                            className="text-black-600 hover:text-black-800"
                                                            aria-label="Remove remark"
                                                        >
                                                            <Trash2 className="h-5 w-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {formData.engineerRemarks.length === 0 && (
                                                <tr>
                                                    <td colSpan={8} className="border p-2 text-center text-gray-500">
                                                        Click "Add Engineer Remark" to add one
                                                    </td>
                                                </tr>
                                            )}
                                            {formData.engineerRemarks.length >= 10 && (
                                                <tr>
                                                    <td colSpan={8} className="border p-2 text-center text-yellow-600">
                                                        Maximum limit of 10 engineer remarks reached.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <input
                                        name="customerReport"
                                        placeholder="Customer Report"
                                        value={formData.customerReport}
                                        onChange={handleChange}
                                        className="w-full bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-2 rounded-md"
                                    />
                                </div>
                                {error && (
                                    <div className="text-red-500 text-sm p-2 border border-red-300 rounded bg-red-50">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="bg-blue-950 hover:bg-blue-900 text-white p-2 rounded-md w-full"
                                    disabled={loading}
                                >
                                    {loading ? "Generating..." : "Generate Service Report"}
                                </button>
                            </form>

                            {service?.serviceId && (
                                <div className="mt-4 text-center space-y-2">
                                    <p className="text-green-600 mb-2">Service created successfully</p>
                                    <div className="flex gap-4 justify-center">
                                        <button
                                            onClick={handleDownload}
                                            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                                            disabled={!generatedPdfBlob}
                                        >
                                            Download PDF & sendMail
                                        </button>

                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}