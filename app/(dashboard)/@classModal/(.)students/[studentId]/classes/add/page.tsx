import { ClassFormContent } from "@/app/students/[studentId]/classes/components/class-form-content";
import { ClassModal } from "@/app/students/components/class-modal";

export default async function AddDashboardClassModalPage({
  params,
}: PageProps<"/students/[studentId]/classes/add">) {
  const { studentId } = await params;
  return (
    <ClassModal mode="add">
      <ClassFormContent mode="add" studentId={studentId} />
    </ClassModal>
  );
}
