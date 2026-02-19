import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

async function invokeDataMgmt(action: string, body: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke("data-management", {
    body: { action, ...body },
  });
  if (error) throw new Error(error.message ?? "Request failed");
  if (data?.error) throw new Error(data.error);
  return data;
}

// ── Export/Import ──
export function useExportStudents() {
  return useMutation({
    mutationFn: async () => {
      const data = await invokeDataMgmt("export_students");
      return data.rows as Record<string, unknown>[];
    },
  });
}

export function useExportTeachers() {
  return useMutation({
    mutationFn: async () => {
      const data = await invokeDataMgmt("export_teachers");
      return data.rows as Record<string, unknown>[];
    },
  });
}

export function useImportStudents() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: Record<string, string>[]) => {
      const data = await invokeDataMgmt("import_students", { rows });
      return data.imported as number;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["students"] }),
  });
}

export function useImportTeachers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: Record<string, string>[]) => {
      const data = await invokeDataMgmt("import_teachers", { rows });
      return data.imported as number;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teachers"] }),
  });
}

// ── Types ──
export interface Student {
  id: string;
  user_id: string | null;
  nisn: string;
  full_name: string;
  birth_place: string;
  birth_date: string | null;
  gender: string;
  address: string;
  parent_name: string;
  parent_phone: string;
  enrollment_year: number | null;
  status: string;
  created_at: string;
  class_students?: { class_id: string; classes: { id: string; name: string; academic_year: string } }[];
}

export interface Teacher {
  id: string;
  user_id: string | null;
  nip: string;
  full_name: string;
  subject: string;
  education: string;
  phone: string;
  status: string;
  position: string;
  created_at: string;
}

export interface ClassData {
  id: string;
  name: string;
  academic_year: string;
  homeroom_teacher_id: string | null;
  teachers: { id: string; full_name: string } | null;
  class_students: { id: string; student_id: string; students: { id: string; full_name: string; nisn: string } }[];
  created_at: string;
}

// ── Students ──
export function useStudents() {
  return useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const data = await invokeDataMgmt("list_students");
      return data.students as Student[];
    },
  });
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => invokeDataMgmt("create_student", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["students"] }),
  });
}

export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => invokeDataMgmt("update_student", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["students"] }),
  });
}

export function useDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invokeDataMgmt("delete_student", { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["students"] }),
  });
}

// ── Teachers ──
export function useTeachers() {
  return useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const data = await invokeDataMgmt("list_teachers");
      return data.teachers as Teacher[];
    },
  });
}

export function useCreateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => invokeDataMgmt("create_teacher", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teachers"] }),
  });
}

export function useUpdateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => invokeDataMgmt("update_teacher", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teachers"] }),
  });
}

export function useDeleteTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invokeDataMgmt("delete_teacher", { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teachers"] }),
  });
}

// ── Classes ──
export function useClasses() {
  return useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const data = await invokeDataMgmt("list_classes");
      return data.classes as ClassData[];
    },
  });
}

export function useCreateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => invokeDataMgmt("create_class", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["classes"] }),
  });
}

export function useUpdateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => invokeDataMgmt("update_class", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["classes"] }),
  });
}

export function useDeleteClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invokeDataMgmt("delete_class", { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["classes"] }),
  });
}

export function useAddStudentToClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, studentId }: { classId: string; studentId: string }) =>
      invokeDataMgmt("add_student_to_class", { class_id: classId, student_id: studentId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["classes"] }),
  });
}

export function useRemoveStudentFromClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, studentId }: { classId: string; studentId: string }) =>
      invokeDataMgmt("remove_student_from_class", { class_id: classId, student_id: studentId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["classes"] }),
  });
}
