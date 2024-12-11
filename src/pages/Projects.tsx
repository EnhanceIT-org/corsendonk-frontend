import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";

const Projects = () => {
  return (
    <main className="pt-[72px]">
      <div className="bg-gradient-to-bl from-purple-50 via-indigo-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink as={Link} to="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>Projecten</BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="mt-8 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-6">
              Eerdere Projecten
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
              Hier tonen we enkele van onze projecten die bedrijven hebben geholpen hun processen te optimaliseren. 
              Momenteel werken we aan het verzamelen van cases die we kunnen delen. Kom binnenkort terug voor meer informatie!
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2">
            {/* Placeholder Project 1 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
              <div className="h-48 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg mb-6"></div>
              <h3 className="text-xl font-semibold mb-4">Project Naam 1</h3>
              <p className="text-gray-600">
                Korte beschrijving van het project en de oplossing. Binnenkort meer details beschikbaar.
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