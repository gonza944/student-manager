import { ClassFormContent } from "../../components/class-form-content";

export default async function EditClassPage({
  params,
}: PageProps<"/students/[studentId]/classes/[classId]/edit">) {
  const { studentId, classId } = await params;
  return (
    <ClassFormContent mode="edit" studentId={studentId} classId={classId} />
  );
}
