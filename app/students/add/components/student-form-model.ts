import {
  contactChannels,
  studentAvatarKeys,
  studentLevels,
  studentSources,
  studentThemeColors,
  type StudentDto,
} from "@/lib/students/contracts";

export type StudentFormValues = {
  name: string;
  email: string;
  phone: string;
  nationalityCode: string;
  timeZone: string;
  preferredContactChannel: (typeof contactChannels)[number];
  level: (typeof studentLevels)[number];
  preferences: string[];
  interests: string[];
  learningGoals: string;
  source: (typeof studentSources)[number];
  hourlyRate: string;
  isActive: boolean;
  avatarKey: (typeof studentAvatarKeys)[number];
  themeColor: (typeof studentThemeColors)[number];
};

export type UpdateStudentForm = <Field extends keyof StudentFormValues>(
  field: Field,
  value: StudentFormValues[Field],
) => void;

export const initialStudentForm: StudentFormValues = {
  name: "",
  email: "",
  phone: "",
  nationalityCode: "AR",
  timeZone: "America/Argentina/Buenos_Aires",
  preferredContactChannel: "email",
  level: "A1",
  preferences: [],
  interests: [],
  learningGoals: "",
  source: "private",
  hourlyRate: "20",
  isActive: true,
  avatarKey: "avatar-01",
  themeColor: "coral",
};

export function getInitialForm(
  student: StudentDto | undefined,
  minorFactor: number,
): StudentFormValues {
  return student
    ? {
        name: student.name,
        email: student.email,
        phone: student.phone ?? "",
        nationalityCode: student.nationalityCode,
        timeZone: student.timeZone,
        preferredContactChannel: student.preferredContactChannel,
        level: student.level,
        preferences: student.preferences,
        interests: student.interests,
        learningGoals: student.learningGoals ?? "",
        source: student.source,
        hourlyRate: (student.hourlyRateMinor / minorFactor).toString(),
        isActive: student.isActive,
        avatarKey: student.avatarKey,
        themeColor: student.themeColor,
      }
    : initialStudentForm;
}
