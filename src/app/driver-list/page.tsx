"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
} from "@mui/material";

interface Driver {
  _id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  department: string;
  position: string;
  driverLicenseExpiry: string;
}

export default function DriverList() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const token = localStorage.getItem("car_rent_token");
        if (!token) {
          throw new Error("กรุณาเข้าสู่ระบบ");
        }
        const response = await fetch("/api/user/driver", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch drivers");
        }

        const data = await response.json();
        setDrivers(data);
      } catch (err) {
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
        console.log("Error fetching drivers:", err);
      }
    };

    fetchDrivers();
  }, []);

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        รายชื่อพนักงานขับรถ
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ชื่อ-นามสกุล</TableCell>
              <TableCell>เบอร์โทรศัพท์</TableCell>
              <TableCell>อีเมล</TableCell>
              <TableCell>แผนก</TableCell>
              <TableCell>ตำแหน่ง</TableCell>
              <TableCell>วันหมดอายุใบขับขี่</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {drivers.map((driver) => (
              <TableRow key={driver._id}>
                <TableCell>{`${driver.firstName} ${driver.lastName}`}</TableCell>
                <TableCell>{driver.phoneNumber}</TableCell>
                <TableCell>{driver.email}</TableCell>
                <TableCell>{driver.department}</TableCell>
                <TableCell>{driver.position}</TableCell>
                <TableCell>
                  {driver.driverLicenseExpiry
                    ? new Date(driver.driverLicenseExpiry).toLocaleDateString(
                        "th-TH"
                      )
                    : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
