import { getAllOpenings } from "@/services/opening.service"
import Link from "next/link";

export default async function OpeningsCatalogPage() {
    const openings = await getAllOpenings();
    return <>
        {openings.map((opening) => {
            return <Link href={`/openings/${opening.slug}`} key={opening.id}>
                <div className="border p-4 rounded shadow hover:bg-gray-50"> 
                    <h2>{opening.name}</h2>
                    <p>{opening.description}</p>
                    <p>Lições disponíveis: {opening.lessons.length}</p>
                    <br />
                </div>
            </Link>
        })}

    </>
}