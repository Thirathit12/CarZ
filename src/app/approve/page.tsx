"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  Modal,
  Box,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  department: string;
  position: string;
}

interface Admin {
  firstName: string;
  lastName: string;
  department: string;
  position: string;
}

interface Driver {
  _id: string;
  firstName: string;
  lastName: string;
  department: string;
  position: string;
}

interface Car {
  _id: string;
  brand: string;
  model: string;
  licensePlate: string;
  type: string;
}

interface Approver {
  firstName: string;
  lastName: string;
  department: string;
  position: string;
}

interface CarRequest {
  _id: string;
  user_id: User;
  admin_id: Admin | null;
  driver_id: Driver | null;
  car_id: Car | null;
  approver_id: Approver | null;
  start_datetime: string;
  end_datetime: string;
  purpose: string;
  destination: string;
  passenger_count: number;
  status: string;
  travel_type: string;
  usage_type: string;
  created_at: string;
}

interface AvailableCar {
  _id: string;
  brand: string;
  model: string;
  licensePlate: string;
  type: string;
  capacity: number;
}

// เพิ่มฟังก์ชัน helper สำหรับถอดรหัส base64 URL-safe
const decodeBase64Url = (str: string) => {
  // เพิ่ม padding ถ้าจำเป็น
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) {
    str += "=";
  }
  return atob(str);
};

export default function ApprovePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<CarRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedCar, setSelectedCar] = useState("");
  const [selectedDriver, setSelectedDriver] = useState("");
  const [availableCars, setAvailableCars] = useState<AvailableCar[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<CarRequest | null>(
    null
  );
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRejectRequest, setSelectedRejectRequest] =
    useState<CarRequest | null>(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [selectedApproveRequest, setSelectedApproveRequest] =
    useState<CarRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    // ตรวจสอบสิทธิ์การเข้าถึงหน้า
    // if (!user) {
    //   router.push("/login");
    //   return;
    // }

    console.log(user?.role);

    // ถ้าเป็น user หรือ driver ให้ redirect ไปหน้าอื่น
    if (user?.role === "user" || user?.role === "driver") {
      router.push("/request-car");
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

  const getStatusBadgeColor = (status: string) => {
    const colors = {
      PENDING: "bg-yellow-100 text-yellow-800",
      ASSIGNED: "bg-blue-100 text-blue-800",
      APPROVED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
      CANCELLED: "bg-gray-100 text-gray-800",
    } as { [key: string]: string };

    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d MMM yyyy HH:mm", { locale: th });
  };

  const handleAssignOpen = async (request: CarRequest) => {
    if (request.status === "REJECTED" || request.status === "APPROVED") {
      return;
    }
    setSelectedRequest(request);
    setAssignModalOpen(true);

    try {
      // ดึงข้อมูลรถที่ว่าง โดยส่งพารามิเตอร์วันเวลา
      const carsResponse = await fetch(
        `/api/available-cars?start_datetime=${request.start_datetime}&end_datetime=${request.end_datetime}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("car_rent_token")}`,
          },
        }
      );
      const cars = await carsResponse.json();
      setAvailableCars(cars);

      // ดึงข้อมูลคนขับที่ว่าง
      const driversResponse = await fetch(
        `/api/available-drivers?start_datetime=${request.start_datetime}&end_datetime=${request.end_datetime}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("car_rent_token")}`,
          },
        });
      const drivers = await driversResponse.json();
      setAvailableDrivers(drivers);
    } catch (error) {
      console.log("Error fetching data:", error);
    }
  };

  const handleAssignClose = () => {
    setAssignModalOpen(false);
    setActiveStep(0);
    setSelectedCar("");
    setSelectedDriver("");
    setSelectedRequest(null);
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleAssign = async () => {
    try {
      const response = await fetch(
        `/api/requests/${selectedRequest?._id}/assign`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("car_rent_token")}`,
          },
          body: JSON.stringify({
            car_id: selectedCar,
            driver_id: selectedDriver,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("ไม่สามารถอนุมัติคำขอได้");
      }

      const updatedRequest = await response.json();

      // อัพเดตรายการคำขอในหน้า
      setRequests((prev) =>
        prev.map((req) =>
          req._id === updatedRequest._id ? updatedRequest : req
        )
      );

      handleAssignClose();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleRejectOpen = (request: CarRequest) => {
    if (request.status === "REJECTED" || request.status === "APPROVED") {
      return;
    }
    setSelectedRejectRequest(request);
    setRejectModalOpen(true);
  };

  const handleRejectClose = () => {
    setSelectedRejectRequest(null);
    setRejectModalOpen(false);
  };

  const handleRejectConfirm = async () => {
    if (!selectedRejectRequest) return;

    try {
      const token = localStorage.getItem("car_rent_token");
      if (!token) {
        throw new Error("ไม่พบ token กรุณาเข้าสู่ระบบใหม่");
      }

      let userId;
      try {
        const [, payloadBase64] = token.split(".");
        const payload = JSON.parse(decodeBase64Url(payloadBase64));
        userId = payload.userId;
      } catch (error) {
        console.log("Token parsing error:", error);
        throw new Error("Token ไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่");
      }

      const response = await fetch(
        `/api/requests/${selectedRejectRequest._id}/reject`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            approver_id: userId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "การปฏิเสธคำขอล้มเหลว");
      }

      fetchRequests();
      handleRejectClose();
    } catch (error: any) {
      console.log("Error:", error);
      alert(error.message || "เกิดข้อผิดพลาดในการปฏิเสธคำขอ");
    }
  };

  const handleApproveOpen = (request: CarRequest) => {
    if (
      request.status === "REJECTED" ||
      request.status === "APPROVED" ||
      !request.driver_id
    ) {
      return;
    }
    setSelectedApproveRequest(request);
    setApproveModalOpen(true);
  };

  const handleApproveClose = () => {
    setSelectedApproveRequest(null);
    setApproveModalOpen(false);
  };

  const handleApproveConfirm = async () => {
    if (!selectedApproveRequest) return;

    try {
      const token = localStorage.getItem("car_rent_token");
      if (!token) {
        throw new Error("ไม่พบ token กรุณาเข้าสู่ระบบใหม่");
      }

      let userId;
      try {
        const [, payloadBase64] = token.split(".");
        const payload = JSON.parse(decodeBase64Url(payloadBase64));
        userId = payload.userId;
      } catch (error) {
        console.log("Token parsing error:", error);
        throw new Error("Token ไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่");
      }

      const response = await fetch(
        `/api/requests/${selectedApproveRequest._id}/approve`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            approver_id: userId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "การอนุมัติคำขอล้มเหลว");
      }

      fetchRequests();
      handleApproveClose();
    } catch (error: any) {
      console.log("Error:", error);
      alert(error.message || "เกิดข้อผิดพลาดในการอนุมัติคำขอ");
    }
  };

  const modalStyle = {
    position: "absolute" as "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    bgcolor: "background.paper",
    boxShadow: 24,
    p: 4,
    borderRadius: 1,
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <FormControl fullWidth>
            <InputLabel color="success">เลือกรถ</InputLabel>
            <Select
              value={selectedCar}
              label="เลือกรถ"
              onChange={(e) => setSelectedCar(e.target.value)}
              color="success"
            >
              {availableCars.map((car) => (
                <MenuItem key={car._id} value={car._id}>
                  {car.brand} {car.model} - {car.licensePlate} ({car.type})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      case 1:
        return (
          <FormControl fullWidth>
            <InputLabel color="success">เลือกคนขับ</InputLabel>
            <Select
              value={selectedDriver}
              label="เลือกคนขับ"
              onChange={(e) => setSelectedDriver(e.target.value)}
              color="success"
            >
              {availableDrivers.map((driver) => (
                <MenuItem key={driver._id} value={driver._id}>
                  {driver.firstName} {driver.lastName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      default:
        return null;
    }
  };

  // ฟังก์ชันเช็คสิทธิ์การแสดงปุ่ม
  const canAssignDriver = () => {
    return user?.role === "admin" || user?.role === "super_admin";
  };

  const canApproveReject = () => {
    return user?.role === "approver" || user?.role === "super_admin";
  };

  // เพิ่มฟังก์ชันสำหรับกรองข้อมูล
  const filteredRequests = requests.filter((request) => {
    if (statusFilter === "ALL") return true;
    return request.status === statusFilter;
  });

  // เพิ่มฟังก์ชันสำหรับการคลิกที่ chip
  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
  };

  const handleViewHistory = (userId: string) => {
    router.push(`/history/${userId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-center">
          <p className="text-xl font-semibold">เกิดข้อผิดพลาด</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 text-center">
          <p className="text-xl font-semibold">ไม่พบข้อมูล</p>
        </div>
      </div>
    );
  }

  if (!user || user.role === "user" || user.role === "driver") {
    return null; // หรือแสดง loading state
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-full">
      <h1 className="text-2xl font-bold mb-6">รายการคำขอใช้รถ</h1>

      {/* เพิ่มส่วน Filter */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <Chip
          label="ทั้งหมด"
          onClick={() => handleStatusFilterChange("ALL")}
          color={statusFilter === "ALL" ? "success" : "default"}
          variant={statusFilter === "ALL" ? "filled" : "outlined"}
          className="cursor-pointer"
        />
        <Chip
          label="รอดำเนินการ"
          onClick={() => handleStatusFilterChange("PENDING")}
          color={statusFilter === "PENDING" ? "success" : "default"}
          variant={statusFilter === "PENDING" ? "filled" : "outlined"}
          className="cursor-pointer"
        />
        <Chip
          label="จัดรถแล้ว"
          onClick={() => handleStatusFilterChange("ASSIGNED")}
          color={statusFilter === "ASSIGNED" ? "success" : "default"}
          variant={statusFilter === "ASSIGNED" ? "filled" : "outlined"}
          className="cursor-pointer"
        />
        <Chip
          label="อนุมัติแล้ว"
          onClick={() => handleStatusFilterChange("APPROVED")}
          color={statusFilter === "APPROVED" ? "success" : "default"}
          variant={statusFilter === "APPROVED" ? "filled" : "outlined"}
          className="cursor-pointer"
        />
        <Chip
          label="ปฏิเสธแล้ว"
          onClick={() => handleStatusFilterChange("REJECTED")}
          color={statusFilter === "REJECTED" ? "success" : "default"}
          variant={statusFilter === "REJECTED" ? "filled" : "outlined"}
          className="cursor-pointer"
        />
      </div>

      <div className="overflow-x-auto max-w-[calc(100vw-300px)] max-h-[calc(100vh-200px)] bg-white rounded-lg shadow">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                    ผู้ขอ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                    วันที่เดินทาง
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">
                    รายละเอียด
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                    คนขับรถ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                    รถที่ใช้
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                    ผู้อนุมัติ/ปฏิเสธ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                    การจัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr key={request._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900">
                          {request.user_id
                            ? `${request.user_id.firstName} ${request.user_id.lastName}`
                            : "ไม่พบข้อมูลผู้ใช้"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.user_id?.department || "-"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.user_id?.position || "-"}
                        </div>
                        <button
                          onClick={() => handleViewHistory(request.user_id._id)}
                          className="text-blue-600 hover:text-blue-800 text-sm mt-1 underline"
                        >
                          ดูประวัติทั้งหมด
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(request.start_datetime)}
                      </div>
                      <div className="text-sm text-gray-500">ถึง</div>
                      <div className="text-sm text-gray-900">
                        {formatDate(request.end_datetime)}
                      </div>
                    </td>
                    <td className="px-6 py-4 min-w-[300px]">
                      <div className="text-sm text-gray-900">
                        <p>
                          <span className="font-medium">วัตถุประสงค์:</span>{" "}
                          {request.purpose}
                        </p>
                        <p>
                          <span className="font-medium">สถานที่:</span>{" "}
                          {request.destination}
                        </p>
                        <p>
                          <span className="font-medium">ผู้โดยสาร:</span>{" "}
                          {request.passenger_count} คน
                        </p>
                        <p>
                          <span className="font-medium">ประเภท:</span>{" "}
                          {request.travel_type}
                        </p>
                        <p>
                          <span className="font-medium">การใช้งาน:</span>{" "}
                          {request.usage_type}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                          request.status
                        )}`}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900">
                          {request.driver_id
                            ? `${request.driver_id.firstName} ${request.driver_id.lastName}`
                            : "-"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.driver_id?.department || "-"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.driver_id?.position || "-"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {request.car_id ? (
                          <>
                            <div className="font-medium">
                              {request.car_id.brand} {request.car_id.model}
                            </div>
                            <div className="text-gray-500">
                              {request.car_id.licensePlate}
                            </div>
                            <div className="text-gray-500">
                              {request.car_id.type}
                            </div>
                          </>
                        ) : (
                          "-"
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900">
                          {request.approver_id
                            ? `${request.approver_id.firstName} ${request.approver_id.lastName}`
                            : "-"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.approver_id?.department || "-"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.approver_id?.position || "-"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {request.status !== "REJECTED" &&
                        request.status !== "APPROVED" && (
                          <>
                            {canAssignDriver() && !request.driver_id && (
                              <button
                                onClick={() => handleAssignOpen(request)}
                                className="text-green-600 hover:text-green-900 mr-4"
                                disabled={
                                  request.status === "REJECTED" ||
                                  request.status === "APPROVED"
                                }
                              >
                                เลือกคนขับรถ
                              </button>
                            )}
                            {canApproveReject() && (
                              <>
                                {request.driver_id ? (
                                  <button
                                    onClick={() => handleApproveOpen(request)}
                                    className="text-blue-600 hover:text-blue-900 mr-4"
                                    disabled={
                                      request.status === "REJECTED" ||
                                      request.status === "APPROVED"
                                    }
                                  >
                                    อนุมัติ
                                  </button>
                                ) : null}
                                <button
                                  className="text-red-600 hover:text-red-900"
                                  onClick={() => handleRejectOpen(request)}
                                  disabled={
                                    request.status === "REJECTED" ||
                                    request.status === "APPROVED"
                                  }
                                >
                                  ปฏิเสธ
                                </button>
                              </>
                            )}
                          </>
                        )}
                      {(request.status === "REJECTED" ||
                        request.status === "APPROVED") && (
                          <span className="text-gray-500">
                            ไม่สามารถดำเนินการได้
                          </span>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal open={assignModalOpen} onClose={handleAssignClose}>
        <Box sx={modalStyle}>
          <Typography variant="h6" component="h2" mb={4}>
            อนุมัติคำขอใช้รถ
          </Typography>
          <Stepper
            activeStep={activeStep}
            sx={{
              mb: 4,
              "& .MuiStepIcon-root.Mui-active": {
                color: "success.main",
              },
              "& .MuiStepIcon-root.Mui-completed": {
                color: "success.main",
              },
            }}
          >
            <Step>
              <StepLabel>เลือกรถ</StepLabel>
            </Step>
            <Step>
              <StepLabel>เลือกคนขับ</StepLabel>
            </Step>
          </Stepper>
          <div className="mb-4">{getStepContent(activeStep)}</div>
          <div className="flex justify-between">
            <Button
              color="success"
              disabled={activeStep === 0}
              onClick={handleBack}
            >
              ย้อนกลับ
            </Button>
            <div>
              <Button
                onClick={handleAssignClose}
                color="inherit"
                sx={{ mr: 1 }}
              >
                ยกเลิก
              </Button>
              {activeStep === 1 ? (
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleAssign}
                  disabled={!selectedCar || !selectedDriver}
                >
                  ยืนยัน
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleNext}
                  disabled={!selectedCar}
                >
                  ถัดไป
                </Button>
              )}
            </div>
          </div>
        </Box>
      </Modal>

      <Modal open={approveModalOpen} onClose={handleApproveClose}>
        <Box sx={modalStyle}>
          <Typography variant="h6" component="h2" mb={4}>
            ยืนยันการอนุมัติคำขอใช้รถ
          </Typography>
          <Typography mb={4}>
            คุณต้องการอนุมัติคำขอใช้รถนี้ใช่หรือไม่?
          </Typography>
          <div className="flex justify-end gap-2">
            <Button onClick={handleApproveClose} color="inherit">
              ยกเลิก
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={handleApproveConfirm}
            >
              ยืนยันการอนุมัติ
            </Button>
          </div>
        </Box>
      </Modal>

      <Modal open={rejectModalOpen} onClose={handleRejectClose}>
        <Box sx={modalStyle}>
          <Typography variant="h6" component="h2" mb={4}>
            ยืนยันการปฏิเสธคำขอใช้รถ
          </Typography>
          <Typography mb={4}>
            คุณต้องการปฏิเสธคำขอใช้รถนี้ใช่หรือไม่?
          </Typography>
          <div className="flex justify-end gap-2">
            <Button onClick={handleRejectClose} color="inherit">
              ยกเลิก
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleRejectConfirm}
            >
              ยืนยันการปฏิเสธ
            </Button>
          </div>
        </Box>
      </Modal>
    </div>
  );
}
