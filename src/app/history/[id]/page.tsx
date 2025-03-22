"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Paper,
  Typography,
  Box,
  Grid,
  Chip,
  Divider,
  CircularProgress,
} from "@mui/material";
import { format } from "date-fns";
import { th } from "date-fns/locale";

const statusColors: Record<
  string,
  "warning" | "info" | "success" | "error" | "default"
> = {
  PENDING: "warning",
  ASSIGNED: "info",
  APPROVED: "success",
  REJECTED: "error",
  CANCELLED: "default",
} as const;

const statusLabels = {
  PENDING: "รอดำเนินการ",
  ASSIGNED: "จัดรถแล้ว",
  APPROVED: "อนุมัติแล้ว",
  REJECTED: "ปฏิเสธ",
  CANCELLED: "ยกเลิก",
};

interface Request {
  _id: string;
  start_datetime: string;
  end_datetime: string;
  destination: string;
  purpose: string;
  status: keyof typeof statusLabels;
  car_id?: {
    brand: string;
    model: string;
    licensePlate: string;
  };
  driver_id?: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
  };
  approver_id?: {
    firstName: string;
    lastName: string;
  };
  user_id: {
    _id: string;
    firstName: string;
    lastName: string;
    department: string;
    position: string;
  };
  passenger_count: number;
  travel_type: string;
  usage_type: string;
}

export default function HistoryDetailPage() {
  const params = useParams();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userInfo, setUserInfo] = useState<{
    firstName: string;
    lastName: string;
    department: string;
    position: string;
  } | null>(null);

  useEffect(() => {
    console.log(params);

    const fetchRequests = async () => {
      try {
        const token = localStorage.getItem("car_rent_token");
        if (!token) {
          throw new Error("กรุณาเข้าสู่ระบบ");
        }

        const id = params?.id;
        const response = await fetch(`/api/history/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "เกิดข้อผิดพลาดในการดึงข้อมูล");
        }

        const data = await response.json();
        setRequests(data);

        // เก็บข้อมูลผู้ใช้จากข้อมูลแรกที่ได้
        if (data.length > 0 && data[0].user_id) {
          setUserInfo({
            firstName: data[0].user_id.firstName,
            lastName: data[0].user_id.lastName,
            department: data[0].user_id.department,
            position: data[0].user_id.position,
          });
        }
      } catch (err) {
        console.log("Error fetching requests:", err);
        setError(
          err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการดึงข้อมูล"
        );
      } finally {
        setLoading(false);
      }
    };

    if (params?.id) {
      fetchRequests();
    }
  }, [params?.id]);

  if (loading) return <CircularProgress />;
  if (error) return <div>เกิดข้อผิดพลาด: {error}</div>;
  if (!requests.length) return <div>ไม่พบข้อมูล</div>;

  return (
    <Box sx={{ p: 3 }}>
      {userInfo && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ mb: 1 }}>
            ประวัติการขอใช้รถของ {userInfo.firstName} {userInfo.lastName}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            ตำแหน่ง: {userInfo.position}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            สำนักงาน: {userInfo.department}
          </Typography>
        </Box>
      )}

      <Typography variant="h5" sx={{ mb: 3 }}>
        ประวัติการขอใช้รถทั้งหมด
      </Typography>

      {requests.map((request) => (
        <Paper key={request._id} sx={{ p: 3, mb: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Chip
                label={statusLabels[request.status]}
                color={statusColors[request.status]}
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">ผู้ขอใช้รถ</Typography>
              <Typography>
                {request.user_id.firstName} {request.user_id.lastName}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">วันที่ขอใช้รถ</Typography>
              <Typography>
                {format(
                  new Date(request.start_datetime),
                  "dd MMMM yyyy HH:mm น.",
                  {
                    locale: th,
                  }
                )}
                {" ถึง "}
                {format(new Date(request.end_datetime), "dd MMMM yyyy HH:mm น.", {
                  locale: th,
                })}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">จุดหมายปลายทาง</Typography>
              <Typography>{request.destination}</Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">วัตถุประสงค์</Typography>
              <Typography>{request.purpose}</Typography>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2">จำนวนผู้โดยสาร</Typography>
              <Typography>{request.passenger_count} คน</Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2">ประเภทการเดินทาง</Typography>
              <Typography>{request.travel_type}</Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2">ลักษณะการใช้งาน</Typography>
              <Typography>{request.usage_type}</Typography>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            <Grid item xs={12} md={3}>
              <Typography variant="subtitle2">รถที่จัดให้</Typography>
              <Typography>
                {request.car_id
                  ? `${request.car_id.brand} ${request.car_id.model} (${request.car_id.licensePlate})`
                  : "-"}
              </Typography>
            </Grid>

            <Grid item xs={12} md={3}>
              <Typography variant="subtitle2">คนขับ</Typography>
              <Typography>
                {request.driver_id
                  ? `${request.driver_id.firstName} ${request.driver_id.lastName}`
                  : "-"}
              </Typography>
            </Grid>

            <Grid item xs={12} md={3}>
              <Typography variant="subtitle2">เบอร์โทรศัพท์ของคนขับ</Typography>
              <Typography>
                {request.driver_id
                  ? `${request.driver_id.phoneNumber}`
                  : "-"}
              </Typography>
            </Grid>

            <Grid item xs={12} md={3}>
              <Typography variant="subtitle2">ผู้อนุมัติ</Typography>
              <Typography>
                {request.approver_id
                  ? `${request.approver_id.firstName} ${request.approver_id.lastName}`
                  : "-"}
              </Typography>
            </Grid>
          </Grid>

          {request.status === "APPROVED" && (
            <div
              onClick={() => {
                window.open(`/pdf/${request._id}`, "_blank");
              }}
              className="bg-blue-600 w-full cursor-pointer hover:bg-blue-800 mt-10 text-white p-2 rounded-md"
            >
              ดาวโหลดเอกสาร
            </div>
          )}
        </Paper>
      ))}
    </Box>
  );
}
