import { IconLoader2 } from '@tabler/icons-react';

// Full-page loading state shown while a dashboard page's primary data is first
// fetching — swapped out for the real content once loading finishes, distinct from
// DataGrid's own small inline spinner used on manual refresh.
const PageLoader = () => (
    <div className="flex min-h-[50vh] w-full items-center justify-center">
        <IconLoader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
);

export default PageLoader;
