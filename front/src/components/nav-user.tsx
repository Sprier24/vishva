"use client";

import axios from "axios";
import Link from "next/link";
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from "@/components/ui/progress";
import { ChevronsUpDown, LogOut, Cloud, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Owner {
  _id: string;
  logo?: string;
  companyName: string;
  ownerName: string;
  contactNumber: string;
  emailAddress: string;
  website?: string;
  businessRegistration?: string;
  companyType?: string;
  employeeSize?: string;
  panNumber?: string;
  documentType?: string;
  documentNumber?: string;
  gstNumber?: string;
  udhayamAadhar?: string;
  stateCertificate?: string;
  incorporationCertificate?: string;
}

export function NavUser() {
  const { isMobile } = useSidebar();
  const [open, setOpen] = useState(false);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [filteredOwners, setFilteredOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [editOwner, setEditOwner] = useState<Owner | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hover, setHover] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const storageValue = 33;

  const form = useForm<Owner>({
    defaultValues: {
      companyName: '',
      ownerName: '',
      contactNumber: '',
      emailAddress: '',
      website: '',
      businessRegistration: '',
      companyType: '',
      employeeSize: '',
      panNumber: '',
      documentType: '',
      documentNumber: '',
      gstNumber: '',
      udhayamAadhar: '',
      stateCertificate: '',
      incorporationCertificate: '',
    },
  });

  useEffect(() => {
    const fetchOwners = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:8000/api/v1/owner/getAllOwners");
        setOwners(response.data.data);
        const emailFromStorage = typeof window !== "undefined" ? localStorage.getItem("userEmail") : null;
        if (emailFromStorage) {
          const filtered = response.data.data.filter((owner: Owner) => owner.emailAddress === emailFromStorage);
          setFilteredOwners(filtered);
        }
      } catch (err) {
        setError("Failed to fetch owners.");
      } finally {
        setLoading(false);
      }
    };
    fetchOwners();
  }, []);

  const handleEditClick = (owner: Owner) => {
    setEditOwner(owner);
    setIsEditing(true);
    setOpen(false);
    form.reset(owner);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteAccount = async () => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    const ownerId = currentOwner?._id;

    try {
      setIsDeleting(true);
      let ownerDeleted = false;
      let userDeleted = false;
      if (ownerId) {
        const ownerResponse = await axios.delete(`http://localhost:8000/api/v1/owner/deleteOwner/${ownerId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (ownerResponse.status === 200) {
          ownerDeleted = true;
        } else {
          alert(ownerResponse.message || "Error deleting owner account.");
          return;
        }
      }

      if (userId) {
        const userResponse = await fetch("http://localhost:8000/api/v1/user/delete-account", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId }),
        });
        const userResult = await userResponse.json();
        if (userResponse.ok && userResult.success) {
          userDeleted = true;
        } else {
          alert(userResult.message || "Error deleting user account.");
          return;
        }
      }

      if (ownerDeleted || userDeleted) {
        localStorage.clear();
        router.push("/");
      } else {
        alert("Failed to delete the account.");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("An error occurred while deleting your account.");
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  const onSubmit = async (data: Owner) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.keys(data).forEach((key) => {
        if (key !== 'logo') {
          const value = data[key as keyof Owner];
          if (value !== undefined && value !== null) {
            formData.append(key, value as string);
          }
        }
      });

      if (logoPreview && logoPreview.startsWith('data:image')) {
        const blob = await fetch(logoPreview).then((res) => res.blob());
        formData.append('logo', blob, 'logo.png');
      }

      for (const [key, value] of formData.entries()) {
        console.log(key, value);
      }

      await axios.put(`http://localhost:8000/api/v1/owner/updateOwner/${editOwner?._id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setIsEditing(false);
      setEditOwner(null);
      const response = await axios.get("http://localhost:8000/api/v1/owner/getAllOwners");
      setOwners(response.data.data);
      setFilteredOwners(
        response.data.data.filter((owner: { emailAddress: string | null }) => owner.emailAddress === localStorage.getItem("userEmail"))
      );
    } catch (error) {
      console.error("Failed to update owner:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  const currentOwner = filteredOwners[0];

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="px-4 py-3 space-y-1">
            <div className="flex items-center gap-2 text-sm text-gray-600">

              <span className="font-medium">Storage</span>
            </div>  <Cloud className="size-4 text-gray-500" />
            <div
              className="relative group"
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
            >
              <Progress value={storageValue} className="h-1" />
              {hover && (
                <div className="absolute left-1/2 -top-6 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-800 px-2 py-1 text-xs text-white shadow-md">
                  {storageValue}% Used
                </div>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={currentOwner?.logo ? `http://localhost:8000/uploads/${currentOwner.logo}` : "/default-logo.png"}
                    alt={currentOwner?.ownerName || "User"}
                  />
                  <AvatarFallback className="rounded-lg">
                    {currentOwner?.ownerName?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{currentOwner?.ownerName || "User"}</span>
                  <span className="truncate text-xs">{currentOwner?.emailAddress || "No Email"}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg" side={isMobile ? "bottom" : "right"} align="end" sideOffset={4}>
              <DropdownMenuItem>
                <LogOut />
                <Link href="/login">Log out</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDeleteModalOpen(true)} className="text-red-500">
                <Trash2 className="size-4 mr-2" />
                <span>Delete Account</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <button
                  onClick={() => {
                    setOpen(false);
                    setTimeout(() => setOpen(true), 100);
                  }}
                  className="w-full text-left"

                >
                  <Dialog key={dialogKey} open={open} onOpenChange={setOpen}>
                    <DropdownMenuLabel className="p-0 font-normal">
                      <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                        <Avatar className="h-8 w-8 rounded-lg">
                          <AvatarImage
                            src={currentOwner?.logo ? `http://localhost:8000/uploads/${currentOwner.logo}` : "/default-logo.png"}
                            alt={currentOwner?.ownerName || "User"}
                          />
                          <AvatarFallback className="rounded-lg">
                            {currentOwner?.ownerName?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="truncate font-semibold">{currentOwner?.ownerName || "User"}</span>
                          <span className="truncate text-xs">{currentOwner?.emailAddress || "No Email"}</span>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                  </Dialog>
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <Dialog open={isDeleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Account Deletion</DialogTitle>
            <DialogDescription>Are you sure you want to delete your account? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] sm:max-h-[700px] overflow-auto hide-scrollbar p-4 flex flex-col items-center text-center">
          <DialogHeader className="w-full flex flex-col items-center text-center">
            <DialogTitle>Profile Details</DialogTitle>
            <hr className="my-3 border-gray-300 dark:border-gray-700 w-full" />
          </DialogHeader>
          {loading ? (
            <div className="text-center text-gray-600 dark:text-gray-400 text-lg">Loading...</div>
          ) : error ? (
            <div className="text-center text-red-600 text-lg">{error}</div>
          ) : currentOwner ? (
            <div className="relative h-full flex flex-col items-center text-center w-full">
              {/* Logo at the top, centered */}
              <div className="w-32 h-32 md:w-44 md:h-44 border border-gray-300 dark:border-gray-700 rounded-full overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-800 mb-4">
                {currentOwner.logo ? (
                  <img
                    src={`http://localhost:8000/uploads/${currentOwner.logo}`}
                    alt="Company Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-600 dark:text-gray-400 text-base md:text-lg">No Logo</span>
                )}
              </div>

              {/* Name and email centered below logo */}
              <div className="text-center mb-6">
                <div className="text-lg md:text-xl font-bold font-serif text-gray-800 dark:text-white">
                  {currentOwner.ownerName}
                </div>
                <div className="text-sm md:text-lg font-medium text-gray-600 dark:text-gray-400">
                  {currentOwner.emailAddress}
                </div>
              </div>

              {/* Two-column grid for other details */}
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-gray-700 dark:text-gray-300 py-4 md:py-6 text-base md:text-sm text-center">
                <div>
                  <span className="font-bold text-xl md:text-2xl font-semibold">Owner Name</span>
                  <span className="block text-lg md:text-xl py-2 px-3 mr-2">{currentOwner.ownerName}</span>
                </div>
                <div>
                  <span className="font-bold text-xl md:text-2xl font-semibold">Company Name</span>
                  <span className="block text-lg md:text-xl py-2 px-3 mr-2 ">{currentOwner.companyName}</span>
                </div>
                <div>
                  <span className="font-bold text-xl md:text-2xl font-semibold">Company Type</span>
                  <span className="block text-lg md:text-xl py-2 px-3 mr-2 ">{currentOwner.companyType}</span>
                </div>
                <div>
                  <span className="font-bold text-xl md:text-2xl font-semibold">Employee Size</span>
                  <span className="block text-lg md:text-xl py-2 px-3 mr-2 ">{currentOwner.employeeSize}</span>
                </div>
                <div>
                  <span className="font-bold text-xl md:text-2xl font-semibold">Contact Number</span>
                  <span className="block text-lg md:text-xl py-2 px-3 mr-2">{currentOwner.contactNumber}</span>
                </div>
                <div>
                  <span className="font-bold text-xl md:text-2xl font-semibold">Email Address</span>
                  <span className="block text-lg md:text-xl py-2 px-3 mr-2">{currentOwner.emailAddress}</span>
                </div>
                <div>
                  <span className="font-bold text-xl md:text-2xl font-semibold">Document Type</span>
                  <span className="block text-lg md:text-xl py-2 px-3 mr-2">{currentOwner.documentType}</span>
                </div>
                <div>
                  <span className="font-bold text-xl md:text-2xl font-semibold">Document Number</span>
                  <span className="block text-lg md:text-xl py-2 px-3 mr-2">{currentOwner.documentNumber || "N/A"}</span>
                </div>
                <div>
                  <span className="font-bold text-xl md:text-2xl font-semibold">PAN Number</span>
                  <span className="block text-lg md:text-xl py-2 px-3 mr-2">{currentOwner.panNumber}</span>
                </div>
                <div>
                  <span className="font-bold text-xl md:text-2xl font-semibold">Business Registration</span>
                  <span className="block text-lg md:text-xl py-2 px-3 mr-2">{currentOwner.businessRegistration}</span>
                </div>
                <div>
                  <span className="font-bold text-xl md:text-2xl font-semibold">GST Number</span>
                  <span className="block text-lg md:text-xl py-2 px-3 mr-2">{currentOwner.gstNumber}</span>
                </div>
                {currentOwner.website && (
                  <div>
                    <span className="font-bold text-xl md:text-2xl font-semibold">Company Website</span>
                    <br />
                    <a
                      href={currentOwner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 dark:text-blue-400 underline"
                    >
                      {currentOwner.website}
                    </a>
                  </div>
                )}
              </div>
              <div className="flex justify-end mt-6">
                <button
                  type="submit"
                  className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-400 w-full sm:w-auto text-sm sm:text-base"
                  onClick={() => handleEditClick(currentOwner)}
                >
                  Update Profile
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-600 dark:text-gray-400 text-lg">No profile found</div>
          )}
        </DialogContent>
      </Dialog>




      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] sm:max-h-[700px] overflow-auto hide-scrollbar p-4">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6 w-full">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <label htmlFor="logo" style={{ textAlign: 'center' }}>
                  Logo
                  <br />
                  <img
                    src={logoPreview || (currentOwner?.logo ? `http://localhost:8000/uploads/${currentOwner.logo}` : "/default-logo.png")}
                    style={{
                      width: '120px',  // Increased width
                      height: '120px', // Increased height
                      borderRadius: '50%',
                      border: '1px solid #ccc',
                    }}
                    alt="Logo Preview"
                  />

                </label>
                <input
                  type="file"
                  id="logo"
                  accept="image/*"
                  onChange={handleLogoChange}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input className="w-full p-2 border rounded-md" {...field} />
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
                        <Input className="w-full p-2 border rounded-md" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="contactNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Number</FormLabel>
                      <FormControl>
                        <Input className="w-full p-2 border rounded-md" {...field} />
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
                        <Input disabled className="!text-black !opacity-100 bg-gray-200" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input className="w-full p-2 border rounded-md" {...field} />
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
                        <Input disabled className="!text-black !opacity-100 bg-gray-200" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="businessRegistration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Registration</FormLabel>
                      <FormControl>
                        <select className="w-full p-2 border rounded-md bg-white" {...field}>
                          <option value="">Select Business Registration</option>
                          <option value="Sole proprietorship">Sole proprietorship</option>
                          <option value="One person Company">One person Company</option>
                          <option value="Partnership">Partnership</option>
                          <option value="Private Limited">Private Limited</option>
                        </select>
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
                      <FormLabel>GST Number</FormLabel>
                      <FormControl>
                        <Input className="w-full p-2 border rounded-md cursor-not-allowed bg-gray-100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="companyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Type</FormLabel>
                      <FormControl>
                        <Input className="w-full p-2 border rounded-md" {...field} />
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
                        <select className="w-full p-2 border rounded-md bg-white" {...field}>
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="documentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Type</FormLabel>
                      <FormControl>
                        <Input disabled className="!text-black !opacity-100 bg-gray-200" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="documentNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Number</FormLabel>
                      <FormControl>
                        <Input disabled className="!text-black !opacity-100 bg-gray-200" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Buttons */}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Save Changes...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}