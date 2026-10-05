import { ClassPreviewContent } from "@/app/students/[studentId]/classes/components/class-preview-content";
import { ClassModal } from "@/app/students/components/class-modal";

export default async function EditClassModalPage({
  params,
}: PageProps<"/students/[studentId]/classes/[classId]/edit">) {
  const { studentId, classId } = await params;
  return (
    <ClassModal mode="edit">
      <ClassPreviewContent mode="edit" studentId={studentId} classId={classId} />
    </ClassModal>
  );
}
