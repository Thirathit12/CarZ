"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  Box,
} from "@mui/material";
import { format } from "date-fns";
import { th } from "date-fns/locale";

interface CarRequest {
  _id: string;
  user_id: {
    firstName: string;
    lastName: string;
    department: string;
    phoneNumber: string;
  };
  driver_id?: {
    _id: string;
  };
  start_datetime: string;
  end_datetime: string;
  purpose: string;
  destination: string;
  passenger_count: number;
  status: string;
  car_id?: {
    brand: string;
    model: string;
    licensePlate: string;
  };
}

export default function DriverRequestsPage() {
  const [requests, setRequests] = useState<CarRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
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

        if (!response.ok) throw new Error("Failed to fetch requests");

        const data = await response.json();
        const filteredRequests = data.filter(
          (req: CarRequest) => req.driver_id?._id === params.id
        );
        setRequests(filteredRequests);
      } catch (error) {
        console.log("Error fetching requests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [params.id, router]);

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      PENDING: "รอดำเนินการ",
      ASSIGNED: "มอบหมายแล้ว",
      APPROVED: "อนุมัติแล้ว",
      REJECTED: "ปฏิเสธแล้ว",
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        รายการคำขอใช้รถที่ได้รับมอบหมาย
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>วันที่ใช้งาน</TableCell>
              <TableCell>ผู้ขอใช้รถ</TableCell>
              <TableCell>เบอร์โทรศัพท์ของผู้ขอใช้รถ</TableCell>
              <TableCell>จุดหมายปลายทาง</TableCell>
              <TableCell>วัตถุประสงค์</TableCell>
              <TableCell>จำนวนผู้โดยสาร</TableCell>
              <TableCell>รถที่ใช้</TableCell>
              <TableCell>สถานะ</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  ไม่พบรายการคำขอใช้รถ
                </TableCell>
              </TableRow>
            ) : (
              requests.map((request) => (
                <TableRow key={request._id}>
                  <TableCell>
                    <Typography variant="body2">
                      {format(
                        new Date(request.start_datetime),
                        "dd MMM yyyy HH:mm",
                        {
                          locale: th,
                        }
                      )}
                    </Typography>
                    <Typography variant="body2">ถึง</Typography>
                    <Typography variant="body2">
                      {format(
                        new Date(request.end_datetime),
                        "dd MMM yyyy HH:mm",
                        {
                          locale: th,
                        }
                      )}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography>
                      {request.user_id.firstName} {request.user_id.lastName}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {request.user_id.department}
                    </Typography>
                  </TableCell>
                  <TableCell>{request.user_id.phoneNumber}</TableCell>
                  <TableCell>{request.destination}</TableCell>
                  <TableCell>{request.purpose}</TableCell>
                  <TableCell>{request.passenger_count} คน</TableCell>
                  <TableCell>
                    {request.car_id ? (
                      <>
                        <Typography>
                          {request.car_id.brand} {request.car_id.model}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {request.car_id.licensePlate}
                        </Typography>
                      </>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>{getStatusText(request.status)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
