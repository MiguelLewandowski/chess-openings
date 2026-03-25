interface CoachCardProps {
    comment: string;
    theme: string;
    isError?: boolean; // Tornado opcional com o '?'
}

export default function CoachCard({comment, theme, isError = false} : CoachCardProps) {
    return (
        <div className={`p-4 rounded-md ${isError ? 'bg-red-500' : 'bg-green-500'} text-white`}>
            <p className="text-sm">{comment}</p>
            <p className="text-xs text-gray-300">{theme}</p>
        </div>
    )
}