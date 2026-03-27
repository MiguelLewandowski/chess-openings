import { getOpeningBySlug } from "@/services/opening.service";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function OpeningTrackPage({ params }: { params: { slug: string } }) {
  const resolvedParams = await params;
  
  const opening = await getOpeningBySlug(resolvedParams.slug);

  if (!opening) {
    notFound();
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">{opening.name}</h1>
      <p className="mb-8">{opening.description}</p>
      
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Trilha de Aprendizagem</h2>
        {opening.lessons.map(lesson => (
            <Link href={`/lessons/${lesson.id}`} key={lesson.id} className="border p-4 rounded bg-white">
                Lesson {lesson.order}: {lesson.title}
            </Link>
        ))}
      </div>
    </div>
  );
}