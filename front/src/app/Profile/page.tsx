'use client';

import Image from "next/image";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LuLoader } from "react-icons/lu";

const formSchema = z.object({
  companyName: z.string().nonempty({ message: "Required" }),
  ownerName: z.string().nonempty({ message: "Required" }),
  contactNumber: z
    .string()
    .regex(/^\d*$/, { message: "Contact number must be numeric" })
    .nonempty({ message: "Required" }),
  emailAddress: z.string().email({ message: 'Invalid email address' }),
  companyType: z.string().nonempty({ message: "Required" }),
  businessRegistration: z.string().nonempty({ message: "Required" }),
  employeeSize: z.string().nonempty({ message: "Required" }),
  panNumber: z.string().nonempty({ message: "Required" }),
  gstNumber: z.string().optional(),
  website: z.string().optional(),
  documentType: z.string().nonempty({ message: "Required" }),
  documentNumber: z.string().nonempty({ message: "Required" }),
  logo: z.instanceof(File)
    .refine(file => file.size <= 5 * 1024 * 1024, {
      message: "Logo must be less than 5MB.",
    })
    .refine(file => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type), {
      message: "Only .jpg, .png, and .webp formats are supported.",
    })
    .optional(),
});

const NewProfile: React.FC = () => {
  const router = useRouter();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: '',
      ownerName: '',
      contactNumber: '',
      emailAddress: '',
      website: '',
      documentType: '',
      documentNumber: '',
      panNumber: '',
      companyType: '',
      employeeSize: '',
      gstNumber: '',
      businessRegistration: '',
    },
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch('http://localhost:8000/api/v1/user/getuser', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const data = await response.json();
        if (data.success && data.user.email) {
          form.setValue('emailAddress', data.user.email);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast({
          title: "Error",
          description: "Failed to fetch user information. Please try again.",
          variant: "destructive",
        });
        router.push('/login');
      } finally {
        setIsRedirecting(false);
      }
    };

    fetchUserData();
  }, [form, router]);


  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];

      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        form.setError('logo', {
          type: 'manual',
          message: 'Only .jpg, .png, and .webp formats are supported.',
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        form.setError('logo', {
          type: 'manual',
          message: 'Logo must be less than 5MB.',
        });
        return;
      }

      setLogoPreview(URL.createObjectURL(file));
      form.setValue('logo', file);
      form.clearErrors('logo');
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    const formData = new FormData();

    Object.keys(values).forEach((key) => {
      const value = values[key as keyof typeof values];
      if (value instanceof File) {
        formData.append(key, value);
      } else if (typeof value === "string") {
        formData.append(key, value);
      }
    });

    try {
      const token = localStorage.getItem("authToken");
      console.log("Token being sent:", token);

      if (!token) {
        toast({
          title: "Authentication Error",
          description: "You are not logged in. Please log in and try again.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const response = await fetch("http://localhost:8000/api/v1/owner/add-owner", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      console.log("Response from server:", data);

      if (response.status === 401) {
        toast({
          title: "Unauthorized",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        });
        localStorage.removeItem("authToken");
        router.push("/login");
        return;
      }

      if (response.status === 403) {
        toast({
          title: "Unauthorized",
          description: "The email entered does not match the logged-in user's email.",
          variant: "destructive",
        });
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit the profile.");
      }

      toast({
        title: "Profile Submitted",
        description: "Your profile has been created successfully",
      });
      setIsRedirecting(true);
      router.push("/dashboard");
    } catch (error) {
      console.error("Error submitting profile:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "There was an error submitting the profile.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div >
      {isRedirecting ? (
        <div className="flex items-center justify-center h-screen">
          <LuLoader className="animate-spin text-gray-600 dark:text-gray-300" size={50} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', padding: '50px', height: '100vh' }}>
          <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', textAlign: 'center' }}>Create Profile</h1>
          <Separator className="my-4 border-gray-500 border-1" />

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 flex-grow">
              <div className="flex flex-col items-center sm:flex-row sm:items-center sm:justify-between mb-6 w-full">
                <div className="text-center">
                  <label htmlFor="logo">
                    <Image
                      src={logoPreview || 'https://via.placeholder.com/80'}
                      className="w-20 h-20 rounded-full border border-gray-300 mx-auto"
                      alt=""
                      width={80}
                      height={80}
                    />
                  </label>
                  <input
                    type="file"
                    id="logo"
                    accept="image/jpeg, image/png, image/webp"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  {form.formState.errors.logo && (
                    <p className="text-sm font-medium text-destructive mt-1">
                      {form.formState.errors.logo.message}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full sm:w-auto flex items-center justify-center mt-4 sm:mt-0"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    "Submit"
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter Company Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ownerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Owner Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter Owner Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter Contact Number"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
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
                        <Input
                          placeholder="Enter Email Address"
                          {...field}
                          type="email"
                          readOnly
                          className="bg-gray-100 cursor-not-allowed"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Type</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter Company Type" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="businessRegistration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Registration</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                        >
                          <option value="">Select Business Registration</option>
                          <option value="Private Limited">Private Limited</option>
                          <option value="One person Company">One person Company</option>
                          <option value="Partnership">Partnership</option>
                          <option value="Sole proprietorship">Sole proprietorship</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="employeeSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee Size</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                        >
                          <option value="">Select Employee Size</option>
                          <option value="1-10">1-10</option>
                          <option value="11-50">11-50</option>
                          <option value="51-100">51-100</option>
                          <option value=">100">&gt;100</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="panNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PAN Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter PAN Number (e.g., ABCDE1234F)"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value.toUpperCase().slice(0, 10);
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
                  name="gstNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GST Number (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter GST Number (e.g., 01ABCDE2345F6G7)"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value.toUpperCase();
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
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter Website URL (e.g., https://www.spriertechnology.com/)"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="documentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Type</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                        >
                          <option value="">Select Document Type</option>
                          <option value="Udhyam Aadhar Number">Udhyam Aadhar Number</option>
                          <option value="State Certificate">State Certificate</option>
                          <option value="Certificate of Incorporation">Certificate of Incorporation</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch('documentType') && (
                  <FormField
                    control={form.control}
                    name="documentNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{form.watch('documentType')}</FormLabel>
                        <FormControl>
                          <Input placeholder={`Enter ${form.watch('documentType')}`} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </form>
          </Form>
        </div>
      )
      }
    </div>
  );
};

export default NewProfile;
