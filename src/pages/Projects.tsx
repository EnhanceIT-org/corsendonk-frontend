import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const Projects = () => {
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
                <span className="text-gray-900">Projecten</span>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="mt-8 text-center">
            <h1 className="pb-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Eerdere Projecten
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
            Hier presenteren we een selectie van onze projecten waarmee we bedrijven hebben geholpen hun processen te optimaliseren. 
            Momenteel werken we eraan om meer praktijkvoorbeelden te verzamelen die we binnenkort met je kunnen delen.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2">
            {/* Placeholder Project 1 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
              <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                <img src="LI006.png" className="absolute top-0 left-0 h-full w-full rounded-lg object-cover" alt="" />
              </div>
              <h3 className="pt-4 text-3xl font-semibold mb-4">Tattletoad</h3>
              <p className="text-gray-600">
                  Een project waarbij we een spel ontwikkelden om kinderen op een speelse manier te leren lezen. 
                  Tegelijkertijd maakten we het werk van leerkrachten eenvoudiger door leestesten en verhalen volledig te automatiseren. 
                  Daarnaast zorgden we voor een helder overzicht van de prestaties van de leerlingen, zodat leerkrachten deze makkelijk konden opvolgen.
              </p>
            </div>

            {/* Placeholder Project 2 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
              <div className="h-48 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg mb-6"></div>
              <h3 className="text-xl font-semibold mb-4">Project Naam 2</h3>
              <p className="text-gray-600">
                Korte beschrijving van het project en de oplossing. Binnenkort meer details beschikbaar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Projects;