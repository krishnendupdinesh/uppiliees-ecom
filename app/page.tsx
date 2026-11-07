import HeroSection from "@/components/home/HeroSection";
import BestSellersSection from "@/components/home/BestSellersSection";
import CategorySection from "@/components/home/CategorySection";
import ShopByNeedsSection from "@/components/home/ShopByNeedsSection";
import WhyChooseUsSection from "@/components/home/WhyChooseUsSection";



export default function Home() {
  return (
    <div>
      <HeroSection/>
      <CategorySection/>
      <BestSellersSection/>
      <WhyChooseUsSection/>
      <ShopByNeedsSection/>
    </div>
    
  );
}
