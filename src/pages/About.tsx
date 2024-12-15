import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const About = () => {
  return (
    <main className="pt-[60px]">
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-[calc(100vh-72px)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <Link to="/" className="text-gray-600 hover:text-primary">Home</Link>
              </BreadcrumbItem>
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <BreadcrumbItem>
                <span className="text-gray-900">Over Ons</span>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="mt-8 text-center">
            <h1 className="pb-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Over EnhanceIT
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
              EnhanceIT is opgericht door twee gepassioneerde IT-professionals met een gedeelde visie: 
              bedrijven helpen groeien met slimme technologische oplossingen.
            </p>
          </div>

          <div className="mt-16 grid gap-12 sm:grid-cols-2 lg:gap-20">
            {/* Team Member 1 */}
            <div className="text-center">
              <div className="relative mx-auto h-40 w-40 overflow-hidden rounded-full bg-gradient-to-r from-blue-400 to-indigo-400">
                <img
                  src="/pf.jpeg"
                  alt="Team Member 1"
                  className="h-full w-full object-cover"
                />
              </div>
              <h3 className="mt-6 text-xl font-semibold">Raynaud Cornille</h3>
              <p className="mt-4 text-gray-600 leading-relaxed">
              Ik ben Raynaud, een masterstudent IT met een passie voor programmeren en automatisering. Ik haal energie uit het oplossen van complexe problemen en streef ernaar om dit op een eenvoudige en effectieve manier te doen. Naast mijn werk in IT ben ik een actief sporter, lees ik graag en help ik een <a href="https://www.ugentracing.be/" target="_blank" rel="noopener noreferrer">raceauto</a> bouwen!
              </p>
            </div>

            {/* Team Member 2 */}
            <div className="text-center">
              <div className="relative mx-auto h-40 w-40 overflow-hidden rounded-full bg-gradient-to-r from-blue-400 to-indigo-400">
                <img
                  src="/pf_emile.jpeg"
                  alt="Team Member 2"
                  className="h-full w-full object-cover"
                />
              </div>
              <h3 className="mt-6 text-xl font-semibold">Emile Descheemaeker</h3>
              <p className="mt-4 text-gray-600 leading-relaxed">
              Ik ben Emile, recent afgestudeerd aan de Universiteit Gent met een master in Management en IT.
              Ik specialiseer me in het slaan van bruggen tussen bedrijfsdoelstellingen en de IT-oplossingen die nodig
              zijn om die doelen te realiseren.
              Mijn sterkte ligt in het optimaliseren van processen 
              en het verbinden van strategie met technologie om duurzame waarde te creëren. 
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default About;