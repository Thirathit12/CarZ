"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Modal,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  SelectChangeEvent,
} from "@mui/material";
import { useAuth } from "@/contexts/AuthContext";

interface Driver {
  firstName: string;
  lastName: string;
  position: string;
  department: string;
}

interface Car {
  _id: string;
  brand: string;
  model: string;
  licensePlate: string;
  capacity: number;
  status: string;
  type: string;
  notes: string;
  currentDriver?: Driver;
}

export default function CarPage() {
  const { user } = useAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    licensePlate: "",
    capacity: "",
    type: "",
    status: "AVAILABLE",
    notes: "",
  });
  const [formError, setFormError] = useState("");
  const [editingCarId, setEditingCarId] = useState<string | null>(null);

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      const token = localStorage.getItem("car_rent_token");
      if (!token) {
        throw new Error("กรุณาเข้าสู่ระบบ");
      }

      const response = await fetch("/api/car?includeDriver=true", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("ไม่สามารถดึงข้อมูลได้");
      }

      const data = await response.json();
      setCars(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ต้องการลบข้อมูลรถคันนี้ใช่หรือไม่?")) {
      return;
    }

    try {
      const token = localStorage.getItem("car_rent_token");
      const response = await fetch(`/api/car/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("ไม่สามารถลบข้อมูลได้");
      }

      setCars(cars.filter((car) => car._id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    const colors = {
      AVAILABLE: "bg-green-100 text-green-800",
      IN_USE: "bg-yellow-100 text-yellow-800",
      MAINTENANCE: "bg-red-100 text-red-800",
    } as { [key: string]: string };

    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const handleOpen = (car?: Car) => {
    if (car) {
      setFormData({
        brand: car.brand,
        model: car.model,
        licensePlate: car.licensePlate,
        capacity: car.capacity.toString(),
        type: car.type,
        status: car.status,
        notes: car.notes || "",
      });
      setEditingCarId(car._id);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setFormData({
      brand: "",
      model: "",
      licensePlate: "",
      capacity: "",
      type: "",
      status: "AVAILABLE",
      notes: "",
    });
    setFormError("");
    setEditingCarId(null);
  };

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | SelectChangeEvent
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name as string]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    try {
      const token = localStorage.getItem("car_rent_token");
      const url = editingCarId ? `/api/car/${editingCarId}` : "/api/car";
      const method = editingCarId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          capacity: Number(formData.capacity),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "ไม่สามารถบันทึกข้อมูลได้");
      }

      const updatedCar = await response.json();

      if (editingCarId) {
        setCars((prev) =>
          prev.map((car) => (car._id === editingCarId ? updatedCar : car))
        );
      } else {
        setCars((prev) => [updatedCar, ...prev]);
      }

      handleClose();
    } catch (err: any) {
      setFormError(err.message);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">จัดการข้อมูลรถยนต์ส่วนกลาง</h1>
        {isAdmin && (
          <Button
            variant="contained"
            onClick={() => handleOpen()}
            style={{ backgroundColor: "#2e7d32" }}
          >
            เพิ่มรถใหม่
          </Button>
        )}
      </div>


      <Modal open={open} onClose={handleClose} aria-labelledby="modal-title">
        <Box sx={modalStyle}>
          <Typography id="modal-title" variant="h6" component="h2" mb={2}>
            {editingCarId ? "แก้ไขข้อมูลรถ" : "เพิ่มรถใหม่"}
          </Typography>
          <form onSubmit={handleSubmit} className="space-y-4">
            <TextField
              fullWidth
              label="ยี่ห้อรถ"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              required
              size="small"
            />
            <TextField
              fullWidth
              label="รุ่นรถ"
              name="model"
              value={formData.model}
              onChange={handleChange}
              required
              size="small"
            />
            <TextField
              fullWidth
              label="เลขทะเบียน"
              name="licensePlate"
              value={formData.licensePlate}
              onChange={handleChange}
              required
              size="small"
            />
            <TextField
              fullWidth
              label="จำนวนที่นั่ง"
              name="capacity"
              type="number"
              value={formData.capacity}
              onChange={handleChange}
              required
              size="small"
              inputProps={{ min: 1 }}
            />
            <FormControl fullWidth size="small" required>
              <InputLabel>ประเภทรถ</InputLabel>
              <Select
                name="type"
                value={formData.type}
                label="ประเภทรถ"
                onChange={handleChange}
              >
                <MenuItem value="รถเก๋ง">รถเก๋ง</MenuItem>
                <MenuItem value="รถตู้">รถตู้</MenuItem>
                <MenuItem value="รถกระบะ">รถกระบะ</MenuItem>
                <MenuItem value="รถบัส">รถบัส</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>สถานะ</InputLabel>
              <Select
                name="status"
                value={formData.status}
                label="สถานะ"
                onChange={handleChange}
              >
                <MenuItem value="AVAILABLE">พร้อมใช้งาน</MenuItem>
                <MenuItem value="MAINTENANCE">อยู่ระหว่างซ่อมบำรุง</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="หมายเหตุ"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              multiline
              rows={2}
              size="small"
            />
            {formError && (
              <Typography color="error" variant="body2">
                {formError}
              </Typography>
            )}
            <div className="flex justify-end space-x-2 pt-4">
              <Button onClick={handleClose} color="inherit">
                ยกเลิก
              </Button>
              <Button
                type="submit"
                variant="contained"
                style={{ backgroundColor: "#008000" }}
              >
                บันทึก
              </Button>
            </div>
          </form>
        </Box>
      </Modal>

      {cars.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg">ไม่พบข้อมูลรถ</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  รถ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ทะเบียน
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ประเภท
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ที่นั่ง
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  สถานะ
                </th>
                {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  คนขับปัจจุบัน
                </th> */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cars.map((car) => (
                <tr key={car._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {car.brand}
                    </div>
                    <div className="text-sm text-gray-500">{car.model}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {car.licensePlate}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{car.type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {car.capacity} ที่นั่ง
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                        car.status
                      )}`}
                    >
                      {car.status}
                    </span>
                  </td>
                  {/* <td className="px-6 py-4 whitespace-nowrap">
                    {car.status === "IN_USE" && car.currentDriver ? (
                      <div className="text-sm text-gray-900">
                        <div>
                          {car.currentDriver.firstName}{" "}
                          {car.currentDriver.lastName}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {car.currentDriver.position}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {car.currentDriver.department}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">-</span>
                    )}
                  </td> */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => handleOpen(car)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDelete(car._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          ลบ
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
