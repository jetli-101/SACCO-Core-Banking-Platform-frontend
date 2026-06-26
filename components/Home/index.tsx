import Navbar from './Navbar';
import Hero from './Hero';
import SocialProof from './SocialProof';
import Problem from './Problem';
import Solutions from './Solutions';
import AIDemo from './AIDemo';
import Compliance from './Compliance';
import Pricing from './Pricing';
import Migration from './Migration';
import Testimonial from './Testimonial';
import SecurityTrust from './SecurityTrust';
import FinalCTA from './FinalCTA';
import Footer from './Footer';

const Home = () => {
    return (
        <div className="bg-white dark:bg-[#0e1726]">
            <Navbar />
            <Hero />
            <SocialProof />
            <Problem />
            <Solutions />
            <AIDemo />
            <Compliance />
            <Pricing />
            <Migration />
            <Testimonial />
            <SecurityTrust />
            <FinalCTA />
            <Footer />
        </div>
    );
};

export default Home;
