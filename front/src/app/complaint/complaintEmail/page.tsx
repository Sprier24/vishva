"use client";
import React, { useState, useRef } from "react";
import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { IoIosSend, IoMdAttach } from "react-icons/io";
import { toast } from "@/hooks/use-toast"
import {
    MdFormatBold, MdFormatItalic, MdFormatUnderlined, MdFormatAlignLeft, MdFormatAlignCenter, MdFormatAlignRight,
    MdFormatListBulleted, MdFormatListNumbered, MdFormatIndentIncrease, MdFormatIndentDecrease,
    MdSubscript, MdSuperscript, MdTableChart, MdHorizontalRule
} from "react-icons/md";
import SearchBar from '@/components/globalSearch';
import Notification from '@/components/notification';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Calendar1 } from "lucide-react";

const EmailInput: React.FC = () => {
    const [to, setTo] = useState("");
    const [subject, setSubject] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messageRef = useRef<HTMLDivElement>(null);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [showTablePicker, setShowTablePicker] = useState(false);
    const [selectedRows, setSelectedRows] = useState(0);
    const [selectedCols, setSelectedCols] = useState(0);
    const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
const [isSending, setIsSending] = useState(false);

    const handleFileClick = () => fileInputRef.current?.click();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            setAttachments([...attachments, ...Array.from(files)]);
        }
    };
// Remove an attachment from the list
const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
};


const handleSendEmail = async () => {
    if (!to) {
        toast({
            title: "Error",
            description: "Please enter at least one recipient.",
            variant: "destructive",
        });
        return;
    }

    if (!subject) {
        setConfirmModalOpen(true);
        return;
    }

    sendEmail();
};

const sendEmail = async () => {
    setIsSending(true);
    const formData = new FormData();
    formData.append("to", to);
    formData.append("subject", subject);
    formData.append("message", messageRef.current?.innerHTML.trim() || "");
    attachments.forEach((file) => formData.append("attachments[]", file));

    try {
        const response = await fetch('http://localhost:8000/api/v1/complaint/sendEmailComplaint', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) throw new Error("Failed to send email");

        toast({
            title: "Email Sent Successfully",
            description: "The email has been sent successfully",
        });

        setTo("");
        setSubject("");
        setAttachments([]);
        if (messageRef.current) messageRef.current.innerHTML = "";
    } catch (error) {
        console.error("Error sending email:", error);
        toast({
            title: "Error",
            description: error instanceof Error ? error.message : "There was an error sending the email",
            variant: "destructive",
        });
    } finally {
        setIsSending(false);
        setConfirmModalOpen(false);
    }
};


    const applyFormatting = (command: string, value?: string) => {
        document.execCommand(command, false, value || "");
    };

     {/* Insert Table Function */ }
     const insertTable = () => {
        const messageDiv = messageRef.current;
        if (!messageDiv) return;

        let tableHTML = `<table style="width: 100%; border-collapse: collapse; border: 1px solid black;">`;

        for (let i = 0; i < selectedRows; i++) {
            tableHTML += "<tr>";
            for (let j = 0; j < selectedCols; j++) {
                tableHTML += `<td style="border: 1px solid black; padding: 8px;"></td>`;
            }
            tableHTML += "</tr>";
        }

        tableHTML += "</table><br/>";
        messageDiv.innerHTML += tableHTML;

        // Close Table Picker
        setShowTablePicker(false);
    };


    const insertHorizontalLine = () => {
        const messageDiv = messageRef.current;
        if (messageDiv) {
            const hr = document.createElement("hr");
            hr.style.margin = "10px 0"; // Add spacing
            messageDiv.appendChild(hr);
        }
    };
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4"/>
                        <Breadcrumb>
                        <BreadcrumbList className="flex items-center space-x-2">
                            <BreadcrumbItem className="hidden sm:block md:block">
                            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden sm:block md:block"/>
                            <BreadcrumbItem className="hidden sm:block md:block">
                            <BreadcrumbLink href="/complaint/table">Complaint</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden sm:block md:block" />
                            <span className="hidden sm:block md:block">
                                Complaint Email
                            </span>
                        </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <div className="flex items-center space-x-4 ml-auto mr-4">
                        <div  >
                            <SearchBar />
                        </div>
                        <a href="/calendar">
                            <div>
                                <Calendar1 />
                            </div>
                        </a>
                        <div>
                            <Notification />
                        </div>
                    </div>
                </header>
                {showTablePicker && (
                    <div
                        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-10 z-50"
                        onClick={() => setShowTablePicker(false)} // Click outside to close
                    >
                        <div
                            className="bg-white shadow-md p-4 border rounded-md"
                            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
                        >
                            <div className="grid grid-cols-6 gap-1">
                                {[...Array(6)].map((_, row) =>
                                    [...Array(6)].map((_, col) => (
                                        <div
                                            key={`${row}-${col}`}
                                            className={`w-8 h-8 border ${row < selectedRows && col < selectedCols ? "bg-blue-300" : "bg-gray-100"}`}
                                            onMouseEnter={() => {
                                                setSelectedRows(row + 1);
                                                setSelectedCols(col + 1);
                                            }}
                                            onClick={insertTable}
                                        />
                                    ))
                                )}
                            </div>
                            <p className="text-center mt-2 text-sm">Size: {selectedRows} × {selectedCols}</p>
                        </div>
                    </div>
                )}

                
                <div className="p-6 w-full mx-auto">
                    <Card className="border border-gray-300 shadow-md rounded-lg">
                        <CardContent className="p-6 space-y-4">
                            <h2 className="text-lg font-semibold">New Message</h2>
                            <Separator className="my-2 border-gray-300" />
                            <div className="flex items-center space-x-4">
                                <label className="text-sm font-medium w-20">To:</label>
                                <Input type="email" placeholder="" value={to} onChange={(e) => setTo(e.target.value)} />
                            </div>
                            <div className="flex items-center space-x-4">
                                <label className="text-sm font-medium w-20">Subject:</label>
                                <Input type="text" placeholder="" value={subject} onChange={(e) => setSubject(e.target.value)} />
                            </div>
                            <div className="border border-gray-300 rounded-md h-60 p-2 overflow-y-auto" contentEditable ref={messageRef} />  {attachments.length > 0 && (
                                <div className="mt-2 border border-gray-300 rounded-md p-2">
                                    <h4 className="text-sm font-medium">Attachments:</h4>
                                    <ul className="space-y-1">
                                        {attachments.map((file, index) => (
                                            <li key={index} className="flex justify-between items-center text-sm p-1 bg-gray-100 rounded">
                                                <span className="truncate">{file.name}</span>
                                                <button
                                                    className="text-red-500 hover:text-red-700"
                                                    onClick={() => handleRemoveAttachment(index)}
                                                >
                                                    ❌
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            <div className="flex flex-wrap items-center gap-2 border border-gray-300 p-2 rounded-md">
                              
                            <IoMdAttach className="text-xl cursor-pointer hover:text-gray-500" onClick={handleFileClick} />
                            {/* Display selected files with remove option */}

                                <Button variant="outline" onClick={() => applyFormatting("bold")}><MdFormatBold /></Button>
                                <Button variant="outline" onClick={() => applyFormatting("italic")}><MdFormatItalic /></Button>
                                <Button variant="outline" onClick={() => applyFormatting("underline")}><MdFormatUnderlined /></Button>
                                <a className="flex items-center space-x-1 cursor-pointer">
                                    <span className="font-bold text-lg">A</span>
                                    <input
                                        type="color"
                                        className="w-8 h-8 border-none cursor-pointer"
                                        onChange={(e) => applyFormatting("foreColor", e.target.value)}
                                    />
                                </a>                                
                                <select onChange={(e) => applyFormatting("fontName", e.target.value)} className="border p-1 rounded">
                                    <option value="Arial">Arial</option>
                                    <option value="Times New Roman">Times New Roman</option>
                                    <option value="Courier New">Courier New</option>
                                    <option value="Georgia">Georgia</option>
                                    <option value="Verdana">Verdana</option>
                                </select>
                                <select onChange={(e) => applyFormatting("fontSize", e.target.value)} className="border p-1 rounded">
                                    <option value="1">Small</option>
                                    <option value="3">Medium</option>
                                    <option value="5">Large</option>
                                    <option value="7">Extra Large</option>
                                    </select>
                                <Button variant="outline" onClick={() => applyFormatting("justifyLeft")}><MdFormatAlignLeft /></Button>
                                <Button variant="outline" onClick={() => applyFormatting("justifyCenter")}><MdFormatAlignCenter /></Button>
                                <Button variant="outline" onClick={() => applyFormatting("justifyRight")}><MdFormatAlignRight /></Button>
                                <Button variant="outline" onClick={() => applyFormatting("indent")}><MdFormatIndentIncrease /></Button>
                                <Button variant="outline" onClick={() => applyFormatting("outdent")}><MdFormatIndentDecrease /></Button>
                                <Button variant="outline" onClick={() => applyFormatting("subscript")}><MdSubscript /></Button>
                                <Button variant="outline" onClick={() => applyFormatting("superscript")}><MdSuperscript /></Button>
                                <Button variant="outline" onClick={() => setShowTablePicker(true)} ><MdTableChart /></Button>
                                <Button variant="outline" onClick={insertHorizontalLine}>
                                    <MdHorizontalRule />
                                </Button>
                            </div>
                            <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} />
                            <Button className="flex items-center space-x-2" onClick={handleSendEmail}><IoIosSend /><span>Send</span></Button>

                             <Dialog open={isConfirmModalOpen} onOpenChange={setConfirmModalOpen}>
                             <DialogContent className="fixed left-1/2 top-[5.5rem] transform -translate-x-1/2 z-[9999] w-full max-w-md bg-white shadow-lg rounded-lg p-6">
                             <DialogHeader>
                    <DialogTitle>Send Email Without Subject?</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to send this email without a subject?
                    </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setConfirmModalOpen(false)}>Cancel</Button>
                    <Button onClick={sendEmail} disabled={isSending}>
                        {isSending ? "Sending..." : "Send Anyway"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
                        </CardContent>
                    </Card>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
};
export default EmailInput;