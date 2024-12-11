import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { FileSpreadsheet, BarChart3, GitFork, Workflow, ArrowRight } from "lucide-react";

const Services = () => {
  const services = [
    {
      icon: FileSpreadsheet,
      title: "Automatische Rapportgeneratoren",
      description: "Verminder menselijke fouten en bespaar tijd met software die rapporten automatisch genereert."
    },
    {
      icon: BarChart3,
      title: "Interne Dashboards",
      description: "Realtime data binnen handbereik, overzichtelijk en op maat gemaakt."
    },
    {
      icon: GitFork,
      title: "Gegevensscraping",
      description: "Verzamel cruciale data efficiënt met op maat gemaakte scrapingtools."
    },
    {
      icon: Workflow,
      title: "Workflow Optimalisatie",
      description: "Analyseer, verbeter en automatiseer uw processen voor maximale efficiëntie."
    }
  ];

  return (
    <main className="pt-[72px]">
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink as={Link} to="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>Diensten</BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="mt-8 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-6">
              Wat wij bieden
            </h1>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2">
            {services.map((service, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-3 rounded-lg text-white">
                    <service.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold">{service.title}</h3>
                </div>
                <p className="text-gray-600 leading-relaxed">{service.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">Klaar om uw bedrijf efficiënter te maken?</h2>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-full hover:from-blue-600 hover:to-indigo-600 transition-all"
            >
              Contacteer ons
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Services;