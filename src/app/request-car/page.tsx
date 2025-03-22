"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Snackbar,
  Alert,
} from "@mui/material";

export default function RequestCarPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [requests, setRequests] = useState<[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ตรวจสอบสิทธิ์การเข้าถึงหน้า
    // if (!user) {
    //   router.push("/login");
    //   return;
    // }

    console.log(user?.role);

    // ถ้าเป็น user หรือ driver ให้ redirect ไปหน้าอื่น
    if (user?.role === "super_admin" || user?.role === "driver"|| user?.role === "admin"|| user?.role === "approver") {
      router.push("/home");
    }

    fetchRequests();
  }, [user, router]);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("car_rent_token");
      if (!token) {
        throw new Error("กรุณาเข้าสู่ระบบ");
      }

      const response = await fetch("/api/requests", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("ไม่สามารถดึงข้อมูลได้");
      }

      const data = await response.json();
      setRequests(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (data: any) => {
    setFormData(data);
    setConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      setError("");
      setIsSubmitting(true);
      const token = localStorage.getItem("car_rent_token");

      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "การส่งแบบฟอร์มล้มเหลว");
      }

      // ปิด dialog และ reset form
      fetchRequests();
      setConfirmOpen(false);
      reset();
      setSuccessOpen(true);
    } catch (error: any) {
      console.log("Error:", error);
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };



  const renderError = (error: any) => {
    return <p className="text-red-500 text-sm mt-1">{error}</p>;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 text-center">
          แบบฟอร์มขอใช้รถ
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ประเภทการเดินทาง <span className="text-red-500">*</span>
              </label>
              <select
                {...register("travel_type", {
                  required: "กรุณาเลือกประเภทการเดินทาง",
                })}
                className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.travel_type ? "border-red-500" : "border-gray-300"
                  }`}
              >
                <option value="">เลือกประเภทการเดินทาง</option>
                <option value="วันเดียว">วันเดียว</option>
                <option value="หลายวัน">หลายวัน</option>
              </select>
              {errors.travel_type && renderError(errors.travel_type.message)}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                วิธีการใช้รถ <span className="text-red-500">*</span>
              </label>
              <select
                {...register("usage_type", {
                  required: "กรุณาเลือกวิธีการใช้รถ",
                })}
                className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.usage_type ? "border-red-500" : "border-gray-300"
                  }`}
              >
                <option value="">เลือกวิธีการใช้รถ</option>
                <option value="ส่ง/รอรับกลับด้วย">ส่ง/รอรับกลับด้วย</option>
                <option value="ส่งอย่างเดียว">ส่งอย่างเดียว</option>
                <option value="รับกลับอย่างเดียว">รับกลับอย่างเดียว</option>
                <option value="ส่งและไปรับกลับตามเวลากลับ">
                  ส่งและไปรับกลับตามเวลากลับ
                </option>
              </select>
              {errors.usage_type && renderError(errors.usage_type.message)}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                วันเวลาที่เริ่มต้น <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                {...register("start_datetime", {
                  required: "กรุณาเลือกวันเวลาที่เริ่มต้น",
                })}
                className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.start_datetime ? "border-red-500" : "border-gray-300"
                  }`}
              />
              {errors.start_datetime &&
                renderError(errors.start_datetime.message)}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                วันเวลาที่สิ้นสุด <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                {...register("end_datetime", {
                  required: "กรุณาเลือกวันเวลาที่สิ้นสุด",
                  validate: (value) => {
                    const start = new Date(watch("start_datetime"));
                    return (
                      new Date(value) > start ||
                      "วันเวลาสิ้นสุดต้องมากกว่าวันเวลาเริ่มต้น"
                    );
                  },
                })}
                className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.end_datetime ? "border-red-500" : "border-gray-300"
                  }`}
              />
              {errors.end_datetime && renderError(errors.end_datetime.message)}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                จำนวนผู้โดยสาร <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                {...register("passenger_count", {
                  required: "กรุณากรอกจำนวนผู้โดยสาร",
                  min: { value: 1, message: "จำนวนผู้โดยสารต้องมากกว่า 0" },
                  max: {
                    value: 50,
                    message: "จำนวนผู้โดยสารต้องไม่เกิน 50 คน",
                  },
                })}
                className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.passenger_count ? "border-red-500" : "border-gray-300"
                  }`}
              />
              {errors.passenger_count &&
                renderError(errors.passenger_count.message)}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                วัตถุประสงค์ในการเดินทาง <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register("purpose", {
                  required: "กรุณากรอกวัตถุประสงค์ในการเดินทาง",
                  minLength: {
                    value: 0,
                    message: "กรุณากรอกรายละเอียดอย่างน้อย 10 ตัวอักษร",
                  },
                })}
                rows={3}
                className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.purpose ? "border-red-500" : "border-gray-300"
                  }`}
              />
              {errors.purpose && renderError(errors.purpose.message)}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                สถานที่ไปปฏิบัติงาน <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("destination", {
                  required: "กรุณากรอกสถานที่ไปปฏิบัติงาน",
                })}
                className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.destination ? "border-red-500" : "border-gray-300"
                  }`}
              />
              {errors.destination && renderError(errors.destination.message)}
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm p-4 bg-red-50 rounded-md border border-red-200">
              <p className="font-medium">เกิดข้อผิดพลาด</p>
              <p>{error}</p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  กำลังส่ง...
                </span>
              ) : (
                "ส่งแบบฟอร์ม"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Success Snackbar */}
      <Snackbar
        open={successOpen}
        autoHideDuration={3000}
        onClose={() => setSuccessOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSuccessOpen(false)}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          ส่งแบบฟอร์มสำเร็จ
        </Alert>
      </Snackbar>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>ยืนยันการส่งแบบฟอร์ม</DialogTitle>
        <DialogContent>
          <div className="space-y-4 py-4">
            {/* ข้อมูลผู้ขอ */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-lg mb-2">ข้อมูลผู้ขอ</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">ชื่อ-นามสกุล</p>
                  <p className="font-medium">
                    {user?.firstName} {user?.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">ตำแหน่ง</p>
                  <p className="font-medium">{user?.position}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">สำนักงาน</p>
                  <p className="font-medium">{user?.department}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">อีเมล</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* ข้อมูลการขอใช้รถ */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-lg mb-2">รายละเอียดการขอใช้รถ</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">ประเภทการเดินทาง</p>
                  <p className="font-medium">{formData?.travel_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">วิธีการใช้รถ</p>
                  <p className="font-medium">{formData?.usage_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">วันเวลาที่เริ่มต้น</p>
                  <p className="font-medium">
                    {new Date(formData?.start_datetime).toLocaleString("th-TH")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">วันเวลาที่สิ้นสุด</p>
                  <p className="font-medium">
                    {new Date(formData?.end_datetime).toLocaleString("th-TH")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">จำนวนผู้โดยสาร</p>
                  <p className="font-medium">{formData?.passenger_count} คน</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">สถานที่ไปปฏิบัติงาน</p>
                  <p className="font-medium">{formData?.destination}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">
                    วัตถุประสงค์ในการเดินทาง
                  </p>
                  <p className="font-medium">{formData?.purpose}</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} color="inherit">
            แก้ไข
          </Button>
          <Button
            onClick={handleConfirmSubmit}
            variant="contained"
            color="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "กำลังส่ง..." : "ยืนยันการส่ง"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
