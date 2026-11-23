import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

import { StudentsQueryProvider } from "@/app/students/queries/students-query-provider";

export default async function DashboardLayout({ children, classModal }: LayoutProps<"/">) {
  const { Classes } = await getMessages();

  return (
    <NextIntlClientProvider messages={{ Classes }}>
      <StudentsQueryProvider>
        {children}
        {classModal}
      </StudentsQueryProvider>
    </NextIntlClientProvider>
  );
}
