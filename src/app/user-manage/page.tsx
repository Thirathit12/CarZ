"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Menu,
  Alert,
  Snackbar,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterListIcon,
  History as HistoryIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import jwt from "jsonwebtoken";
import { useAuth } from "@/contexts/AuthContext";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string;
  position: string;
  birthDate: string;
  driverLicenseExpiry?: string;
}

const departments = [
  "สำนักตรวจสอบ",
  "สำนักกฏหมาย",
  "สำนักงานเลขาผู้อำนวยการ",
  "สำนักบริหารแผนยุทธศาสตร์",
  "สำนักการเงินและทรัพย์สิน",
  "สำนักพัฒนาธุรกิจ",
  "สำนักดิจิทัลและสารสนเทศ",
  "สำนักบริหารทุนมนุษย์",
  "สำนักพัฒนากายภาพและจัดการสิ่งแวดล้อม",
  "สถาบันอนุรักษ์และวิจัยสัตว์",
  "สถาบันจัดการสวนสัตว์",
  "อื่นๆ",
];

export default function UserManage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");
  const [openDialog, setOpenDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user, logout } = useAuth();

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "user",
    department: "",
    position: "",
    gender: "ชาย",
    birthDate: "",
    phoneNumber: "",
    driverLicenseExpiry: "",
  });

  const [otherDepartment, setOtherDepartment] = useState("");

  const fetchUsers = async () => {
    const token = localStorage.getItem("car_rent_token");
    const url = roleFilter ? `/api/user?role=${roleFilter}` : "/api/user";
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("ไม่สามารถดึงข้อมูลได้");
    }

    const data = await response.json();
    setUsers(data);
  };

  useEffect(() => {
    const checkAuthAndFetchUsers = async () => {
      const token = localStorage.getItem("car_rent_token");
      console.log("Token:", token);

      if (!token) {
        router.push("/");
        return;
      }

      try {
        console.log("Current user:", user);

        if (user === undefined) {
          console.log("Waiting for user data...");
          return;
        }

        if (!user && token) {
          console.log("Has token but no user yet, waiting...");
          return;
        }

        if (!user && !token) {
          console.log("No user and no token, redirecting...");
          router.push("/");
          return;
        }

        console.log("User role:", user?.role);
        setUserRole(user?.role || "");

        if (user?.role) {
          await fetchUsers();
        }
      } catch (error) {
        console.log("Error:", error);
        setSnackbar({
          open: true,
          message: "เกิดข้อผิดพลาด",
          severity: "error",
        });
        router.push("/login");
      }
    };

    checkAuthAndFetchUsers();
  }, [user, router, roleFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("car_rent_token");
      const url = selectedUser ? `/api/user` : "/api/user";
      const method = selectedUser ? "PUT" : "POST";

      const submittedData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        position: formData.position,
        gender: formData.gender,
        ...(formData.birthDate && { birthDate: formData.birthDate }),
        phoneNumber: formData.phoneNumber,
        department:
          formData.department === "อื่นๆ"
            ? otherDepartment
            : formData.department,
        driverLicenseExpiry:
          formData.role === "driver" ? formData.driverLicenseExpiry : undefined,
      };

      console.log("Submitting data:", submittedData);

      const body = selectedUser
        ? JSON.stringify({ ...submittedData, id: selectedUser._id })
        : JSON.stringify(submittedData);

      console.log("Request body:", body);

      console.log("Parsed body:", JSON.parse(body));

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body,
      });

      const responseData = await response.json();
      console.log("Response data:", responseData);

      if (!response.ok) {
        throw new Error(responseData.error || "การดำเนินการไม่สำเร็จ");
      }

      setSnackbar({
        open: true,
        message: `${selectedUser ? "แก้ไข" : "เพิ่ม"}ผู้ใช้สำเร็จ`,
        severity: "success",
      });

      setOpenDialog(false);
      fetchUsers();
      resetForm();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.message,
        severity: "error",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("คุณต้องการลบผู้ใช้นี้ใช่หรือไม่?")) {
      try {
        const token = localStorage.getItem("car_rent_token");
        const response = await fetch(`/api/user?id=${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "การลบไม่สำเร็จ");
        }

        setSnackbar({
          open: true,
          message: "ลบผู้ใช้สำเร็จ",
          severity: "success",
        });

        fetchUsers();
      } catch (error: any) {
        setSnackbar({
          open: true,
          message: error.message,
          severity: "error",
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "user",
      department: "",
      position: "",
      gender: "ชาย",
      birthDate: "",
      phoneNumber: "",
      driverLicenseExpiry: "",
    });
    setOtherDepartment("");
    setSelectedUser(null);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    const formattedBirthDate = user.birthDate
      ? new Date(user.birthDate).toISOString().split("T")[0]
      : "";
    const formattedLicenseExpiry = user.driverLicenseExpiry
      ? new Date(user.driverLicenseExpiry).toISOString().split("T")[0]
      : "";

    setFormData({
      ...formData,
      ...user,
      birthDate: formattedBirthDate,
      driverLicenseExpiry: formattedLicenseExpiry,
      password: "",
    });
    setOpenDialog(true);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "#6a1b9a"; // สีม่วง
      case "admin":
        return "#d32f2f"; // สีแดง
      case "driver":
        return "#1976d2"; // สีฟ้า
      case "approver":
        return "#f57c00"; // สีส้ม
      default:
        return "#4caf50"; // สีเขียว สำหรับ user
    }
  };

  const handleViewHistory = (userId: string) => {
    router.push(`/history/${userId}`);
  };

  return (
    <Box sx={{ p: 4 }}>
      <h1 className="text-2xl font-bold">จัดการข้อมูลผู้ใช้</h1>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 4 }}>
        
        <Button
          variant="contained"
          onClick={() => setOpenDialog(true)}
          sx={{
            backgroundColor: "#4caf50",
            "&:hover": { backgroundColor: "#45a049" },
          }}
        >
          เพิ่มผู้ใช้ใหม่
        </Button>

        <div>
          <Button
            endIcon={<FilterListIcon />}
            onClick={(e) => setAnchorEl(e.currentTarget)}
          >
            กรองตาม Role
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem
              onClick={() => {
                setRoleFilter("");
                setAnchorEl(null);
              }}
            >
              ทั้งหมด
            </MenuItem>
            <MenuItem
              onClick={() => {
                setRoleFilter("user");
                setAnchorEl(null);
              }}
            >
              User
            </MenuItem>
            <MenuItem
              onClick={() => {
                setRoleFilter("admin");
                setAnchorEl(null);
              }}
            >
              Admin
            </MenuItem>
            {userRole === "super_admin" && (
              <MenuItem
                onClick={() => {
                  setRoleFilter("super_admin");
                  setAnchorEl(null);
                }}
              >
                Super Admin
              </MenuItem>
            )}
            <MenuItem
              onClick={() => {
                setRoleFilter("driver");
                setAnchorEl(null);
              }}
            >
              Driver
            </MenuItem>
            <MenuItem
              onClick={() => {
                setRoleFilter("approver");
                setAnchorEl(null);
              }}
            >
              Approver
            </MenuItem>
          </Menu>
        </div>
      </Box>

      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
            <TableCell>ชื่อ</TableCell>
            <TableCell>นามสกุล</TableCell>
            <TableCell>อีเมล</TableCell>
            <TableCell>ตำแหน่ง</TableCell>
            <TableCell>สำนักงาน</TableCell>
            <TableCell>บทบาท</TableCell>
            <TableCell>วันหมดอายุใบขับขี่</TableCell>
            <TableCell>การจัดการ</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user, index) => (
            <TableRow
              key={user._id}
              sx={{
                backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8f9fa",
                "&:hover": {
                  backgroundColor: "#e9ecef",
                },
              }}
            >
              <TableCell>{user.firstName}</TableCell>
              <TableCell>{user.lastName}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.position}</TableCell>
              <TableCell>{user.department}</TableCell>
              <TableCell>
                <Box
                  sx={{
                    display: "inline-block",
                    bgcolor: getRoleColor(user.role),
                    color: "white",
                    px: 2,
                    py: 0.5,
                    borderRadius: 1,
                    fontWeight: "bold",
                  }}
                >
                  {user.role}
                </Box>
              </TableCell>
              <TableCell>
                {user.role === "driver" && user.driverLicenseExpiry
                  ? new Date(user.driverLicenseExpiry).toLocaleDateString(
                      "th-TH"
                    )
                  : "-"}
              </TableCell>
              <TableCell>
                <IconButton onClick={() => handleEdit(user)}>
                  <EditIcon />
                </IconButton>
                <IconButton
                  onClick={() => handleDelete(user._id)}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
                <IconButton
                  onClick={() => handleViewHistory(user._id)}
                  color="primary"
                  title="ดูประวัติการขอใช้รถ"
                >
                  <HistoryIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {selectedUser ? "แก้ไขผู้ใช้" : "เพิ่มผู้ใช้ใหม่"}
          </DialogTitle>
          <DialogContent>
            <TextField
              required
              fullWidth
              label="ชื่อ"
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              margin="normal"
            />
            <TextField
              required
              fullWidth
              label="นามสกุล"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              margin="normal"
            />
            <TextField
              required
              fullWidth
              label="อีเมล"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              margin="normal"
            />
            {selectedUser ? (
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="รหัสผ่านใหม่ (เว้นว่างถ้าไม่ต้องการเปลี่ยน)"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  margin="normal"
                />
              </Box>
            ) : (
              <TextField
                required
                fullWidth
                label="รหัสผ่าน"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                margin="normal"
              />
            )}
            <FormControl required fullWidth margin="normal">
              <InputLabel>เพศ</InputLabel>
              <Select
                value={formData.gender}
                label="เพศ"
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value })
                }
              >
                <MenuItem value="ชาย">ชาย</MenuItem>
                <MenuItem value="หญิง">หญิง</MenuItem>
                <MenuItem value="อื่นๆ">อื่นๆ</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="วันเดือนปีเกิด"
              type="date"
              value={formData.birthDate}
              onChange={(e) =>
                setFormData({ ...formData, birthDate: e.target.value })
              }
              margin="normal"
              InputLabelProps={{
                shrink: true,
              }}
            />
            <TextField
              required
              fullWidth
              label="เบอร์โทรศัพท์"
              value={formData.phoneNumber}
              onChange={(e) =>
                setFormData({ ...formData, phoneNumber: e.target.value })
              }
              margin="normal"
            />
            <FormControl required fullWidth margin="normal">
              <InputLabel>บทบาท</InputLabel>
              <Select
                value={formData.role}
                label="บทบาท"
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
              >
                <MenuItem
                  value="user"
                  sx={{ color: "#388e3c", fontWeight: "bold" }}
                >
                  User
                </MenuItem>
                <MenuItem
                  value="admin"
                  sx={{ color: "#d32f2f", fontWeight: "bold" }}
                >
                  Admin
                </MenuItem>
                {userRole === "super_admin" && (
                  <MenuItem
                    value="super_admin"
                    sx={{ color: "#6a1b9a", fontWeight: "bold" }}
                  >
                    Super Admin
                  </MenuItem>
                )}
                <MenuItem
                  value="driver"
                  sx={{ color: "#1976d2", fontWeight: "bold" }}
                >
                  Driver
                </MenuItem>
                <MenuItem
                  value="approver"
                  sx={{ color: "#f57c00", fontWeight: "bold" }}
                >
                  Approver
                </MenuItem>
              </Select>
            </FormControl>
            <FormControl required fullWidth margin="normal">
              <InputLabel>สำนักงาน</InputLabel>
              <Select
                value={formData.department}
                label="สำนักงาน"
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ ...formData, department: value });
                  if (value !== "อื่นๆ") {
                    setOtherDepartment("");
                  }
                }}
              >
                {departments.map((dept) => (
                  <MenuItem key={dept} value={dept}>
                    {dept}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              required
              fullWidth
              label="ตำแหน่ง"
              value={formData.position}
              onChange={(e) =>
                setFormData({ ...formData, position: e.target.value })
              }
              margin="normal"
            />

            {formData.role === "driver" && (
              <TextField
                required
                fullWidth
                label="วันหมดอายุใบขับขี่"
                type="date"
                value={formData.driverLicenseExpiry}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    driverLicenseExpiry: e.target.value,
                  })
                }
                margin="normal"
                InputLabelProps={{
                  shrink: true,
                }}
                helperText="กรุณาระบุวันหมดอายุใบขับขี่"
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>ยกเลิก</Button>
            <Button type="submit" variant="contained" color="success">
              {selectedUser ? "บันทึก" : "เพิ่ม"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
