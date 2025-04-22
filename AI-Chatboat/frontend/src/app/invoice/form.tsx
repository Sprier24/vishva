"use client";

import * as z from "zod"
import { format } from "date-fns"
import { useForm } from "react-hook-form"
import { toast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const formSchema = z.object({
  companyName: z.string().nonempty({ message: "Required" }),
  customerName: z.string().nonempty({ message: "Required" }),
  contactNumber: z
    .string()
    .regex(/^\d*$/, { message: "Contact number must be numeric" })
    .optional(),
  emailAddress: z.string().optional(),
  address: z.string().optional(),
  gstNumber: z.string().optional(),
  productName: z.string().nonempty({ message: "Required" }),
  amount: z.number().positive({ message: "Required" }),
  discount: z.number().optional(),
  gstRate: z.number().optional(),
  status: z.enum(["Paid", "Unpaid"]),
  date: z.date().refine((val) => !isNaN(val.getTime()), { message: "Required" }),
  paidAmount: z.number().optional(),
  remainingAmount: z.number().optional(),
  totalWithoutGst: z.number().optional(),
  totalWithGst: z.number().optional(),
});

export default function InvoiceForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      customerName: "",
      contactNumber: "",
      emailAddress: "",
      address: "",
      gstNumber: "",
      productName: "",
      amount: undefined,
      discount: undefined,
      gstRate: 0,
      status: "Unpaid",
      date: new Date(),
      totalWithoutGst: 0,
      totalWithGst: 0,
      paidAmount: 0,
      remainingAmount: 0,
    },
  });

  const { watch, setValue } = form;
  const amount = watch("amount") ?? 0;
  const discount = watch("discount") ?? 0;
  const gstRate = watch("gstRate") ?? 0;
  const paidAmount = watch("paidAmount") ?? 0;

  useEffect(() => {
    const totalAmount = Number(amount);
    const totalDiscount = Number(discount);
    const totalGstRate = Number(gstRate);
    const totalPaidAmount = Number(paidAmount);
    const { totalWithoutGst, totalWithGst, remainingAmount } = calculateGST(
      totalAmount,
      totalDiscount,
      totalGstRate,
      totalPaidAmount
    );
    setValue("totalWithoutGst", totalWithoutGst);
    setValue("totalWithGst", totalWithGst);
    setValue("remainingAmount", remainingAmount);
  }, [amount, discount, gstRate, paidAmount, setValue]);

  const calculateGST = (amount: number, discount: number, gstRate: number, paidAmount: number) => {
    const discountedAmount = amount - amount * (discount / 100);
    const gstAmount = discountedAmount * (gstRate / 100);
    const totalWithoutGst = discountedAmount;
    const totalWithGst = discountedAmount + gstAmount;
    const remainingAmount = totalWithGst - paidAmount;
    return {
      totalWithoutGst,
      totalWithGst,
      remainingAmount,
    };
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const response = await fetch("http://localhost:8000/api/v1/invoice/invoiceAdd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit the invoice");
      }
      toast({
        title: "Invoice Submitted",
        description: `The invoice has been successfully created`,
      });
      router.push(`/invoice/table`);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "There was an error creating the invoice",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
                  <Input placeholder="Enter client / customer Name" {...field} />
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
                <FormLabel>Contact Number (Optional)</FormLabel>
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
                <FormLabel>Email Address (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Enter valid email address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Address (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Enter full company address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="gstNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GST Number (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Enter GST number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
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
            name="discount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discount (%)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter discount"
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
          <FormField
            control={form.control}
            name="gstRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GST Rate (%)</FormLabel>
                <FormControl>
                  <select
                    {...field}
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
                  ><option value="">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                    <option value="35">35%</option>
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
            name="paidAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Paid Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter paid amount"
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
          <FormField
            control={form.control}
            name="remainingAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Remaining Amount</FormLabel>
                <FormControl>
                  <Input type="number" {...field} readOnly />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 justify-items-stretch">
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
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <div className="form-group">
                <label htmlFor="date" className="text-sm font-medium text-gray-700">
                  Invoice Date
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
        </div>
        <div className="flex justify-center sm:justify-end">
          <Button type="submit" className="w-full sm:w-auto flex items-center justify-center" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              "Create Invoice"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}