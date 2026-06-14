interface CoachCardProps {
    comment: string;
    theme: string;
    isError?: boolean;
}

export default function CoachCard({ comment, theme, isError = false }: CoachCardProps) {
    return (
        <div className={`p-4 rounded-2xl border ${
            isError
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                : 'bg-slate-800 border-slate-700 text-slate-200'
        }`}>
            <p className="text-sm leading-relaxed">{comment}</p>
            <p className="text-xs text-slate-400 mt-1.5 font-medium">{theme}</p>
        </div>
    );
}
