interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    siblingCount?: number;
}

const getPageNumbers = (currentPage: number, totalPages: number, siblingCount: number) => {
    const start = Math.max(1, currentPage - siblingCount);
    const end = Math.min(totalPages, currentPage + siblingCount);
    const pages: number[] = [];
    for (let page = start; page <= end; page++) {
        pages.push(page);
    }
    return pages;
};

const Pagination = ({ currentPage, totalPages, onPageChange, siblingCount = 1 }: PaginationProps) => {
    if (totalPages <= 1) {
        return null;
    }

    const pages = getPageNumbers(currentPage, totalPages, siblingCount);

    return (
        <ul className="flex items-center justify-center space-x-1 rtl:space-x-reverse">
            <li>
                <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-primary-light hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-primary dark:hover:text-white-light"
                >
                    ‹
                </button>
            </li>
            {pages[0] > 1 && (
                <li>
                    <span className="px-1 text-white-dark">…</span>
                </li>
            )}
            {pages.map((page) => (
                <li key={page}>
                    <button
                        type="button"
                        onClick={() => onPageChange(page)}
                        className={`flex h-8 w-8 items-center justify-center rounded-full font-semibold transition ${
                            page === currentPage ? 'bg-primary text-white' : 'hover:bg-primary-light hover:text-primary dark:hover:bg-primary dark:hover:text-white-light'
                        }`}
                    >
                        {page}
                    </button>
                </li>
            ))}
            {pages[pages.length - 1] < totalPages && (
                <li>
                    <span className="px-1 text-white-dark">…</span>
                </li>
            )}
            <li>
                <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-primary-light hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-primary dark:hover:text-white-light"
                >
                    ›
                </button>
            </li>
        </ul>
    );
};

export default Pagination;
