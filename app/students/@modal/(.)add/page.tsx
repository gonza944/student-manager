import { StudentFormContent } from "../../add/components/student-form-content";
import { StudentFormModal } from "../../components/student-form-modal";

export default function AddStudentModalPage() {
  return (
    <StudentFormModal mode="add">
      <StudentFormContent />
    </StudentFormModal>
  );
}
