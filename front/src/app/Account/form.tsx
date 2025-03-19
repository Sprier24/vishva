"use client";

import * as z from "zod"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const accountSchema = z.object({
  bankName: z.string().min(2, { message: "Bank name is required." }),
  IFSCCode: z.string().min(2, { message: "Bank IFSC code is required." }),
  accountHolderName: z.string().min(2, { message: "Bank account holder name is required." }),
  accountNumber: z.string().min(2, { message: "Bank account number is required." }),
  accountType: z.enum(["Current", "Savings", "Other"], { message: "Account type is required." }),
  UpiId: z.string().min(2, { message: "UpiId is required." }),
});

export default function AccountForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const form = useForm<z.infer<typeof accountSchema>>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      accountHolderName: "",
      bankName: "",
      accountNumber: "",
      accountType: "Current",
      IFSCCode: "",
      UpiId: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof accountSchema>) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("http://localhost:8000/api/v1/account/accountAdd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to submit the account.");
      }
      toast({
        title: "Account Submitted",
        description: "The account has been successfully created",
      });
      router.push("/Account/table");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "There was an error creating the account",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="bankName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bank Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter bank name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="IFSCCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bank IFSC Code</FormLabel>
                <FormControl>
                  <Input placeholder="Enter bank IFSC code" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="accountHolderName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bank Account Holder Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter bank account holder name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="accountNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bank Account Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter bank account number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="accountType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Type</FormLabel>
                <FormControl>
                  <select
                    {...field}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black cursor-pointer"
                    >
                    <option value="Savings">Savings</option>
                    <option value="Current">Current</option>
                    <option value="Other">Other</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="UpiId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>UPI ID (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Enter UPI ID" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
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
              "Create Account"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}