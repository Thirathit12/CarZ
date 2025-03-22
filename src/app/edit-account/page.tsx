"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-hot-toast";
import jwt from "jsonwebtoken";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";

interface UserData {
  firstName: string;
  lastName: string;
  gender: string;
  birthDate: string;
  email: string;
  phoneNumber: string;
  position: string;
  department: string;
  branch?: string;
}

export default function EditAccount() {
  const [userData, setUserData] = useState<UserData>({
    firstName: "",
    lastName: "",
    gender: "",
    birthDate: "",
    email: "",
    phoneNumber: "",
    position: "",
    department: "",
    branch: "",
  });
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const router = useRouter();
  const { setUser } = useAuth();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  useEffect(() => {
    const token = localStorage.getItem("car_rent_token");
    if (!token) {
      router.push("/");
      return;
    }

    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/account", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("ไม่สามารถดึงข้อมูลได้");
        }

        const data = await response.json();
        setUserData({
          ...data,
          birthDate: new Date(data.birthDate).toISOString().split("T")[0],
        });
      } catch (error) {
        toast.error("เกิดข้อผิดพลาดในการดึงข้อมูล");
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("car_rent_token");
    if (!token) {
      toast.error("กรุณาเข้าสู่ระบบใหม่");
      router.push("/");
      return;
    }

    if (password && password.length < 6) {
      toast.error("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }

    const updateData = {
      ...userData,
      ...(password.trim() !== "" && { password }),
    };
    setFormData(updateData);
    setOpenConfirmDialog(true);
  };

  const handleConfirmSave = async () => {
    setOpenConfirmDialog(false);
    const token = localStorage.getItem("car_rent_token");
    const loadingToast = toast.loading("กำลังบันทึกข้อมูล...");

    try {
      const response = await fetch("/api/account", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "ไม่สามารถอัพเดทข้อมูลได้");
      }

      const updatedUser = await response.json();

      try {
        const decoded = jwt.decode(token as string) as any;
        setUser({
          ...decoded,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          email: updatedUser.email,
          department: updatedUser.department,
          position: updatedUser.position,
          gender: updatedUser.gender,
          phoneNumber: updatedUser.phoneNumber,
          birthDate: updatedUser.birthDate,
        });

        toast.dismiss(loadingToast);
        toast.success("บันทึกข้อมูลสำเร็จ", {
          duration: 3000,
          position: "top-center",
        });

        setPassword("");
      } catch (error) {
        console.log("Error updating user context:", error);
        toast.dismiss(loadingToast);
        toast.error("เกิดข้อผิดพลาดในการอัพเดทข้อมูล", {
          duration: 3000,
          position: "top-center",
        });
      }
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล", {
        duration: 3000,
        position: "top-center",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        กำลังโหลด...
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">ตั้งค่าบัญชี</h1>
      <form
        onSubmit={handleSubmit}
        className="max-w-2xl mx-auto space-y-6"
        autoComplete="off"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-2">ชื่อ</label>
            <input
              type="text"
              value={userData.firstName}
              onChange={(e) =>
                setUserData({ ...userData, firstName: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block mb-2">นามสกุล</label>
            <input
              type="text"
              value={userData.lastName}
              onChange={(e) =>
                setUserData({ ...userData, lastName: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block mb-2">เพศ</label>
            <select
              value={userData.gender}
              onChange={(e) =>
                setUserData({ ...userData, gender: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            >
              <option value="">เลือกเพศ</option>
              <option value="ชาย">ชาย</option>
              <option value="หญิง">หญิง</option>
              <option value="อื่นๆ">อื่นๆ</option>
            </select>
          </div>
          <div>
            <label className="block mb-2">วันเกิด</label>
            <input
              type="date"
              value={userData.birthDate}
              onChange={(e) =>
                setUserData({ ...userData, birthDate: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block mb-2">อีเมล</label>
            <input
              type="email"
              value={userData.email}
              onChange={(e) =>
                setUserData({ ...userData, email: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block mb-2">เบอร์โทรศัพท์</label>
            <input
              type="tel"
              value={userData.phoneNumber}
              onChange={(e) =>
                setUserData({ ...userData, phoneNumber: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block mb-2">ตำแหน่ง</label>
            <input
              type="text"
              value={userData.position}
              onChange={(e) =>
                setUserData({ ...userData, position: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            />
          </div>
          {/* <div>
            <label className="block mb-2">สำนัก/หน่วยงาน</label>
            <input
              type="text"
              value={userData.department}
              onChange={(e) =>
                setUserData({ ...userData, department: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            />
          </div> */}

          <div>
            <label className="block mb-2">สำนักงาน/หน่วยงาน</label>
            <select
              value={userData.department}
              onChange={(e) =>
                setUserData({ ...userData, department: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            >
              <option value="">เลือกสำนักงาน/หน่วยงาน</option>
              <option value="สำนักตรวจสอบ">สำนักตรวจสอบ</option>
              <option value="สำนักกฏหมาย">สำนักกฏหมาย</option>
              <option value="สำนักงานเลขาผู้อำนวยการ">สำนักงานเลขาผู้อำนวยการ</option>
              <option value="สำนักบริหารแผนยุทธศาสตร์">สำนักบริหารแผนยุทธศาสตร์</option>
              <option value="สำนักการเงินและทรัพย์สิน">สำนักการเงินและทรัพย์สิน</option>
              <option value="สำนักพัฒนาธุรกิจ">สำนักพัฒนาธุรกิจ</option>
              <option value="สำนักดิจิทัลและสารสนเทศ">สำนักดิจิทัลและสารสนเทศ</option>
              <option value="สำนักบริหารทุนมนุษย์">สำนักบริหารทุนมนุษย์</option>
              <option value="สำนักพัฒนากายภาพและจัดการสิ่งแวดล้อม">สำนักพัฒนากายภาพและจัดการสิ่งแวดล้อม</option>
              <option value="สถาบันอนุรักษ์และวิจัยสัตว์">สถาบันอนุรักษ์และวิจัยสัตว์</option>
              <option value="สถาบันจัดการสวนสัตว์">สถาบันจัดการสวนสัตว์</option>
              <option value="อื่นๆ">อื่นๆ</option>
            </select>
          </div>
          <div>
            <label className="block mb-2">รหัสผ่านใหม่ (ไม่จำเป็น)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded"
              minLength={6}
              autoComplete="new-password"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            บันทึก
          </button>
        </div>
      </form>

      <Dialog
        open={openConfirmDialog}
        onClose={() => setOpenConfirmDialog(false)}
      >
        <DialogTitle>ยืนยันการบันทึกข้อมูล</DialogTitle>
        <DialogContent>
          คุณต้องการบันทึกการเปลี่ยนแปลงข้อมูลใช่หรือไม่?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDialog(false)}>ยกเลิก</Button>
          <Button
            onClick={handleConfirmSave}
            variant="contained"
            color="primary"
          >
            ยืนยัน
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
