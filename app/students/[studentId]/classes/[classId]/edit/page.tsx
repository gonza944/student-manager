import { ClassPreviewContent } from "../../components/class-preview-content";

export default async function EditClassPage({
  params,
}: PageProps<"/students/[studentId]/classes/[classId]/edit">) {
  const { studentId, classId } = await params;
  return (
    <ClassPreviewContent mode="edit" studentId={studentId} classId={classId} />
  );
}
