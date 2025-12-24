export function SkeletonBox({ className }) {
    return (
        <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}></div>
    )
}

export function SkeletonText({ lines = 1, className }) {
    return (
        <div className={className}>
            {[...Array(lines)].map((_, i) => (
                <SkeletonBox key={i} className="h-4 w-full mb-2 last:mb-0" />
            ))}
        </div>
    )
}

export function SkeletonAvatar({ size = 'w-12 h-12', className }) {
    return (
        <SkeletonBox className={`rounded-full ${size} ${className}`} />
    )
}

export function SkeletonCard({ className }) {
    return (
        <div className={`p-4 border rounded-lg shadow-sm ${className}`}>
            <div className="flex gap-4">
                <SkeletonAvatar />
                <div className="flex-1">
                    <SkeletonText lines={2} />
                </div>
            </div>
        </div>
    )
}

export function SkeletonTableRow({ cols = 4 }) {
    return (
        <tr>
            {[...Array(cols)].map((_, i) => (
                <td key={i} className="px-6 py-4 whitespace-nowrap">
                    <SkeletonBox className="h-4 w-24" />
                </td>
            ))}
        </tr>
    )
}

export function AccountManagementSkeleton() {
    return (
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="max-w-7xl mx-auto bg-white dark:bg-gray-800 shadow-xl transition-colors">
                <div className="flex flex-col lg:flex-row">

                    {/* Left Sidebar Skeleton */}
                    <div className="lg:w-1/3 p-8 border-r dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <div className="flex flex-col items-center mb-6">
                            <SkeletonBox className="w-48 h-48 rounded-3xl mb-4" />
                            <div className="flex gap-2 w-full justify-center">
                                <SkeletonBox className="w-24 h-10 rounded-lg" />
                                <SkeletonBox className="w-24 h-10 rounded-lg" />
                            </div>
                        </div>

                        <div className="space-y-4 w-full">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="bg-white dark:bg-gray-700 p-5 rounded-xl shadow-sm">
                                    <SkeletonBox className="w-16 h-4 mb-2" />
                                    <SkeletonBox className="w-32 h-8" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Content Skeleton */}
                    <div className="lg:w-2/3 p-8">
                        <div className="mb-12">
                            <SkeletonBox className="w-48 h-10 mb-6" />
                            <SkeletonBox className="w-full h-12 rounded-full mb-4" />
                        </div>

                        <div>
                            <SkeletonBox className="w-48 h-10 mb-6" />
                            <div className="grid grid-cols-4 gap-4">
                                {[1, 2, 3, 4].map(i => (
                                    <SkeletonBox key={i} className="h-32 rounded-xl" />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
