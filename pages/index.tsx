import Head from 'next/head';
import BlankLayout from '@/components/Layouts/BlankLayout';
import Home from '@/components/Home';
import type { NextPageWithLayout } from './_app';

const LandingPage: NextPageWithLayout = () => {
    return (
        <>
            <Head>
                <title>SmoothSurf Sacco — Cloud Core Banking for Kenyan SACCOs</title>
            </Head>
            <Home />
        </>
    );
};

LandingPage.getLayout = (page) => <BlankLayout>{page}</BlankLayout>;

export default LandingPage;
