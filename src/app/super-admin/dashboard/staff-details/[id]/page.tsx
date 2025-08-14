// app/(whatever)/dashboard/staff-details/[id]/page.tsx
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon, ArrowLeft, User, Stethoscope } from "lucide-react";
import { CustomTabs } from "@/components/common/CustomTab";
import { mockDoctors, mockNurses, mockPatients } from "../../../mock-data";
import CalendarSection from "@/components/pages/dashboard/CalendarSection";

/* ---------------- Types ---------------- */
type Staff = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "DOCTOR" | "NURSE" | string;
  phone?: string;
  specialty?: string;
  medicalLicenseNumber?: string;
  isActive?: boolean;
  createdAt?: string;
  assignedPatients?: string[];
};

type PatientAppointment = {
  id: string;
  startTime: string;
  endTime: string;
  type?: string;
  status?: string;
  reason?: string;
  providerId?: string;
  providerName?: string;
};

type CalendarAppointment = {
  id: string;
  startDateISO: string;
  endDateISO?: string;
  patientName: string;
  type?: string;
  status?: string;
  providerName?: string;
  reason?: string;
};

type RoleForm = {
  role: string;
};

/* ---------------- Utilities ---------------- */
function getMonthWeeks(month: Date): Date[][] {
  const firstOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(firstOfMonth);
  start.setDate(firstOfMonth.getDate() - firstOfMonth.getDay()); // go back to Sunday

  const weeks: Date[][] = [];
  const cursor = new Date(start);
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

/* ---------------- Component ---------------- */
const StaffDetailsPage: React.FC = () => {
  // ---- stable hook order starts here ----

  // route param hook
  const params = useParams() as { id?: string } | undefined;
  const rawId = params?.id ?? "";
  const idParam = decodeURIComponent(rawId || "").trim();

  // initial staff list (derived once)
  const initialStaffList = useMemo(() => {
    return [...(mockDoctors as any as Staff[]), ...(mockNurses as any as Staff[])];
  }, []);

  // local mutable staff list state (for role assignment demo)
  const [localStaffList, setLocalStaffList] = useState<Staff[]>(initialStaffList);

  // derive the staff to show from localStaffList + idParam (stable; no setState inside conditional)
  const staff = useMemo<Staff | null>(() => {
    if (!idParam) return null;
    // by id first
    const byId = localStaffList.find((s) => s.id === idParam);
    if (byId) return byId;
    // otherwise match by firstName (case-insensitive) to support your earlier router.push by firstName
    const byFirstName = localStaffList.find(
      (s) => s.firstName?.toLowerCase() === idParam.toLowerCase()
    );
    return byFirstName ?? null;
  }, [idParam, localStaffList]);

  // react-hook-form (stable call; defaultValues intentionally static to keep hook shape stable)
  const { register, handleSubmit, setValue, reset } = useForm<RoleForm>({
    defaultValues: { role: "" },
  });

  // register role once (stable)
  useEffect(() => {
    register("role");
  }, [register]);

  // calendar view state and derived weeks
  const [viewMonth, setViewMonth] = useState<Date>(new Date());
  const weeks = useMemo(() => getMonthWeeks(viewMonth), [viewMonth]);

  // stable callbacks for calendar controls
  const onPrev = () => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const onNext = () => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  const onToday = () => setViewMonth(new Date());

  // when staff changes, reset the form role value to match (keeps behavior consistent)
  useEffect(() => {
    reset({ role: staff?.role ?? "" });
  }, [staff, reset]);

  // ---- stable hook order ends here ----

  if (!idParam) {
    return (
      <div className="p-6">
        <p className="text-gray-600">No staff identifier provided in the URL.</p>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12 text-gray-600">
            <p>Loading staff or staff not found.</p>
          </div>
        </div>
      </div>
    );
  }

  // derive appointments for this staff by scanning mockPatients (appointments providerId matches staff.id)
  const staffAppointments: PatientAppointment[] = useMemo(() => {
    const results: PatientAppointment[] = [];
    (mockPatients as any[]).forEach((p) => {
      (p.appointments ?? []).forEach((a: any) => {
        if (a.providerId === staff.id) {
          results.push({
            id: a.id,
            startTime: a.startTime,
            endTime: a.endTime,
            type: a.type,
            status: a.status,
            reason: a.reason,
            providerId: a.providerId,
            providerName: a.providerName,
          });
        }
      });
    });
    return results;
  }, [staff]);

  // Map to calendar appointments
  const calendarAppointments: CalendarAppointment[] = useMemo(
    () =>
      staffAppointments.map((a) => ({
        id: a.id,
        startDateISO: a.startTime,
        endDateISO: a.endTime,
        patientName: (() => {
          for (const p of (mockPatients as any[])) {
            if ((p.appointments ?? []).some((ap: any) => ap.id === a.id)) {
              return `${p.firstName} ${p.lastName}`;
            }
          }
          return "Patient";
        })(),
        type: a.type,
        status: a.status,
        providerName: a.providerName,
        reason: a.reason,
      })),
    [staffAppointments]
  );

  // compute age (guarded)
  const age =
    (staff as any).dateOfBirth
      ? new Date().getFullYear() - new Date((staff as any).dateOfBirth).getFullYear()
      : null;

  /* ---------- UI blocks (same layout as PatientDetailsPage) ---------- */

  const personalDetailsContent = (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-500">Full Name</Label>
              <p className="text-base font-medium">{staff.firstName} {staff.lastName}</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-500">Email</Label>
              <p className="text-base">{staff.email}</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-500">Phone</Label>
              <p className="text-base">{staff.phone ?? "—"}</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-500">Specialty</Label>
              <p className="text-base">{staff.specialty ?? "—"}</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-500">Medical License</Label>
              <p className="text-base">{staff.medicalLicenseNumber ?? "—"}</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-500">Assigned Patients</Label>
              <p className="text-base">{(staff.assignedPatients ?? []).length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-500">Status</Label>
              <Badge variant={staff.isActive ? "default" : "secondary"}>
                {staff.isActive ? "ACTIVE" : "INACTIVE"}
              </Badge>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Joined</Label>
              <p className="text-base">{staff.createdAt ?? "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const appointmentsContent = (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarIcon className="w-5 h-5 mr-2" />
            Appointments ({calendarAppointments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CalendarSection
            month={viewMonth}
            weeks={weeks}
            appointments={calendarAppointments as any}
            isLoading={false}
            onPrev={onPrev}
            onNext={onNext}
            onToday={onToday}
            showTitle={false}
          />
        </CardContent>
      </Card>
    </div>
  );

  const assignRoleContent = (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Stethoscope className="w-5 h-5 mr-2" />
            Assign Role
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit((data) => {
              // Update local staff list and keep UI in sync
              const updated: Staff = { ...staff, role: data.role };
              setLocalStaffList((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
              // in the real app you'd call the API here
              console.log("Assigned role:", updated);
            })}
            className="space-y-4"
          >
            <div>
              <Label className="text-sm">Role</Label>
              <Select onValueChange={(value) => setValue("role", value)}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder={staff.role} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DOCTOR">DOCTOR</SelectItem>
                  <SelectItem value="NURSE">NURSE</SelectItem>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                </SelectContent>
              </Select>
              <Input className="hidden" {...register("role")} />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => reset({ role: staff.role })}>
                Reset
              </Button>
              <Button type="submit">Assign Role</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );

  const tabs = [
    { id: "details", content: personalDetailsContent },
    { id: "appointments", content: appointmentsContent },
    { id: "assign-role", content: assignRoleContent },
  ];
  const tabTitles = ["Personal Details", "Appointments", "Assign Role"];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" className="mb-4" onClick={() => history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center space-x-4 mb-6">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                  staff.firstName ?? ""
                )}`}
              />
              <AvatarFallback className="bg-purple-100 text-purple-700">
                {(staff.firstName?.[0] ?? "") + (staff.lastName?.[0] ?? "")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {staff.firstName} {staff.lastName}
              </h1>
              <p className="text-lg text-gray-600">{staff.specialty ?? "—"} • {age ?? "—"}</p>
              <Badge variant="outline" className="mt-2">
                <User className="w-3 h-3 mr-1" />
                {staff.role}
              </Badge>
            </div>
          </div>
        </div>

        <CustomTabs tabTitles={tabTitles} tabs={tabs} />
      </div>
    </div>
  );
};

export default StaffDetailsPage;
