"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Button,
  Divider,
} from "@mui/material";
import { PieChart } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts/BarChart";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import Timeline from "@mui/lab/Timeline";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineDot from "@mui/lab/TimelineDot";
import TimelineOppositeContent from "@mui/lab/TimelineOppositeContent";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  parse,
  getDay,
} from "date-fns";
import th from "date-fns/locale/th/index.js";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";

import "react-big-calendar/lib/css/react-big-calendar.css";
import PropTypes from 'prop-types'
interface CarUsageStats {
  carId: string;
  brand: string;
  model: string;
  licensePlate: string;
  totalTrips: number;
  totalHours: number;
  status: string;
  recentTrips: {
    destination: string;
    purpose: string;
    start_datetime: string;
    end_datetime: string;
    status: string;
  }[];
}

interface DriverStats {
  driverId: string;
  firstName: string;
  lastName: string;
  totalTrips: number;
  totalHours: number;
}

// เพิ่ม interface สำหรับ CSV data
interface CsvData {
  content: string[];
}

interface CsvDataResponse {
  car: CsvData;
  driver: CsvData;
}

// เพิ่มฟังก์ชัน format date ที่ปลอดภัย
const formatDate = (dateString: string, formatStr: string) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "Invalid date";
    }
    return format(date, formatStr, { locale: th });
  } catch (error) {
    return "Invalid date";
  }
};

// เพิ่ม localizer สำหรับ calendar
const locales = { th };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// เพิ่มฟังก์ชันสำหรับกำหนดสีตามสถานะ
const eventStyleGetter = (event: any) => {
  let style = {
    backgroundColor: "#3174ad", // สีเริ่มต้น
    borderRadius: "5px",
    opacity: 0.8,
    color: "white",
    border: "none",
    display: "block",
  };

  // กำหนดสีตามสถานะของการจอง
  if (event.status === "APPROVED") {
    style.backgroundColor = "#4CAF50"; // สีเขียว
  } else if (event.status === "PENDING") {
    style.backgroundColor = "#FFA726"; // สีส้ม
  } else if (event.status === "REJECTED") {
    style.backgroundColor = "#F44336"; // สีแดง
  }

  return {
    style: style,
  };
};

export default function CarUsePage() {
  const [carStats, setCarStats] = useState<CarUsageStats[]>([]);
  const [driverStats, setDriverStats] = useState<DriverStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [carStatusData, setCarStatusData] = useState([
    { id: 0, value: 0, label: "ว่าง", color: "#4CAF50" },
    { id: 2, value: 0, label: "ซ่อมบำรุง", color: "#F44336" },
  ]);
  const [csvData, setCsvData] = useState<CsvDataResponse>({
    car: { content: [] },
    driver: { content: [] },
  });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weeklyTrips, setWeeklyTrips] = useState<{
    [key: string]: CarUsageStats["recentTrips"];
  }>({});
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/car-usage");
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }

        const data = await response.json();

        setCarStats(data.carStats);
        setDriverStats(data.driverStats);
        setCsvData(data.csvData);

        // แปลงข้อมูลสถานะรถเป็นรูปแบบที่ใช้กับ PieChart
        const statusColors = {
          AVAILABLE: "#4CAF50",
          IN_USE: "#2196F3",
          MAINTENANCE: "#F44336",
        };

        const statusLabels = {
          AVAILABLE: "ว่าง",
          MAINTENANCE: "ซ่อมบำรุง",
        };

        const formattedStatusData = data.carStatusCount.map(
          (status: any, index: number) => ({
            id: index,
            value: status.count,
            label: statusLabels[status._id as keyof typeof statusLabels],
            color: statusColors[status._id as keyof typeof statusColors],
          })
        );

        setCarStatusData(formattedStatusData);
        setLoading(false);
      } catch (error) {
        console.log("Error fetching stats:", error);
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    if (carStats.length > 0) {
      // รวบรวมการเดินทางทั้งหมดในสัปดาห์
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
      const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

      const trips: { [key: string]: CarUsageStats["recentTrips"] } = {};
      weekDays.forEach((day) => {
        trips[format(day, "yyyy-MM-dd")] = [];
      });

      carStats.forEach((car) => {
        car.recentTrips.forEach((trip) => {
          const tripDate = format(new Date(trip.start_datetime), "yyyy-MM-dd");
          if (trips[tripDate]) {
            trips[tripDate].push(trip);
          }
        });
      });

      setWeeklyTrips(trips);
    }
  }, [carStats, selectedDate]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Calendar Timeline Section */}
        <Grid item xs={12}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ปฏิทินการใช้งานรถ
              </Typography>
              <Box sx={{ height: 600 }}>
                <Calendar
                  localizer={localizer}
                  events={carStats.flatMap((car) =>
                    car.recentTrips.map((trip) => ({
                      title: `${car.licensePlate} - ${car.brand} ${car.model}`,
                      start: new Date(trip.start_datetime),
                      end: new Date(trip.end_datetime),
                      resource: trip.purpose,
                      status: trip.status, // เพิ่ม status เพื่อใช้ในการกำหนดสี

                    }))
                  )}
                  date={currentDate}
                  onNavigate={(date) => setCurrentDate(date)}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: "100%" }}
                  views={["month"]}
                  eventPropGetter={eventStyleGetter}
                  popup
                  messages={{
                    next: "ถัดไป",
                    previous: "ก่อนหน้า",
                    today: "วันนี้",
                    month: "เดือน",
                    week: "สัปดาห์",
                    day: "วัน",
                  }}
                />
              </Box>
              {/* เพิ่มส่วนคำอธิบายสี */}
              <Box
                sx={{
                  mt: 2,
                  display: "flex",
                  gap: 3,
                  justifyContent: "center",
                }}
              >

                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      backgroundColor: "#3174ad",
                      borderRadius: "3px",
                      mr: 1,
                    }}
                  />
                  <Typography variant="body2">จัดรถแล้ว</Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      backgroundColor: "#4CAF50",
                      borderRadius: "3px",
                      mr: 1,
                    }}
                  />
                  <Typography variant="body2">อนุมัติแล้ว</Typography>
                </Box>
                
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      backgroundColor: "#F44336",
                      borderRadius: "3px",
                      mr: 1,
                    }}
                  />
                  <Typography variant="body2">ไม่อนุมัติ</Typography>
                </Box>

              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
