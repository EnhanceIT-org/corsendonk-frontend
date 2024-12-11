import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <div className="relative overflow-hidden bg-white pt-[72px]">
      <div className="relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Technologie die uw bedrijf{" "}
              <span className="gradient-text">vooruithelpt</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
              Bij EnhanceIT ondersteunen we KMO's door repetitieve taken te
              elimineren en processen te verbeteren. Samen bouwen we aan slimme
              oplossingen voor een efficiëntere toekomst.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                to="/diensten"
                className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover transition-colors duration-200 flex items-center gap-2"
              >
                Ontdek onze diensten
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;