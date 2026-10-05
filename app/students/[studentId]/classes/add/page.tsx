import { ClassPreviewContent } from "../components/class-preview-content";

export default async function AddClassPage({
  params,
}: PageProps<"/students/[studentId]/classes/add">) {
  const { studentId } = await params;
  return <ClassPreviewContent mode="add" studentId={studentId} />;
}
