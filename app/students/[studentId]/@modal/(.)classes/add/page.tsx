import { ClassPreviewContent } from "@/app/students/[studentId]/classes/components/class-preview-content";
import { ClassModal } from "@/app/students/components/class-modal";

export default async function AddClassModalPage({
  params,
}: PageProps<"/students/[studentId]/classes/add">) {
  const { studentId } = await params;
  return (
    <ClassModal mode="add">
      <ClassPreviewContent mode="add" studentId={studentId} />
    </ClassModal>
  );
}
