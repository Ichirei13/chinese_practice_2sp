import { notFound } from "next/navigation";
import { AppProvider } from "@/context/AppContext";
import { DEFAULT_SEMESTER, SEMESTER_IDS, isSemesterId } from "@/data";
import App from "../App";

// 静的エクスポートでは実行時にパスを増やせない。ここで列挙した学期だけを生成し、それ以外は 404。
export const dynamicParams = false;

// DEFAULT_SEMESTER は `/` が配信するため、ここでは生成しない。
export function generateStaticParams() {
  return SEMESTER_IDS.filter((id) => id !== DEFAULT_SEMESTER).map((semester) => ({ semester }));
}

export default async function Page({ params }: { params: Promise<{ semester: string }> }) {
  const { semester } = await params;
  if (!isSemesterId(semester) || semester === DEFAULT_SEMESTER) notFound();

  return (
    <AppProvider semester={semester}>
      <App />
    </AppProvider>
  );
}
