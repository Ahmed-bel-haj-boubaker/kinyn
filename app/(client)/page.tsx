import HeroSection from "./component/home/HeroSection";
import ProductSlider from "./component/home/ProductSlider";
import FeaturedCollection from "./component/home/FeaturedCollection";
import Testimonials from "./component/home/Testimonials";
import Newsletter from "./component/home/Newsletter";
import KinynSection from "./component/home/KinynSection";
import FAQSection from "./component/home/FAQSection";

export default function Page() {
  return (
    <>
      <HeroSection />
      <ProductSlider />
      <FeaturedCollection />

      <KinynSection />

      <Testimonials />
      <Newsletter />
      <FAQSection />
    </>
  );
}
