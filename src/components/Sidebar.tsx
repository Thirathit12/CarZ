"use client";

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path: string) => {
    return pathname === path
      ? "bg-green-600 text-white"
      : "text-gray-300 hover:bg-gray-700 hover:text-white";
  };

  const getMenuItems = () => {
    const items = [];

    items.push({ path: "/home", label: "ตารางใช้รถยนต์ส่วนกลาง" });

    // เมนูสำหรับทุก role
    
    items.push({ path: "/edit-account", label: "ตั้งค่าบัญชี" });

    // เมนูตาม role
    if (
      user?.role === "admin" ||
      user?.role === "super_admin" ||
      user?.role === "approver"
    ) {
      items.push({ path: "/approve", label: "อนุมัติคำขอใช้รถยนต์ส่วนกลาง" });
    }

    if (user?.role === "admin" || user?.role === "super_admin") {
      items.push({ path: "/car", label: "จัดการรถยนต์ส่วนกลาง" });
    }
    if (user?.role === "user") {
      items.push({ path: "/request-car", label: "แบบฟอร์มขอใช้รถยนต์ส่วนกลาง" });
      items.push({ path: "/car", label: "รายชื่อรถยนต์ส่วนกลาง" });
      
    }

    if (user?.role !== "driver") {
      items.push({ path: "/driver-list", label: "รายชื่อพนักงานขับรถ" });
    }

    if (user?.role === "super_admin") {
      items.push({ path: "/user-manage", label: "จัดการผู้ใช้" });
    }

    if (user?.role === "super_admin" || user?.role === "admin") {
      items.push({ path: "/car-use", label: "รายงานการใช้รถ" });
    }

    if (user?.role === "driver") {
      items.push({
        path: `/driver/${user?.userId}`,
        label: "รายการที่โดนมอบหมาย",
      });
    }

    if (user?.role === "user") {
      items.push({path: `/history/${user?.userId}`,label: "ประวัติการขอใช้รถยนต์ส่วนกลาง" });
    }

    // if (user?.role !== "approver" && user?.role !== "driver") {
    //   items.push({path: `/history/${user?.userId}`,label: "ประวัติการขอใช้รถยนต์ส่วนกลาง" });
    // }

    return items;
  };

  function logoutMenu() {
    logout();
    router.push("/");
  }

  if (pathname === "/" || pathname === "/register") {
    return null;
  }

  return (
    <div className="w-64 bg-gray-800 min-h-screen flex flex-col">
      {/* User Profile */}
      <div className="p-4 border-b border-gray-700">
        <div className="text-white font-medium mb-2">ข้อมูลผู้ใช้</div>
        <div className="text-sm text-gray-300 space-y-1">
          <div className="font-medium text-white">
            {user?.firstName} {user?.lastName}
          </div>
          <div>สำนัก/หน่วยงาน: {user?.department}</div>
          <div>ตำแหน่ง: {user?.position}</div>
          <div>อีเมล: {user?.email}</div>
          <div>สิทธิ์: {user?.role}</div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className=" px-2 py-4 space-y-1">
        {getMenuItems().map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`${isActive(
              item.path
            )} group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={logoutMenu}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-red-700 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          ออกจากระบบ
        </button>
      </div>
    </div>
  );
}
