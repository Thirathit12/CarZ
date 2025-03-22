"use client";
import React, { useRef, useEffect, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useParams } from "next/navigation";
interface IUser {
  firstName: string;
  lastName: string;
  gender: string;
  birthDate: Date;
  email: string;
  phoneNumber: string;
  position: string;
  department: string;
  branch?: string;
  role: string;
}

interface ICar {
  brand: string;
  model: string;
  licensePlate: string;
  capacity: number;
  status: "AVAILABLE" | "IN_USE" | "MAINTENANCE";
  type: "รถเก๋ง" | "รถตู้" | "รถกระบะ" | "รถบัส";
  notes?: string;
}

interface ICarRequest {
  _id: string;
  user_id: IUser;
  admin_id?: IUser;
  driver_id?: IUser | null;
  car_id?: ICar | null;
  approver_id?: IUser | null;
  start_datetime: Date;
  end_datetime: Date;
  purpose: string;
  destination: string;
  passenger_count: number;
  status: "PENDING" | "ASSIGNED" | "APPROVED" | "REJECTED" | "CANCELLED";
  travel_type: string;
  usage_type: string;
  created_at: Date;
}
const PDFPage = () => {
  const pdfRef1 = useRef<HTMLDivElement>(null);
  const pdfRef2 = useRef<HTMLDivElement>(null);
  const params = useParams();
  // เพิ่ม state สำหรับเก็บข้อมูล request
  const [requestData, setRequestData] = useState<ICarRequest | null>(null);

  useEffect(() => {
    const fetchRequestData = async () => {
      console.log(params);
      try {
        // ดึง token จาก localStorage
        const token = localStorage.getItem("car_rent_token");

        if (!token) {
          console.log("ไม่พบ token");
          return;
        }

        // ดึง id จาก URL (ตัวอย่างเช่น /pdf?id=123)

        const requestId = params.id;

        if (!requestId) {
          console.log("ไม่พบ request ID");
          return;
        }

        // เรียก API
        const response = await fetch(`/api/requests/${requestId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch request data");
        }

        const data = await response.json();
        // แปลง created_at เป็น Date object
        data.created_at = new Date(data.created_at);
        console.log("Request Data:", data);
        setRequestData(data);
      } catch (error) {
        console.log("Error fetching request data:", error);
      }
    };

    fetchRequestData();
  }, []); // เรียกครั้งเดียวตอน component mount

  const downloadPDF = async () => {
    const input1 = pdfRef1.current;
    const input2 = pdfRef2.current;
    if (!input1 || !input2) return;

    // สร้าง PDF จากทั้งสองหน้า
    const pdf = new jsPDF("p", "mm", "a4");

    // หน้าที่ 1
    const canvas1 = await html2canvas(input1);
    const imgData1 = canvas1.toDataURL("image/png");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData1, "PNG", 0, 0, pdfWidth, pdfHeight);

    // เพิ่มหน้าใหม่
    pdf.addPage();

    // หน้าที่ 2
    const canvas2 = await html2canvas(input2);
    const imgData2 = canvas2.toDataURL("image/png");
    pdf.addImage(imgData2, "PNG", 0, 0, pdfWidth, pdfHeight);

    pdf.save("document.pdf");
  };

  const value = "สำนักตรวจสอบ";

  const arry = [
    {
      name: "สตส.",
      value: "สำนักตรวจสอบ",
    },
    {
      name: "สกม.",
      value: "สำนักกฏหมาย",
    },
    {
      name: "สลอ.",
      value: "สำนักงานเลขาผู้อำนวยการ",
    },
    {
      name: "สงท.",
      value: "สำนักการเงินและทรัพย์สิน",
    },
    {
      name: "สบย.",
      value: "สำนักบริหารแผนยุทธศาสตร์",
    },
    {
      name: "สพส.",
      value: "สำนักพัฒนากายภาพและจัดการสิ่งแวดล้อม",
    },
    {
      name: "สอว.",
      value: "สถาบันอนุรักษ์และวิจัยสัตว์",
    },
    {
      name: "สพธ.",
      value: "สำนักพัฒนาธุรกิจ",
    },
    {
      name: "สสส.",
      value: "สำนักดิจิทัลและสารสนเทศ",
    },
    {
      name: "สบท.",
      value: "สำนักบริหารทุนมนุษย์",
    },
    {
      name: "สบจ.",
      value: "สถาบันจัดการสวนสัตว์",
    },
    {
      name: "อื่นๆ.",
      value: "",
    },
  ];

  const typeBack = [
    "ส่ง/รอรับกลับด้วย",
    "ส่งอย่างเดียว",
    "รับกลับอย่างเดียว",
    "ส่งและไปรับกลับตามเวลากลับ",
  ];

  const valueBack = "ส่งอย่างเดียว";

  if (!requestData) return <div>Loading...</div>;

  return (
    <div className="p-10">
      <button
        onClick={downloadPDF}
        className="mb-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        ดาวน์โหลด PDF
      </button>

      <div
        ref={pdfRef1}
        className="w-[794px] text-[14px] h-[1123px] relative border p-10 flex flex-col"
      >
        <div>อสส ๑๑๑๐/</div>
        <div className="grid grid-cols-3 gap-10">
          <div className="flex flex-col mt-4">ลว ๒๓ ก.ค. ๒๕๖๗</div>
          <div className="flex flex-col text-[16px] w-[280px] gap-2 font-bold text-center">
            <div className="underline">บัญชีหมายเลข ๑</div>
            <div>ใบขออนุญาตใช้รถส่วนกลาง/รถรับรอง</div>
          </div>
        </div>
        <div className="w-full mt-16 flex justify-end">
          <div className="flex">
            <div className="w-[50px]">วันที่</div>
            {/* <div className="w-[200px] relative text-center">
              {requestData?.created_at &&
                new Date(requestData.created_at).toLocaleDateString("th-TH", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
            </div> */}

            <div className="w-[200px] relative text-center">
              {requestData?.created_at ? (
                <span>
                  {new Date(requestData.created_at).toLocaleDateString("th-TH", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              ) : (
                <span className="text-gray-400">N/A</span>
              )}
              <div className="absolute left-0 right-0 bottom-[-5px] border-b border-dotted border-black"></div>
            </div>

          </div>
          {/* <div className="flex">
            <div className="w-[70px]">เดือน</div>
            <div className="w-full relative text-center">
              ข้อมูล
              <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
            </div>
          </div>
          <div className="flex">
            <div className="w-[70px]">พ.ศ</div>
            <div className="w-full relative text-center">
              ข้อมูล
              <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
            </div>
          </div> */}
        </div>

        <div className="flex mt-10">
          <div className="w-[200px]"> เรียน (ผู้มีอำนาจสั่งใช้รถ)</div>

          <div className="w-full relative text-center">
            {requestData.approver_id?.firstName}{" "}
            {requestData.approver_id?.lastName}
            <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
          </div>
        </div>

        <div className="flex gap-2 mt-4 w-full  justify-between">
          <div className="w-1/2 flex">
            <div> ข้าพเจ้า </div>{" "}
            <div className="w-full relative text-center">
              {requestData.user_id?.firstName} {requestData.user_id?.lastName}
              <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
            </div>
          </div>{" "}
          <div className="flex w-1/2">
            <div>ตำแหน่ง</div>
            <div className="w-full relative text-center">
              {requestData.user_id?.position}
              <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
            </div>
          </div>
        </div>

        <div className="mt-4 w-full flex">
          <div className="w-full">
            ขออนุญาตใช้รถ ส่วนกลำง/รถรับรอง หมายเลขทะเบียน
          </div>
          <div className="w-full relative text-center">
            {requestData.car_id?.licensePlate}
            <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
          </div>
        </div>

        <div className="mt-4 w-full flex">
          <div className="w-[50px]">เพื่อ</div>
          <div className="w-full relative text-center">
            {requestData.purpose}
            <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
          </div>
        </div>



        
        <div className="font-bold underline w-[200px] mt-4">การเดินทาง</div>
        {requestData.travel_type === "วันเดียว" && (
          <div>
            <div className="font-bold underline mt-4 w-[120px]">วันเดียว</div>
            <div className="flex">
              <div className="flex flex-col">
                <div className="flex">
                  <div className="flex">
                    <div className="flex">
                      <div className="w-[70px]">วันที่</div>
                      <div className="w-full relative text-center">
                        {requestData.start_datetime &&
                          new Date(
                            requestData.start_datetime
                          ).toLocaleDateString("th-TH", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
                      </div>
                    </div>
                    {/* <div className="flex gap-4">
                      <div className="w-[70px]">เดือน</div>
                      <div className="w-full relative text-center">
                        ข้อมูล
                        <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
                      </div>
                    </div>
                    <div className="flex">
                      <div className="w-[70px]">พ.ศ</div>
                      <div className="w-full relative text-center">
                        ข้อมูล
                        <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
                      </div>
                    </div> */}
                    <div className="flex">
                      <div className="w-[120px]">เวลาไป</div>
                      <div className="w-full relative text-center">
                        {requestData.start_datetime &&
                          new Date(
                            requestData.start_datetime
                          ).toLocaleTimeString("th-TH", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
                      </div>
                      <div>น</div>
                    </div>
                    <div className="flex ml-4">
                      <div className="w-[120px]">เวลากลับ</div>
                      <div className="w-full relative text-center">
                        {requestData.end_datetime &&
                          new Date(requestData.end_datetime).toLocaleTimeString(
                            "th-TH",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
                      </div>
                      <div>น</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {requestData.travel_type === "หลายวัน" && (
          <div>
            <div className="font-bold underline mt-4 w-[120px]">หลายวัน</div>
            <div className="flex">
              <div className="flex flex-col">
                <div className="flex">
                  <div className="flex">
                    <div className="w-[70px]">วันที่</div>
                    <div className="w-full relative text-center">
                      {requestData.start_datetime &&
                        new Date(requestData.start_datetime).toLocaleDateString(
                          "th-TH",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          }
                        )}
                      <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
                    </div>
                  </div>
                  <div>ถึง</div>

                  <div className="flex">
                    <div className="w-[70px]">วันที่</div>
                    <div className="w-full relative text-center">
                      {requestData.end_datetime &&
                        new Date(requestData.end_datetime).toLocaleDateString(
                          "th-TH",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          }
                        )}
                      <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
                    </div>
                  </div>
                  <div className="flex ml-6">
                    <div className="w-[120px]">เวลาไป</div>
                    <div className="w-full relative text-center">
                      {requestData.start_datetime &&
                        new Date(requestData.start_datetime).toLocaleTimeString(
                          "th-TH",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
                    </div>
                    <div>น</div>
                  </div>
                  <div className="flex ml-4">
                    <div className="w-[120px]">เวลากลับ</div>
                    <div className="w-full relative text-center">
                      {requestData.end_datetime &&
                        new Date(requestData.end_datetime).toLocaleTimeString(
                          "th-TH",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
                    </div>
                    <div>น</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="flex gap-4 mt-6 justify-center ">
          {typeBack.map((item, index) => (
            <div key={index} className="flex relative items-center gap-2">
              <div className="w-4 h-4 border border-black relative">
                {item === valueBack && (
                  <span className="absolute text-[16px] top-[-10px] left-[0px]">
                    ✓
                  </span>
                )}
              </div>
              {item}
            </div>
          ))}
        </div>

        <div className="w-full flex mt-5">
          {" "}
          <div className="w-[100px]">จำนวนที่นั่ง</div>
          <div className="w-[400px] relative text-center">
            {requestData.passenger_count}
            <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
          </div>
        </div>

        <div className="pl-52">
          {" "}
          <div className="flex justify-start mt-20">
            <div className=" flex">
              {" "}
              <div className="w-[300px] relative text-center">
                <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
              </div>{" "}
              <div className="w-[100px]">ผู้ขออนุญาต</div>
            </div>
          </div>
          <div className="flex justify-start mt-10">
            <div className=" flex">
              {" "}
              <div className="w-[300px] relative text-center">
                <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
              </div>{" "}
              <div className="w-[500px]">
                ผู้อำนวยการสำนัก/สวนสัตว์หรือผู้แทน
              </div>
            </div>
          </div>
          <div className="flex justify-start mt-10">
            <div className=" flex">
              {" "}
              <div className="w-[300px] relative text-center">
                {requestData?.created_at &&
                  new Date(requestData.created_at).toLocaleDateString("th-TH", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
              </div>{" "}
              <div className="w-[100px]">(วัน เดือน ปี)</div>
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-40">
          <div className="flex flex-col">
            <div className="w-[300px] relative text-center">
              <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
            </div>{" "}
            <div className="mt-4">
              (ลงนามผู้มีอำนาจอนุญาตใช้รถส่วนกลาง/รถรับรอง)
            </div>
            <div className="mt-4">
              วัน เดือน ปี ............ / .............. / ............
            </div>
          </div>
          <div className="flex">
            <div className="flex h-fit">
              <div className="w-[70px]">ตำแหน่ง</div>
              <div className="w-full relative text-center">
                {requestData.approver_id?.position}
                <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
              </div>
            </div>
            <div className="flex h-fit ml-4">
              <div className="w-[70px]">สังกัด</div>
              <div className="w-full relative text-center">
                {requestData.approver_id?.department}
                <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-10 ">
          <div className="border border-black p-2 font-bold">FM-SG-03/02</div>
        </div>
      </div>

      <div
        ref={pdfRef2}
        className="w-[794px] text-[14px] h-[1123px] relative border p-10 flex flex-col"
      >
        <div>อสส ๑๑๑๐/</div>
        <div className="grid grid-cols-3 gap-10">
          <div className="flex flex-col mt-4">ลว ๒๓ ก.ค. ๒๕๖๗</div>
          <div className="flex flex-col text-[16px] w-[400px] ml-[-90px] gap-2 font-bold text-center">
            <div className="">รายละเอียดแนบท้าย (เพิ่มเติม)</div>
            <div>บัญชีหมายเลข ๑ ใบอนุญาตใช้รถส่วนกลาง/รถรับรอง</div>
          </div>
        </div>
        <div className="w-full mt-4 flex justify-center">
          <div className="flex">
            <div className="w-[70px]">วันที่</div>
            <div className="w-full min-w-[50px] relative text-center">
              <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
            </div>
          </div>
          <div className="flex">
            <div className="w-[70px]">เดือน</div>
            <div className="w-full min-w-[50px] relative text-center">
              <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
            </div>
          </div>
          <div className="flex">
            <div className="w-[70px]">พ.ศ</div>
            <div className="w-full min-w-[50px] relative text-center">
              <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
            </div>
          </div>
        </div>
        <div className="mt-12 flex">
          <div className="font-bold underline">หน่วยงานที่ขอใช้(สังกัด)</div>
          <div className="grid grid-cols-6 gap-x-10 gap-y-4 ml-10">
            {arry.map((item) => (
              <div key={item.name} className="flex relative items-center gap-2">
                <div className="w-4 h-4 border border-black relative">
                  {item.value === requestData.user_id?.department && (
                    <span className="absolute text-[16px] top-[-10px] left-[0px]">
                      ✓
                    </span>
                  )}
                </div>
                {item.name}
                {item.value === value && item.name === "อื่นๆ." && (
                  <div className="absolute right-[-40px]">
                    {" "}
                    <div className="w-full relative text-center">
                      ข้อมูล
                      <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex">
          <div className="font-bold underline w-[200px]">
            สถานที่ไปปฏิบัติงาน
          </div>
          <div className="w-full relative text-center">
            {requestData.destination}
            <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
          </div>
        </div>
        <div className="mt-8 flex">
          <div className="font-bold underline">เหตุผล</div>
          <div className="w-full relative text-center">
            {requestData.purpose}
            <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
          </div>
        </div>
        <div className="font-bold underline w-[200px] mt-4">การเดินทาง</div>
        {requestData.travel_type === "วันเดียว" && (
          <div>
            <div className="font-bold underline mt-4 w-[120px]">วันเดียว</div>
            <div className="flex">
              <div className="flex flex-col">
                <div className="flex">
                  <div className="flex">
                    <div className="w-[70px]">วันที่</div>
                    <div className="w-full relative text-center">
                      {requestData.start_datetime &&
                        new Date(requestData.start_datetime).toLocaleDateString(
                          "th-TH",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          }
                        )}
                      <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
                    </div>
                  </div>
                  {/* <div className="flex gap-4">
                    <div className="w-[70px]">เดือน</div>
                    <div className="w-full relative text-center">
                      ข้อมูล
                      <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
                    </div>
                  </div>
                  <div className="flex">
                    <div className="w-[70px]">พ.ศ</div>
                    <div className="w-full relative text-center">
                      ข้อมูล
                      <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
                    </div>
                  </div> */}
                  <div className="flex">
                    <div className="w-[120px]">เวลาไป</div>
                    <div className="w-full relative text-center">
                      {requestData.start_datetime &&
                        new Date(requestData.start_datetime).toLocaleTimeString(
                          "th-TH",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
                    </div>
                    <div>น</div>
                  </div>
                  <div className="flex ml-4">
                    <div className="w-[120px]">เวลากลับ</div>
                    <div className="w-full relative text-center">
                      {requestData.end_datetime &&
                        new Date(requestData.end_datetime).toLocaleTimeString(
                          "th-TH",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
                    </div>
                    <div>น</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {requestData.travel_type === "หลายวัน" && (
          <div>
            <div className="font-bold underline mt-4 w-[120px]">หลายวัน</div>
            <div className="flex">
              <div className="flex flex-col">
                <div className="flex">
                  <div className="flex">
                    <div className="w-[70px]">วันที่</div>
                    <div className="w-full relative text-center">
                      {requestData.start_datetime &&
                        new Date(requestData.start_datetime).toLocaleDateString(
                          "th-TH",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          }
                        )}
                      <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
                    </div>
                  </div>
                  <div>ถึง</div>

                  <div className="flex">
                    <div className="w-[70px]">วันที่</div>
                    <div className="w-full relative text-center">
                      {requestData.end_datetime &&
                        new Date(requestData.end_datetime).toLocaleDateString(
                          "th-TH",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          }
                        )}
                      <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
                    </div>
                  </div>
                  <div className="flex ml-6">
                    <div className="w-[120px]">เวลาไป</div>
                    <div className="w-full relative text-center">
                      {requestData.start_datetime &&
                        new Date(requestData.start_datetime).toLocaleTimeString(
                          "th-TH",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
                    </div>
                    <div>น</div>
                  </div>
                  <div className="flex ml-4">
                    <div className="w-[120px]">เวลากลับ</div>
                    <div className="w-full relative text-center">
                      {requestData.end_datetime &&
                        new Date(requestData.end_datetime).toLocaleTimeString(
                          "th-TH",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
                    </div>
                    <div>น</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4 mt-6 justify-center ">
          {typeBack.map((item, index) => (
            <div key={index} className="flex relative items-center gap-2">
              <div className="w-4 h-4 border border-black relative">
                {item === valueBack && (
                  <span className="absolute text-[16px] top-[-10px] left-[0px]">
                    ✓
                  </span>
                )}
              </div>
              {item}
            </div>
          ))}
        </div>
        <div className="mt-10 flex justify-center">
          <div>ลงชื่อ</div>
          <div className="w-[200px] relative text-center">
            <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
          </div>
        </div>

        <div className="mt-4 flex justify-center">
          <div>ผู้ขอใช้รถยนต์ / ผู้แทน</div>
        </div>

        <div className="font-bold underline mt-6 mb-4 w-[220px]">
          สำหรับสำนักงานเลขาผู้อำนวยการ
        </div>

        <div className="border border-black p-2">
          <div className="font-bold underline  w-[220px]">การจัดรถยนต์</div>
          <div className="flex gap-4">
            {" "}
            <div className="flex">
              <div className="w-[80px]">ประเภทรถ</div>
              <div className="flex">
                <div className="w-full relative text-center">
                  {requestData.car_id?.type}
                  <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
                </div>{" "}
              </div>
            </div>
            <div className="flex">
              <div className="w-[60px]">ทะเบียน</div>
              <div className="flex">
                <div className="w-full relative text-center">
                  {requestData.car_id?.licensePlate}
                  <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
                </div>{" "}
              </div>
            </div>
            <div className="flex">
              <div className="w-[100px]">พนักงานขับรถ</div>
              <div className="flex">
                <div className="w-full relative text-center">
                  {requestData.driver_id?.firstName}{" "}
                  {requestData.driver_id?.lastName}
                  <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex mt-4">
            <div className="w-[70px]">วันที่</div>
            <div className="w-[300px] relative text-center">
              {requestData.start_datetime &&
                new Date(requestData.start_datetime).toLocaleDateString(
                  "th-TH",
                  {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  }
                )}
              <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
            </div>
          </div>
        </div>
        <div className="border border-black p-2">
          <div className="font-bold underline  w-[220px]">
            สำหรับพนักงานขับรถยนต์
          </div>
          <div className="flex gap-4">
            {" "}
            <div className="flex">
              <div className="w-[150px]">หมายเลขไมล์ ก่อนไป</div>
              <div className="flex">
                <div className="w-[100px] relative text-center">
                  <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
                </div>{" "}
              </div>
            </div>
            <div className="flex">
              <div className="w-[60px]">กลับ</div>
              <div className="flex">
                <div className="w-[100px] relative text-center">
                  <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex mt-4">
            <div className="w-[70px]">ลงชื่อ</div>
            <div className="w-[300px] relative text-center">
              <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
            </div>
          </div>
          <div className="flex mt-4">
            <div className="w-[70px]">วันที่</div>
            <div className="w-[300px] relative text-center">
              <div className="absolute inset-x-0 bottom-[-5px] border-b border-dotted border-black"></div>
            </div>
          </div>
        </div>

        <div className="border border-black font-bold p-2">
          <div className="w-full text-center underline">ข้อควรปฏิบัติ</div>
          <div>๑.ใบขอรถ ให้แนบสำเนาเรื่องเดิมที่ต้องการไปปฏิบัติงาน</div>
          <div>๒.ตรงเวลา มีผู้ต้องการใช้รถอื่นๆ รออยู่อีกหลายท่าน</div>
          <div>๓.ออกนอกเส้นทาง เกิดอุบัติเหตุ ผู้ขอใช้รถต้องรับผิดชอบ</div>
          <div>๔.ส่งใบขอรถล่วงหน้า และส่งก่อนเวลา ๑๖.๐๐ น.</div>
        </div>
      </div>
    </div>
  );
};

export default PDFPage;
