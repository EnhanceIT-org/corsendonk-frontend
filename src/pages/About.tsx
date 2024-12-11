import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const About = () => {
  return (
    <main className="pt-[72px]">
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

          <div className="mt-8 mb-12 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
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
                  src="/placeholder.svg"
                  alt="Team Member 1"
                  className="h-full w-full object-cover"
                />
              </div>
              <h3 className="mt-6 text-xl font-semibold">John Doe</h3>
              <p className="mt-4 text-gray-600 leading-relaxed">
                Ik ben John, een masterstudent IT met een passie voor programmeren en automatisering. 
                Mijn doel is om bedrijven te ondersteunen bij het oplossen van complexe problemen op een eenvoudige manier.
              </p>
            </div>

            {/* Team Member 2 */}
            <div className="text-center">
              <div className="relative mx-auto h-40 w-40 overflow-hidden rounded-full bg-gradient-to-r from-blue-400 to-indigo-400">
                <img
                  src="/placeholder.svg"
                  alt="Team Member 2"
                  className="h-full w-full object-cover"
                />
              </div>
              <h3 className="mt-6 text-xl font-semibold">Jane Smith</h3>
              <p className="mt-4 text-gray-600 leading-relaxed">
                Ik ben Jane, gespecialiseerd in informatietechnologie en procesoptimalisatie. 
                Ik streef ernaar om technologie toegankelijk en effectief te maken voor KMO's.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default About;