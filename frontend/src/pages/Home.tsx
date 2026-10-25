import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import ServicesPreview from "../components/ServicesPreview";
import WhyChooseUs from "../components/WhyChooseUs";
import QuickBook from "../components/QuickBook";
import Testimonials from "../components/Testimonials";
import BrandStrip from "../components/BrandStrip";
import ClosingCta from "../components/ClosingCta";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-ink">
      <Navbar />
      <Hero />
      <ServicesPreview />
      <WhyChooseUs />
      <QuickBook />
      <Testimonials />
      <BrandStrip />
      <ClosingCta />
      <Footer />
    </div>
  );
}
