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
          IN_USE: "#81C784",
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

  const downloadCSV = (type: "car" | "driver", filename: string) => {
    // เรียก API โดยตรง
    window.location.href = `/api/car-usage/download?type=${type}`;
  };

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
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h4" component="h1">
          ข้อมูลการใช้งานรถยนต์ส่วนกลาง
        </Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<FileDownloadIcon />}
            onClick={() => downloadCSV("car", "car-usage-report.csv")}  //CSV
            sx={{
              mr: 1,
              bgcolor: "#4CAF50",
              "&:hover": { bgcolor: "#388E3C" },
            }}
          >
            รายงานการใช้รถ
          </Button>
          <Button
            variant="contained"
            startIcon={<FileDownloadIcon />}
            onClick={() => downloadCSV("driver", "driver-report.csv")}
            sx={{ bgcolor: "#4CAF50", "&:hover": { bgcolor: "#388E3C" } }}
          >
            รายงานพนักงานขับรถ
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* แผนภูมิสถานะรถ */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                สถานะรถยนต์
              </Typography>
              <Box sx={{ height: 300 }}>
                <PieChart
                  series={[
                    {
                      data: carStatusData,
                      highlightScope: { faded: "global", highlighted: "item" },
                    },
                  ]}
                  height={300}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* แผนภูมิจำนวนการใช้งานของพนักงานขับรถ */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                จำนวนเที่ยวของพนักงานขับรถ
              </Typography>
              <Box sx={{ height: 300 }}>
                <BarChart
                  xAxis={[
                    {
                      scaleType: "band",
                      data: driverStats.map((d) => `${d.firstName}`),
                    },
                  ]}
                  series={[
                    {
                      data: driverStats.map((d) => d.totalTrips),
                    },
                  ]}
                  height={300}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* ตารางข้อมูลรถ */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                รายละเอียดการใช้งานรถ
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ทะเบียนรถ</TableCell>
                      <TableCell>ยี่ห้อ/รุ่น</TableCell>
                      <TableCell align="right">จำนวนเที่ยว</TableCell>
                      <TableCell align="right">ชั่วโมงใช้งาน</TableCell>
                      <TableCell>สถานะ</TableCell>
                      {/* <TableCell>การใช้งานล่าสุด</TableCell> */}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {carStats.map((car) => (
                      <TableRow key={car.carId}>
                        <TableCell>{car.licensePlate}</TableCell>
                        <TableCell>{`${car.brand} ${car.model}`}</TableCell>
                        <TableCell align="right">{car.totalTrips}</TableCell>
                        <TableCell align="right">{car.totalHours}</TableCell>
                        <TableCell>{car.status}</TableCell>
                        {/* <TableCell>
                          <Timeline>
                            {car.recentTrips.map((trip, index) => (
                              <TimelineItem key={index}>
                                <TimelineOppositeContent color="text.secondary">
                                  {formatDate(
                                    trip.start_datetime,
                                    "dd MMM yyyy HH:mm"
                                  )}
                                  {" - "}
                                  {formatDate(trip.end_datetime, "HH:mm")}
                                </TimelineOppositeContent>
                                <TimelineSeparator>
                                  <TimelineDot
                                    color={
                                      trip.status === "COMPLETED"
                                        ? "success"
                                        : "success"
                                    }
                                  />
                                  {index < car.recentTrips.length - 1 && (
                                    <TimelineConnector />
                                  )}
                                </TimelineSeparator>
                                <TimelineContent>
                                  <Typography variant="body2" component="div">
                                    <Box sx={{ fontWeight: "bold" }}>
                                      {trip.destination}
                                    </Box>
                                    <Box sx={{ color: "text.secondary" }}>
                                      วัตถุประสงค์: {trip.purpose}
                                    </Box>
                                  </Typography>
                                </TimelineContent>
                              </TimelineItem>
                            ))}
                          </Timeline>
                        </TableCell> */}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* ตารางข้อมูลพนักงานขับรถ */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                รายละเอียดการทำงานของพนักงานขับรถ
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ชื่อ-นามสกุล</TableCell>
                      <TableCell align="right">จำนวนเที่ยว</TableCell>
                      <TableCell align="right">ชั่วโมงทำงาน</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {driverStats.map((driver) => (
                      <TableRow key={driver.driverId}>
                        <TableCell>{`${driver.firstName} ${driver.lastName}`}</TableCell>
                        <TableCell align="right">{driver.totalTrips}</TableCell>
                        <TableCell align="right">{driver.totalHours}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Calendar Timeline Section */}
      </Grid>
    </Container>
  );
}
