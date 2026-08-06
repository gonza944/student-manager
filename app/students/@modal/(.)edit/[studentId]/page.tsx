import { StudentFormContent } from "../../../add/components/student-form-content";
import { StudentFormModal } from "../../../components/student-form-modal";

export default async function EditStudentModalPage({
  params,
}: PageProps<"/students/edit/[studentId]">) {
  const { studentId } = await params;

  return (
    <StudentFormModal mode="edit">
      <StudentFormContent studentId={studentId} />
    </StudentFormModal>
  );
}
