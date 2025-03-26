"use client"

import * as z from "zod"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { format } from "date-fns"
import { toast } from "@/hooks/use-toast"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, Loader2 } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const formSchema = z.object({
    companyName: z.string().nonempty({ message: "Company name is required" }),
    customerName: z.string().nonempty({ message: "Customer name is required" }),
    contactNumber: z
        .string()
        .regex(/^\d*$/, { message: "Contact number must be numeric" })
        .nonempty({ message: "Contact number is required" }),
    emailAddress: z.string().email({ message: "Invalid email address" }),
    address: z.string().nonempty({ message: "Company address is required" }),
    productName: z.string().nonempty({ message: "Product name is required" }),
    amount: z.number().positive({ message: "Product amount is required" }),
    gstNumber: z.string().nonempty({ message: "GST number is required" }),
    status: z.enum(["Proposal", "New", "Discussion", "Demo", "Decided"]),
    date: z.date().refine((val) => !isNaN(val.getTime()), { message: "Lead Date is required" }),
    endDate: z.date().refine((val) => !isNaN(val.getTime()), { message: "Final Date is required" }),
    notes: z.string().optional(),
    isActive: z.boolean(),
});

export default function LeadForm() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            companyName: "",
            customerName: "",
            contactNumber: "",
            emailAddress: "",
            address: "",
            productName: "",
            amount: undefined,
            gstNumber: "",
            status: "New",
            date: new Date(),
            endDate: undefined,
            notes: "",
            isActive: true,
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true)
        try {
            const response = await fetch("http://localhost:8000/api/v1/lead/createLead", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            })
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to submit the lead")
            }
            toast({
                title: "Lead Submitted",
                description: `The lead has been successfully created`,
            })
            router.push("/lead/table")
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "There was an error creating the lead",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="companyName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Company Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter company name" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="customerName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Client / Customer Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter client / customer name" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="contactNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Contact Number</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Enter contact number"
                                        type="tel"
                                        {...field}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/[^0-9]/g, '');
                                            field.onChange(value);
                                        }}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="emailAddress"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email Address</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter valid email address" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Company Address</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter full company address" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="productName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Product Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter product name" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Product Amount</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Enter product amount"
                                        type="number"
                                        {...field}
                                        onChange={(e) => {
                                            const value = e.target.valueAsNumber || "";
                                            field.onChange(value);
                                        }}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="gstNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>GST Number</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter GST number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status</FormLabel>
                                <FormControl>
                                    <select
                                        {...field}
                                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
                                    >
                                        <option value="Proposal">Proposal</option>
                                        <option value="New">New</option>
                                        <option value="Discussion">Discussion</option>
                                        <option value="Demo">Demo</option>
                                        <option value="Decided">Decided</option>
                                    </select>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <div className="form-group">
                                <label htmlFor="date" className="text-sm font-medium text-gray-700">
                                    Lead Date
                                </label>
                                <input
                                    type="date"
                                    name="date"
                                    id="date"
                                    value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                                    onChange={(e) => field.onChange(new Date(e.target.value))}
                                    className="w-full p-3 border border-gray-400 rounded-md text-black custom-input cursor-pointer"
                                    required
                                />
                                <style>
                                    {`
                                .custom-input:focus {
                                    border-color: black !important;
                                    box-shadow: none !important;
                                    outline: none !important;
                                }
                                `}
                                </style>
                            </div>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                            <div className="form-group">
                                <label htmlFor="endDate" className="text-sm font-medium text-gray-700">
                                    Final Date
                                </label>
                                <input
                                    type="date"
                                    name="endDate"
                                    id="endDate"
                                    value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                                    onChange={(e) => field.onChange(new Date(e.target.value))}
                                    className="w-full p-3 border border-gray-400 rounded-md text-black custom-input cursor-pointer"
                                    required
                                />
                                <style>
                                    {`
                                .custom-input:focus {
                                    border-color: black !important;
                                    box-shadow: none !important;
                                    outline: none !important;
                                }
                                `}
                                </style>
                            </div>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Notes (Optional)</FormLabel>
                            <FormControl>
                                <textarea
                                    placeholder="Enter more details here..."
                                    {...field}
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-black resize-none"
                                    rows={3}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-center sm:justify-end">
                    <Button type="submit" className="w-full sm:w-auto flex items-center justify-center" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="animate-spin mr-2" />
                                Submitting...
                            </>
                        ) : (
                            "Create Lead"
                        )}
                    </Button>
                </div>
            </form>
        </Form >
    )
}