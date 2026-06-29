import Head from 'next/head';
import BlankLayout from '@/components/Layouts/BlankLayout';
import Button from '@/components/ui/Button';
import type { NextPageWithLayout } from './_app';

const NotFoundPage: NextPageWithLayout = () => {
    return (
        <>
            <Head>
                <title>Page Not Found — SmoothSurf Sacco</title>
            </Head>
            <div className="flex min-h-screen flex-col items-center justify-center bg-white px-5 text-center dark:bg-[#0e1726]">
                <p className="text-7xl font-bold text-primary">404</p>
                <h1 className="mt-3 text-xl font-semibold">Page not found</h1>
                <p className="mt-2 max-w-sm text-white-dark">The page you're looking for doesn't exist or may have been moved.</p>
                <Button href="/" className="mt-6">
                    Back to Home
                </Button>
            </div>
        </>
    );
};

NotFoundPage.getLayout = (page) => <BlankLayout>{page}</BlankLayout>;

export default NotFoundPage;
