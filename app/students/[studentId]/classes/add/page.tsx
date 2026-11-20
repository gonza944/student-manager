import { ClassFormContent } from "../components/class-form-content";

export default async function AddClassPage({
  params,
}: PageProps<"/students/[studentId]/classes/add">) {
  const { studentId } = await params;
  return <ClassFormContent mode="add" studentId={studentId} />;
}
