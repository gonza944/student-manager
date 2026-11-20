import { ClassFormContent } from "@/app/students/[studentId]/classes/components/class-form-content";
import { ClassModal } from "@/app/students/components/class-modal";

export default async function EditClassModalPage({
  params,
}: PageProps<"/students/[studentId]/classes/[classId]/edit">) {
  const { studentId, classId } = await params;
  return (
    <ClassModal mode="edit">
      <ClassFormContent mode="edit" studentId={studentId} classId={classId} />
    </ClassModal>
  );
}
